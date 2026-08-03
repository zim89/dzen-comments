/**
 * Проверка очередей BullMQ: files (resize-image) и comments-ws (ws-broadcast).
 * Запуск: node scripts/test-queues.mjs
 */
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { io } from 'socket.io-client';
import sharp from 'sharp';

const BASE_URL = process.env.API_URL ?? 'http://localhost:4040';
const IMAGE_MAX_WIDTH = 320;
const IMAGE_MAX_HEIGHT = 240;
const POLL_MS = 500;
const RESIZE_TIMEOUT_MS = 15_000;
const WS_TIMEOUT_MS = 10_000;

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

function queueFailedCount(queueName) {
  return Number(redisCli('LLEN', `bull:${queueName}:failed`));
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
  if (!response.ok) throw new Error(`GET /captcha failed: ${response.status}`);
  const { id } = await response.json();
  return { id, value: readCaptchaFromRedis(id) };
}

async function postComment({ captchaId, captchaValue, text, file }) {
  const form = new FormData();
  form.append('userName', 'queuetest');
  form.append('email', 'queue@test.com');
  form.append('text', text);
  form.append('captchaId', captchaId);
  form.append('captchaValue', captchaValue);
  if (file) {
    form.append('file', file);
  }

  const response = await fetch(`${BASE_URL}/comments`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`POST /comments failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function getComment(id) {
  const response = await fetch(`${BASE_URL}/comments/${id}`);
  if (!response.ok)
    throw new Error(`GET /comments/${id} failed: ${response.status}`);
  return response.json();
}

async function createLargeJpeg(width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 40, g: 120, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();
}

async function waitForImageResize(commentId) {
  const started = Date.now();

  while (Date.now() - started < RESIZE_TIMEOUT_MS) {
    const comment = await getComment(commentId);
    const attachment = comment.attachment;

    if (
      attachment?.type === 'IMAGE' &&
      attachment.width != null &&
      attachment.height != null &&
      attachment.width <= IMAGE_MAX_WIDTH &&
      attachment.height <= IMAGE_MAX_HEIGHT
    ) {
      return attachment;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  const last = await getComment(commentId);
  throw new Error(
    `Resize timeout. Last attachment: ${JSON.stringify(last.attachment)}`,
  );
}

function waitForWsEvent(socket, eventName, timeoutMs = WS_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timeout waiting for "${eventName}"`));
    }, timeoutMs);

    function onEvent(payload) {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
      resolve(payload);
    }

    socket.on(eventName, onEvent);
  });
}

async function main() {
  log('1/6', 'Health check');
  const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
  if (health.status !== 'ok' || health.redis !== 'ok') {
    fail(`Health bad: ${JSON.stringify(health)}`);
  }
  pass(`API ok, redis=${health.redis}`);

  log('2/6', 'Очередь files — загрузка большого изображения 800×600');
  const imageBuffer = await createLargeJpeg(800, 600);
  pass(`Сгенерирован JPEG ${imageBuffer.length} bytes`);

  const captchaImage = await fetchCaptcha();
  const imageFile = new File([imageBuffer], 'queue-test.jpg', {
    type: 'image/jpeg',
  });

  const commentWithImage = await postComment({
    captchaId: captchaImage.id,
    captchaValue: captchaImage.value,
    text: `Queue image test ${Date.now()}`,
    file: imageFile,
  });

  if (!commentWithImage.attachment) {
    fail('Ответ API без attachment');
  }
  if (commentWithImage.attachment.type !== 'IMAGE') {
    fail(`Ожидался IMAGE, получен ${commentWithImage.attachment.type}`);
  }
  pass(
    `Комментарий ${commentWithImage.id}, attachment ${commentWithImage.attachment.id}`,
  );

  log('3/6', 'Очередь files — ожидаем job resize-image (≤320×240)');
  const resized = await waitForImageResize(commentWithImage.id);
  pass(
    `Ресайз выполнен: ${resized.width}×${resized.height}, size=${resized.size} bytes`,
  );

  if (resized.width > IMAGE_MAX_WIDTH || resized.height > IMAGE_MAX_HEIGHT) {
    fail(`Размер превышает лимит ТЗ: ${resized.width}×${resized.height}`);
  }

  log('4/6', 'Очередь files — TXT не должен попадать в resize');
  const txtPath = join(tmpdir(), `queue-test-${Date.now()}.txt`);
  writeFileSync(txtPath, 'plain text attachment for queue test');
  const captchaText = await fetchCaptcha();
  const textFile = new File(
    [Buffer.from('plain text attachment for queue test')],
    'queue-test.txt',
    { type: 'text/plain' },
  );

  const commentWithText = await postComment({
    captchaId: captchaText.id,
    captchaValue: captchaText.value,
    text: `Queue txt test ${Date.now()}`,
    file: textFile,
  });
  unlinkSync(txtPath);

  const textAttachment = commentWithText.attachment;
  if (!textAttachment || textAttachment.type !== 'TEXT') {
    fail('TXT attachment не создан');
  }
  if (textAttachment.width != null || textAttachment.height != null) {
    fail('TXT не должен иметь width/height после обработки');
  }
  pass(`TXT attachment ok: ${textAttachment.originalName}`);

  log('5/6', 'Очередь comments-ws — ws-broadcast после POST');
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
      resolve();
    });
    socket.on('connect_error', reject);
  });
  pass(`Socket connected: ${socket.id}`);

  const captchaWs = await fetchCaptcha();
  const wsPromise = waitForWsEvent(socket, 'comment:created');
  const wsComment = await postComment({
    captchaId: captchaWs.id,
    captchaValue: captchaWs.value,
    text: `Queue ws test ${Date.now()}`,
  });
  const wsEvent = await wsPromise;

  if (wsEvent.id !== wsComment.id) {
    fail(`WS id mismatch: ${wsEvent.id} vs ${wsComment.id}`);
  }
  pass(`comment:created через очередь comments-ws: ${wsEvent.id}`);
  socket.disconnect();

  log('6/6', 'BullMQ — failed jobs');
  const filesFailed = queueFailedCount('files');
  const wsFailed = queueFailedCount('comments-ws');

  if (filesFailed > 0) fail(`bull:files:failed = ${filesFailed}`);
  if (wsFailed > 0) fail(`bull:comments-ws:failed = ${wsFailed}`);

  pass(`files failed: ${filesFailed}, comments-ws failed: ${wsFailed}`);

  console.log('\n🎉 Очереди files и comments-ws работают корректно\n');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
