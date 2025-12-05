from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models
from .database import AsyncSessionLocal, Base, engine
from .routers import (
    competitions,
    health,
    heats,
    participants,
    rounds,
    scores,
    users,
)

app = FastAPI(title="Battle Judging API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(health.router)
app.include_router(competitions.router)
app.include_router(participants.router)
app.include_router(rounds.router)
app.include_router(heats.router)
app.include_router(scores.router)
app.include_router(users.router)


async def seed_default_judge(async_session: AsyncSession) -> None:
    """Ensure at least one judge exists so default scoring works."""
    result = await async_session.execute(select(func.count()).select_from(models.User))
    user_count = result.scalar_one()
    if user_count:
        return

    default_judge = models.User(
        first_name="Главный",
        last_name="Судья",
        role="judge",
    )
    async_session.add(default_judge)
    await async_session.commit()


@app.on_event("startup")
async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_default_judge(session)
