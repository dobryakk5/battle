from typing import Iterable, List

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from . import models


async def get_or_404(session: AsyncSession, stmt, message: str = "Entity not found"):
    result = await session.execute(stmt)
    entity = result.scalar_one_or_none()
    if entity is None:
        raise HTTPException(status_code=404, detail=message)
    return entity


async def create_user(
    db: AsyncSession,
    first_name: str,
    last_name: str,
    role: str,
    email: str | None = None,
    telegram_id: int | None = None,
) -> models.User:
    user = models.User(
        first_name=first_name,
        last_name=last_name,
        role=role,
        email=email,
        telegram_id=telegram_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_users(db: AsyncSession) -> List[models.User]:
    result = await db.execute(select(models.User).order_by(models.User.last_name))
    return result.scalars().all()


async def get_user_by_telegram(db: AsyncSession, telegram_id: int) -> models.User | None:
    result = await db.execute(select(models.User).filter(models.User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def create_competition(db: AsyncSession, title: str, date=None, location=None) -> models.Event:
    event = models.Event(title=title, date=date, location=location)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def list_competitions(db: AsyncSession) -> List[models.Event]:
    stmt = (
        select(models.Event)
        .options(selectinload(models.Event.categories).selectinload(models.Category.criteria))
        .order_by(models.Event.date.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_competition(db: AsyncSession, event_id: int) -> models.Event:
    stmt = (
        select(models.Event)
        .options(selectinload(models.Event.categories).selectinload(models.Category.criteria))
        .filter(models.Event.id == event_id)
    )
    return await get_or_404(db, stmt, "Competition not found")


async def create_category(db: AsyncSession, event_id: int, name: str, type: str, criteria: Iterable[str]) -> models.Category:
    category = models.Category(event_id=event_id, name=name, type=type)
    db.add(category)
    await db.flush()
    criteria_objs = [
        models.Criterion(category_id=category.id, name=crit.strip())
        for crit in criteria
        if crit.strip()
    ]
    db.add_all(criteria_objs)
    await db.commit()
    await db.refresh(
        category,
        attribute_names=["criteria"],
        with_for_update=False,
    )
    return category


async def list_categories(db: AsyncSession, event_id: int) -> List[models.Category]:
    result = await db.execute(
        select(models.Category).filter(models.Category.event_id == event_id).order_by(models.Category.name)
    )
    return result.scalars().all()


async def create_participant(
    db: AsyncSession,
    event_id: int,
    category_id: int,
    first_name: str,
    last_name: str,
    number: int | None = None,
    role: str | None = None,
    gender: str | None = None,
) -> models.Participant:
    participant = models.Participant(
        event_id=event_id,
        category_id=category_id,
        first_name=first_name,
        last_name=last_name,
        number=number,
        role=role,
        gender=gender,
    )
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant


async def list_participants(db: AsyncSession, category_id: int) -> List[models.Participant]:
    stmt = (
        select(models.Participant)
        .filter(models.Participant.category_id == category_id)
        .order_by(models.Participant.number.asc().nullsfirst(), models.Participant.last_name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def list_all_participants_by_event(db: AsyncSession, event_id: int) -> List[models.Participant]:
    """Get all participants for a competition across all categories."""
    stmt = (
        select(models.Participant)
        .join(models.Category)
        .filter(models.Category.event_id == event_id)
        .order_by(models.Participant.number.asc().nullsfirst(), models.Participant.last_name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_participant(
    db: AsyncSession,
    participant_id: int,
    competition_id: int,
) -> models.Participant:
    stmt = (
        select(models.Participant)
        .filter(models.Participant.id == participant_id, models.Participant.event_id == competition_id)
    )
    return await get_or_404(db, stmt, "Participant not found")


async def update_participant(
    db: AsyncSession,
    participant_id: int,
    competition_id: int,
    updates: dict,
) -> models.Participant:
    participant = await get_participant(db, participant_id, competition_id)
    for key, value in updates.items():
        setattr(participant, key, value)
    await db.commit()
    await db.refresh(participant)
    return participant


async def create_round(db: AsyncSession, event_id: int, category_id: int, round_type: str, stage_format: str | None = None) -> models.Round:
    round_ = models.Round(
        event_id=event_id,
        category_id=category_id,
        round_type=round_type,
        stage_format=stage_format,
    )
    db.add(round_)
    await db.commit()
    await db.refresh(round_)
    return round_


async def list_rounds(db: AsyncSession, event_id: int) -> List[models.Round]:
    stmt = (
        select(models.Round)
        .filter(models.Round.event_id == event_id)
        .order_by(models.Round.stage_format, models.Round.round_type)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_round(db: AsyncSession, round_id: int) -> models.Round:
    stmt = select(models.Round).filter(models.Round.id == round_id)
    return await get_or_404(db, stmt, "Round not found")


async def upsert_score(
    db: AsyncSession,
    *,
    participant_id: int,
    judge_id: int,
    round_id: int,
    heat_id: int | None,
    criterion_id: int | None,
    value: float,
) -> models.Score:
    stmt = (
        select(models.Score)
        .filter(
            models.Score.participant_id == participant_id,
            models.Score.judge_id == judge_id,
            models.Score.round_id == round_id,
            (models.Score.criterion_id.is_(None) if criterion_id is None else models.Score.criterion_id == criterion_id),
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    score = result.scalar_one_or_none()
    if score:
        score.score = value
        score.heat_id = heat_id
    else:
        score = models.Score(
            participant_id=participant_id,
            judge_id=judge_id,
            round_id=round_id,
            heat_id=heat_id,
            criterion_id=criterion_id,
            score=value,
        )
        db.add(score)
    await db.commit()
    await db.refresh(score)
    return score


async def get_scores_by_heat(db: AsyncSession, heat_id: int) -> List[models.Score]:
    result = await db.execute(
        select(models.Score)
        .filter(models.Score.heat_id == heat_id)
        .order_by(models.Score.participant_id)
    )
    return result.scalars().all()


async def update_heat_status(db: AsyncSession, heat_id: int, status: str) -> models.Heat:
    stmt = (
        select(models.Heat)
        .options(
            selectinload(models.Heat.round).selectinload(models.Round.event),
            selectinload(models.Heat.round).selectinload(models.Round.category),
        )
        .filter(models.Heat.id == heat_id)
    )
    heat = await get_or_404(db, stmt, "Heat not found")
    heat.status = status
    await db.commit()
    await db.refresh(
        heat,
        attribute_names=["round"],
    )
    return heat
