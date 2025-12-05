# Battle Judging Platform

Use one Python virtual environment located at the repo root (`.venv`) for all backend/bot work so dependencies stay centralized:

```
python -m venv .venv
source .venv/bin/activate   # or `.venv\Scripts\activate` on Windows
pip install --upgrade pip
pip install -r requirements.txt
```

The root `requirements.txt` delegates to `backend/requirements.txt` and
`bot/requirements.txt`, meaning each component still expresses its own subset
but you install everything with a single command.

The repo collects the artifacts described in `Doc/` and wires them into a starter implementation:

| Component | Stack |
| --- | --- |
| Frontend | Next.js **15.5.6** (app router, TypeScript, shadcn-inspired Material layout) |
| Backend | FastAPI + SQLAlchemy (asyncpg) + Pydantic models connected to PostgreSQL |
| Telegram helper | Python bot using `aiogram` |

## Backend (`/backend`)

1. Copy `backend/.env.example` to `.env` and fill the PostgreSQL URL, Telegram token, and admin base URL.
2. Install dependencies: `pip install -r requirements.txt`.
3. Apply the SQL schema from `Doc/database_sql_schema.sql` (or use Alembic/migrations). В дев‑сборке FastAPI также вызывает `Base.metadata.create_all()` на старте, чтобы не получать `relation "events" does not exist`, но для боевого окружения всё равно закладывайте миграции.
4. Start the API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.

Key features:

- CRUD for `competitions`, `categories`, `participants`, `rounds`, `scores`, and `users`.
- Автосоздание базового пользователя‑судьи (ID 1) при первом запуске, чтобы форма судьи на фронтенде сразу могла сохранять оценки.
- Async session usage via SQLAlchemy with `asyncpg` so every handler operates over `AsyncSession`.
- Heat distribution endpoint (`POST /rounds/{round_id}/distribute`) that implements the logic from `Doc/heats_distribution.md`.
- Light Pydantic coverage in `app/schemas.py` so the API stays type-safe for frontend/bot producers.

## Frontend (`/frontend`)

1. Copy `.env.example` and set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI server plus (optionally) `NEXT_PUBLIC_DEFAULT_JUDGE_ID` so the scoring form knows кого использовать по умолчанию.
2. Install Node dependencies (`next 15.5.6`) via `npm install`.
3. Run the dev server: `npm run dev`.

The app exposes:

- `/` — список соревнований с кнопкой «Создать». После создания пользователь автоматически переходит к `/battle/{id}`.
- `/battle/[id]` — карточка конкретного соревнования с формами «Создать категорию» и «Добавить участника».
- `/judge` — material-inspired heat cards and quick scoring form tailored for judges (все цифры берутся из FastAPI: количество соревнований, раундов и статусы заходов).
- `/judge/heat/[id]` — форма для ввода конкретных оценок; кнопка «Отправить» пишет напрямую в `/scores`.
- `/admin` — admin controls for heat distribution, exports, operation guidance, и форма «Добавить участника» которая бьёт в `/competitions/{id}/participants`.

## Telegram Bot (`/bot`)

1. Reuse `backend/.env` for credentials.
2. Install bot deps: `pip install -r requirements.txt`.
3. Start the bot: `python -m bot.main`.

Bot commands:

- `/start` — information and commands list.
- `/login` — instructions for linking.
- `/mytasks` — fetches `/users/me` and competition list from FastAPI using the caller’s Telegram ID.
- `/help` — short reference.

The bot pulls judges from `GET /users/me?telegram_id={id}` and shows top competitions from `/competitions`.

## Next Steps

1. Wire authentication/permissions (JWT/Cookie + Telegram code) so judges/admins see only their data.
2. Implement live updates (WebSocket or polling) on the frontend and export hooks for Excel/PDF.
3. Add unit/integration tests for heat distribution, score aggregation, and bot handlers.
