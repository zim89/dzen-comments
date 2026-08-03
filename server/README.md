# Server — REST API

Backend для SPA «Комментарии»: NestJS-приложение с REST API, WebSocket, работой с PostgreSQL и Redis.

Общее описание проекта и запуск всего стека — в [README](../README.md) в корне репозитория.

## Стек

- NestJS 11
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- Redis (ioredis)
- BullMQ (очередь задач)
- JWT (авторизация модератора)

## Структура

```
src/
├── main.ts
├── app.module.ts
├── prisma/          # PrismaModule, подключение к PostgreSQL
├── redis/           # RedisModule
├── cache/           # CacheService (Redis)
├── captcha/         # CAPTCHA (svg-captcha + Redis)
├── files/           # загрузка, очередь resize-image, GET /files/:id
├── comments/        # CRUD, пагинация, дерево ответов, WebSocket gateway
├── auth/            # JWT login, guard, @Public()
└── health/          # GET /health

uploads/             # вложения (не в git)

prisma/
├── schema.prisma    # модели данных
└── seed.ts          # тестовые данные и модератор

database/
└── schema.sql       # SQL DDL (корень репозитория)

prisma.config.ts     # URL подключения к БД (Prisma 7)
```

## Переменные окружения

Скопируй шаблон и при необходимости отредактируй значения:

```bash
cp .env.example .env
```

- `DATABASE_URL` — PostgreSQL
- `REDIS_URL` — Redis
- `PORT` — порт API (по умолчанию 4040)
- `JWT_SECRET`, `JWT_EXPIRES_IN` — для модератора
- `MODERATOR_EMAIL`, `MODERATOR_PASSWORD` — учётные данные модератора для seed

Перед запуском API подними инфраструктуру из корня репозитория:

```bash
docker compose up -d postgres redis
```

Или весь стек в Docker (см. [корневой README](../README.md#запуск-в-docker-полный-стек)).

## Установка и запуск

```bash
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

API: http://localhost:4040

### Production

```bash
npm run build
npm run start:prod
```

### Docker

Образ собирается из `server/Dockerfile`. При старте контейнера entrypoint выполняет `prisma migrate deploy` и (по умолчанию) `prisma db seed`. Вложения хранятся в volume `uploads_data` (`/app/uploads`).

## Prisma

```bash
npx prisma generate      # сгенерировать клиент
npm run prisma:migrate   # применить миграции
npm run prisma:seed      # тестовые комментарии и модератор
npm run prisma:studio    # UI для просмотра данных
```

Конфигурация подключения к БД — в `prisma.config.ts`, схема моделей — в `prisma/schema.prisma`.  
SQL DDL для просмотра структуры таблиц — в `database/schema.sql` (корень репозитория).

## API

### Реализовано

- `GET /health` — проверка API, PostgreSQL и Redis
- `GET /captcha` — получение CAPTCHA (`id`, SVG `image`)
- `GET /comments` — список корневых комментариев (пагинация, сортировка, дерево ответов, Redis cache)
- `GET /comments/:id` — комментарий по id с вложенными ответами
- `POST /comments` — создание корневого комментария (`multipart/form-data`, CAPTCHA, опциональный файл)
- `POST /comments/:id/replies` — ответ на комментарий (`multipart/form-data`, CAPTCHA, опциональный файл)
- `POST /comments/preview` — предпросмотр санитизированного HTML
- `GET /files/:id` — отдача вложения (JPG/PNG/GIF/TXT)
- `POST /auth/login` — вход модератора (`email`, `password`) → `{ accessToken }`
- `DELETE /comments/:id` — удаление комментария (JWT, каскад по ответам)

### WebSocket (Socket.IO)

- Namespace: default (`/`)
- `comment:created` — новый корневой комментарий
- `comment:reply` — новый ответ на комментарий
- Триггер: `comment.created` → очередь `comments-ws` → job `ws-broadcast`

## Скрипты

```bash
npm run start:dev    # разработка с hot-reload
npm run build        # сборка
npm run lint         # ESLint
```

## Проверка

```bash
curl http://localhost:4040/health
```

```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```
