/**
 * Ручная проверка WebSocket + очереди comments-ws.
 * Запуск: node scripts/test-ws.mjs
 */
import { execSync } from 'node:child_process';
import { io } from 'socket.io-client';

const BASE_URL = process.env.API_URL ?? 'http://localhost:4040';
const TIMEOUT_MS = 10_000;

function log(step, message) {
  console.log(`\n[${step}] ${message}`);
}

function pass(message) {
  console.log(`  ✅ ${message}`);
}

function fail(message) {
  console.error(`  ❌ ${message}`);
  process.exit(1);
}

function redisCli(...args) {
  return execSync(
    `docker exec comments-redis redis-cli ${args.map((a) => JSON.stringify(a)).join(' ')}`,
    { encoding: 'utf8' },
  ).trim();
}

function readCaptchaFromRedis(captchaId) {
  const raw = redisCli('GET', `captcha:${captchaId}`);

  if (!raw || raw === '(nil)') {
    throw new Error(`CAPTCHA not found in Redis for id ${captchaId}`);
  }

  return JSON.parse(raw);
}

async function fetchCaptcha() {
  const response = await fetch(`${BASE_URL}/captcha`);
  if (!response.ok) {
    throw new Error(`GET /captcha failed: ${response.status}`);
  }

  const { id } = await response.json();
  const value = readCaptchaFromRedis(id);
  return { id, value };
}

async function createComment({ captchaId, captchaValue, parentId }) {
  const form = new FormData();
  form.append('userName', 'wstest');
  form.append('email', 'ws@test.com');
  form.append('text', `WS test ${Date.now()}`);
  form.append('captchaId', captchaId);
  form.append('captchaValue', captchaValue);

  const url = parentId
    ? `${BASE_URL}/comments/${parentId}/replies`
    : `${BASE_URL}/comments`;

  const response = await fetch(url, { method: 'POST', body: form });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`POST ${url} failed: ${response.status} ${body}`);
  }

  return response.json();
}

function waitForEvent(socket, eventName, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timeout waiting for "${eventName}" (${timeoutMs}ms)`));
    }, timeoutMs);

    function onEvent(payload) {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
      resolve(payload);
    }

    socket.on(eventName, onEvent);
  });
}

async function checkRedisQueueIdle() {
  const keys = redisCli('KEYS', 'bull:comments-ws:*')
    .split('\n')
    .filter(Boolean);

  const failed = redisCli('LLEN', 'bull:comments-ws:failed');

  return { keys, failedCount: Number(failed) };
}

async function main() {
  log('1/5', 'Health check');
  const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
  if (health.status !== 'ok' || health.redis !== 'ok') {
    fail(`Health bad: ${JSON.stringify(health)}`);
  }
  pass(`API ok, redis=${health.redis}, db=${health.db}`);

  log('2/5', 'Socket.IO connect');
  const socket = io(BASE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false,
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Socket connect timeout')),
      5000,
    );
    socket.on('connect', () => {
      clearTimeout(timer);
      pass(`Connected, socket.id=${socket.id}`);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  log('3/5', 'Root comment → ожидаем comment:created');
  const captcha1 = await fetchCaptcha();
  const createdPromise = waitForEvent(socket, 'comment:created');
  const root = await createComment({
    captchaId: captcha1.id,
    captchaValue: captcha1.value,
  });
  const createdEvent = await createdPromise;

  if (createdEvent.id !== root.id) {
    fail(
      `comment:created id mismatch: event=${createdEvent.id} api=${root.id}`,
    );
  }
  if (createdEvent.parentId !== null) {
    fail(
      `comment:created should have parentId=null, got ${createdEvent.parentId}`,
    );
  }
  pass(`comment:created received for ${root.id}`);

  log('4/5', 'Reply → ожидаем comment:reply');
  const captcha2 = await fetchCaptcha();
  const replyPromise = waitForEvent(socket, 'comment:reply');
  const reply = await createComment({
    captchaId: captcha2.id,
    captchaValue: captcha2.value,
    parentId: root.id,
  });
  const replyEvent = await replyPromise;

  if (replyEvent.id !== reply.id) {
    fail(`comment:reply id mismatch: event=${replyEvent.id} api=${reply.id}`);
  }
  if (replyEvent.parentId !== root.id) {
    fail(
      `comment:reply parentId mismatch: event=${replyEvent.parentId} expected=${root.id}`,
    );
  }
  pass(`comment:reply received for ${reply.id} (parent ${root.id})`);

  log('5/5', 'Очередь BullMQ comments-ws');
  const { keys, failedCount } = await checkRedisQueueIdle();
  if (failedCount > 0) {
    fail(`bull:comments-ws:failed has ${failedCount} job(s)`);
  }
  pass(`failed jobs: ${failedCount}, bull keys present: ${keys.length > 0}`);

  socket.disconnect();
  console.log('\n🎉 WebSocket + очередь comments-ws работают корректно\n');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
