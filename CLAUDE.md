# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Battle Judging Platform** for managing dance competition judging and scoring. It's a full-stack application with three components:
- **Frontend**: Next.js 15.5.7 (App Router, TypeScript, Server Components)
- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL
- **Bot**: Telegram bot using aiogram for judge notifications

## Development Commands

### Backend (FastAPI)
```bash
# Setup (use shared .venv at repo root)
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run dev server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database schema auto-applies on startup via Base.metadata.create_all()
# For production, apply Doc/database_sql_schema.sql manually or use migrations
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev    # runs on port 3003
npm run build  # production build
npm run lint   # ESLint check
```

### Telegram Bot
```bash
# Reuses backend .env for credentials
python -m bot.main
```

## Architecture Overview

### Directory Structure
```
/battle
├── frontend/          # Next.js app (port 3003)
│   ├── app/          # App Router pages (Server Components by default)
│   ├── components/   # Reusable Client Components
│   └── lib/api.ts    # Centralized API client with typed endpoints
├── backend/          # FastAPI app (port 8000)
│   └── app/
│       ├── routers/  # API endpoint modules
│       ├── services/ # Business logic (heat distribution, notifications)
│       ├── models.py # SQLAlchemy ORM (9 tables)
│       ├── schemas.py # Pydantic request/response models
│       └── crud.py   # Database operations
├── bot/              # Telegram bot (async polling)
└── Doc/              # SQL schema, API specs, Russian specification
```

### API Structure

Base URL: `http://localhost:8000`

All endpoints use async handlers with dependency injection:
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

Key endpoints:
- `/competitions` - Create/list competitions
- `/competitions/{id}/categories` - Create category with criteria
- `/competitions/{id}/participants` - Add participants
- `/rounds` - Create rounds and manage heats
- `/rounds/{round_id}/distribute` - Auto-distribute participants to heats
- `/rounds/{round_id}/heats` - Get heats with participants
- `/heats/{heat_id}` - Get heat details with criteria
- `/scores` - Submit judge scores

### Database Design (9 Tables)

Core entities and relationships:
- **events** (competitions) → **categories** → **participants**
- **rounds** → **heats** → **heat_participants** (junction)
- **criteria** (scoring criteria per category)
- **scores** (judge_id + participant_id + criterion_id + heat_id)
- **users** (judges and administrators)
- **final_places** (rankings for pro/master categories)

Key constraints:
- Cascade delete on foreign keys
- Unique constraints on (round_id, heat_number) and (round_id, participant_id)
- Default judge "Главный Судья" (ID 1) auto-created on first startup

### Frontend Pages & Components

**Pages (Server Components):**
- `/` - Competition list with create button
- `/battle/[id]` - Competition details, category/participant management
- `/battle/[id]/round/[roundId]/manual` - Manual heat creation
- `/battle/[id]/round/[roundId]/manual/[heatId]` - Edit specific heat
- `/judge` - Judge dashboard with heat cards
- `/judge/heat/[heatId]` - Scoring form for a heat
- `/admin` - Admin panel (heat distribution, exports)

**Key Components (Client Components):**
- `ScoreForm` - Judge scoring with participant selector and criteria inputs
- `DistributeHeatsForm` - Auto heat distribution with max_in_heat input
- `ManualHeatBuilder` - Manual heat creation/editing interface (supports create and edit modes)
- `CreateCompetitionForm`, `CreateCategoryForm`, `ParticipantForm`

**Styling:**
- Dark theme: `bg-slate-950 text-white`
- Material Design inspired with custom classes: `.material-card`, `.material-button`, `.chip`, `.glass-panel`
- Tailwind CSS mixed with custom globals.css

### Heat Distribution Logic

Located in `backend/app/services/heats.py`:
- If `max_in_heat == 2`: Pairs male/female participants (couple format)
- Otherwise: Distributes participants evenly across heats
- First heat starts as "in_progress", others as "waiting"
- Participants ordered by ID for consistency

See `Doc/heats_distribution.md` for detailed algorithm.

## Configuration

### Backend `.env`
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/battle
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_LINK_BASE=http://localhost:3003/admin
```

### Frontend `.env`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_JUDGE_ID=1
```

### Shared Python Environment

Use one `.venv` at repo root for both backend and bot. The root `requirements.txt` aggregates `backend/requirements.txt` and `bot/requirements.txt`.

## Import Path Patterns

Frontend uses relative imports. From deeply nested pages like:
`app/battle/[id]/round/[roundId]/manual/[heatId]/page.tsx`

Navigate up 8 levels to reach frontend root:
```typescript
import { ManualHeatBuilder } from "../../../../../../../components/manual-heat-builder";
import { fetchHeatDetail } from "../../../../../../../lib/api";
```

Consider setting up path aliases in `tsconfig.json` if relative paths become unwieldy.

## Key Business Logic

### Score Submission
- Judge submits score for participant + criterion in a heat
- Scores linked to round_id, heat_id, participant_id, judge_id, criterion_id
- Scores recorded even if criterion is not set

### Participant Gender Handling
- Optional field supporting male/female/null
- Used for heat distribution pairing logic when max_in_heat=2

### Heat Status Workflow
- `waiting` → `in_progress` → `finished`
- Updated via `PATCH /heats/{heat_id}/status`
- Judge can update status from ScoreForm component

## Documentation Files

- `Doc/database_sql_schema.sql` - Complete PostgreSQL schema
- `Doc/database_architecture.md` - Entity relationships
- `Doc/api_endpoints.md` - REST endpoint specifications
- `Doc/heats_distribution.md` - Heat grouping algorithm
- `Doc/тз_система_судейства_танцевальных_конкурсов.md` - Full Russian specification

## Technology Notes

### Backend
- **Async/await everywhere**: All DB operations use AsyncSession
- **No ORM lazy loading**: Use explicit joins or separate queries
- **Pydantic v2**: Request/response validation with type hints
- **asyncpg**: PostgreSQL async driver (faster than psycopg async)
- **CORS**: Enabled for all origins in dev (restrict in production)

### Frontend
- **No component library**: Custom Material-inspired components
- **Simple fetch API**: No axios or other HTTP client
- **Server Components by default**: Use 'use client' directive for interactivity
- **TypeScript strict mode**: All new code should be fully typed
- **No path aliases**: Uses relative imports (can be improved)

### Bot
- **aiogram 3.1+**: Modern async Telegram bot framework
- **httpx**: Async HTTP client for FastAPI communication
- **Shared .env**: Uses backend configuration

## Next Steps (TODOs)

1. Authentication/permissions (JWT/Cookie + Telegram code linking)
2. Live updates (WebSocket or polling) for real-time score updates
3. Export to Excel/PDF functionality
4. Unit/integration tests
5. Alembic migrations for schema versioning
6. Path aliases in tsconfig.json to simplify imports
