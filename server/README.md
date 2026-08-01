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
└── health/          # GET /health

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
docker compose up -d
```

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
- `GET /comments` — список корневых комментариев (пагинация, сортировка, дерево ответов)
- `GET /comments/:id` — комментарий по id с вложенными ответами
- `POST /comments` — создание корневого комментария
- `POST /comments/:id/replies` — ответ на комментарий
- `POST /comments/preview` — предпросмотр санитизированного HTML

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
