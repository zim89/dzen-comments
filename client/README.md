# Client — SPA «Комментарии»

React + Vite + shadcn/ui + TanStack Query.

## Стек

- React 19 + TypeScript + Vite
- shadcn/ui (Radix UI)
- react-hook-form + Zod
- TanStack Query
- Sonner (toast)
- socket.io-client (live-обновления)

## Запуск

**Важно:** в dev-клиенте `/api` и `/socket.io` проксируются на `http://localhost:4040`. Без API запросы вернут ошибку.

### Локальная разработка

1. Инфраструктура:
```bash
docker compose up -d postgres redis
```

2. API (`server/`):
```bash
cd server
cp .env.example .env   # если ещё нет
npm install
npm run start:dev      # слушает :4040
```

3. Клиент:
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

### Docker (полный стек)

Из корня репозитория:

```bash
docker compose up --build -d
```

Приложение: http://localhost:8080 (nginx проксирует `/api` и `/socket.io` на контейнер `api`).

## Сборка

```bash
npm run build
npm run preview
```

## Функции

- Список комментариев: пагинация (25), сортировка (userName, email, createdAt)
- Каскадные ответы (дерево)
- Форма: userName, email, homePage, text, CAPTCHA, файл (JPG/PNG/GIF/TXT)
- Preview (`POST /comments/preview`)
- Панель тегов `[i][strong][code][a]`
- WebSocket: live-обновление при `comment:created` / `comment:reply`
- Вход модератора (JWT) и удаление комментариев
- Lightbox для изображений
