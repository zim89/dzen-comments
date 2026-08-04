# Комментарии

SPA-приложение для публикации и просмотра комментариев с поддержкой вложенных ответов, вложений и защиты от спама.

## Демо

**Продакшен:**

- Приложение: https://spa-comments.vercel.app
- API: https://spa-comments-api.onrender.com
- Health: https://spa-comments-api.onrender.com/health

Клиент на Vercel, бэкенд (PostgreSQL, Redis, NestJS) на Render.

**Локально (полный стек в Docker):**

```bash
docker compose up --build -d
```

- Приложение: http://localhost:8080
- API через nginx: http://localhost:8080/api/health

Подробнее — раздел [Запуск в Docker](#запуск-в-docker-полный-стек).

## Возможности

### Комментарии

- добавление корневого комментария через форму (боковая панель Sheet)
- ответ на любой комментарий — без ограничения глубины вложенности
- ответы на одном уровне: от новых к старым
- список корневых комментариев с пагинацией (25 на страницу)
- сортировка по имени пользователя, email и дате (по возрастанию и убыванию)
- по умолчанию новые комментарии отображаются первыми (LIFO)

### Форма

- **User Name** — латиница и цифры (обязательно)
- **E-mail** — формат email (обязательно)
- **Home page** — URL (необязательно)
- **CAPTCHA** — проверка по изображению (обязательно)
- **Text** — HTML-теги: `<a>`, `<code>`, `<i>`, `<strong>`
- **Файл** — JPG, GIF, PNG (до 5 МБ) или TXT до 100 КБ (необязательно)
- предпросмотр текста и превью вложения перед отправкой

### Вложения

- изображения уменьшаются на сервере до 320×240 px (очередь BullMQ + sharp)
- просмотр изображений в lightbox (модальное окно)

### Безопасность

- санитизация HTML, защита от XSS
- Prisma — защита от SQL-инъекций
- валидация на сервере (DTO) и клиенте (Zod)
- JWT для модератора (удаление комментариев)

### Дополнительно

- панель вставки HTML-тегов
- WebSocket — обновление списка в реальном времени
- Redis: кэш списка комментариев и CAPTCHA
- BullMQ: ресайз изображений, WS-broadcast

## Стек

- **Backend:** NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO, JWT
- **Frontend:** React, Vite, shadcn/ui, TanStack Query, react-hook-form, Zod
- **Инфраструктура:** Docker Compose (PostgreSQL, Redis, API, client/nginx)

## Структура репозитория

```
├── docker-compose.yml        # полный стек (postgres, redis, api, client)
├── docker-compose.prod.yml   # оверрайды для VDS (порт 80, без публикации БД)
├── .env.docker.example       # переменные для продакшена
├── database/
│   └── schema.sql            # DDL схемы БД (PostgreSQL)
├── server/                   # REST API + Dockerfile
├── client/                   # SPA + nginx Dockerfile
└── docs/                     # план реализации
```

Подробнее: [server/README.md](server/README.md), [client/README.md](client/README.md).

## Git

Основная разработка велась в `main` с поэтапными коммитами (инфраструктура → backend → frontend).

Крупные этапы — через feature-ветки и Pull Request (Docker, деплой).

## Запуск в Docker (полный стек)

Рекомендуемый способ **локально протестировать весь проект** (PostgreSQL, Redis, API, клиент) без Render/Vercel:

```bash
docker compose up --build -d
```

- Приложение: http://localhost:8080
- API через nginx: http://localhost:8080/api/health
- Миграции и seed выполняются автоматически при старте API (`RUN_SEED=true` по умолчанию)

Проверка:

```bash
curl http://localhost:8080/api/health
curl -I http://localhost:8080
```

Остановка:

```bash
docker compose down
```

### Продакшен (VDS)

```bash
cp .env.docker.example .env
# отредактируйте JWT_SECRET, MODERATOR_PASSWORD; RUN_SEED=true только при первом деплое

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Клиент на порту **80**, PostgreSQL и Redis не публикуются наружу.

## Запуск для разработки

### Требования

- Node.js 20+
- Docker и Docker Compose

### 1. Переменные окружения

```bash
cp server/.env.example server/.env
```

Заполните `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` и при необходимости `MODERATOR_EMAIL` / `MODERATOR_PASSWORD`.

Пример для локального Docker:

```env
DATABASE_URL=postgresql://comments:comments@localhost:5432/comments
REDIS_URL=redis://localhost:6379
PORT=4040
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=7d
```

### 2. PostgreSQL и Redis

Только инфраструктура (без API и клиента в контейнерах):

```bash
docker compose up -d postgres redis
```

### 3. Сервер

```bash
cd server
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

API: http://localhost:4040

### 4. Клиент

```bash
cd client
npm install
npm run dev
```

Приложение: http://localhost:5173 (прокси `/api` и `/socket.io` → `:4040`).

### 5. Проверка

```bash
curl http://localhost:4040/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```

Скрипты smoke-тестов (нужен запущенный API):

```bash
cd server
node scripts/test-ws.mjs
node scripts/test-queues.mjs
```

## Модератор (после seed)

По умолчанию (если не переопределено в `.env`):

- Email: `moderator@example.com`
- Пароль: `moderator123`

Вход через кнопку «Модератор» в шапке приложения.

## Схема БД

Файл [database/schema.sql](database/schema.sql) — DDL для PostgreSQL (таблицы, индексы, связи).

В MySQL Workbench: **File → Open SQL Script** — просмотр и сравнение структуры. Синтаксис PostgreSQL; `.mwb` не используется.

Миграции Prisma: `server/prisma/migrations/`.

## API

- `GET /health` — состояние сервиса
- `GET /captcha` — CAPTCHA (`id`, SVG `image`)
- `GET /comments` — список корневых комментариев (`?page=1&limit=25&sortField=createdAt&sortOrder=desc`)
- `GET /comments/:id` — комментарий с деревом ответов
- `POST /comments` — создать комментарий (`multipart/form-data`, CAPTCHA, опциональный файл)
- `POST /comments/:id/replies` — ответ на комментарий
- `POST /comments/preview` — предпросмотр санитизированного HTML
- `GET /files/:id` — вложение
- `POST /auth/login` — вход модератора → `{ accessToken }`
- `DELETE /comments/:id` — удаление (JWT)

### WebSocket (Socket.IO)

Подключение: тот же хост, что и API, path `/socket.io`.

События:

- `comment:created` — новый корневой комментарий
- `comment:reply` — новый ответ

## Деплой (продакшен)

- **Клиент:** [Vercel](https://vercel.com) — статическая сборка Vite (`client/`), env `VITE_API_URL` указывает на API.
- **API, PostgreSQL, Redis:** [Render](https://render.com) — Web Service (Docker из `server/`), managed Postgres и Key Value (Redis).

Альтернатива для self-hosted: один VPS + `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` (см. выше).
