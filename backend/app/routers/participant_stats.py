from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .. import models
from ..database import get_db

router = APIRouter(prefix="/participants", tags=["participant_stats"])


class ScoreDetail(BaseModel):
    id: int
    score: float
    judge_name: str
    criterion_name: str | None
    round_id: int
    heat_id: int | None

    class Config:
        from_attributes = True


class HeatDetail(BaseModel):
    id: int
    heat_number: int
    status: str
    round_id: int
    round_type: str
    stage_format: str | None
    category_name: str
    event_title: str

    class Config:
        from_attributes = True


class ParticipantStats(BaseModel):
    id: int
    first_name: str
    last_name: str
    number: int | None
    role: str | None
    gender: str | None
    category_id: int
    category_name: str
    event_id: int
    event_title: str
    event_date: str | None
    event_location: str | None
    scores: List[ScoreDetail]
    heats: List[HeatDetail]

    class Config:
        from_attributes = True


@router.get("/{participant_id}", response_model=ParticipantStats)
async def get_participant_stats(participant_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.Participant)
        .options(
            selectinload(models.Participant.category).selectinload(models.Category.event),
            selectinload(models.Participant.scores)
            .selectinload(models.Score.judge),
            selectinload(models.Participant.heats)
            .selectinload(models.HeatParticipant.heat)
            .selectinload(models.Heat.round)
            .selectinload(models.Round.category),
            selectinload(models.Participant.heats)
            .selectinload(models.HeatParticipant.heat)
            .selectinload(models.Heat.round)
            .selectinload(models.Round.event),
        )
        .filter(models.Participant.id == participant_id)
    )

    result = await db.execute(stmt)
    participant = result.scalar_one_or_none()

    if participant is None:
        raise HTTPException(status_code=404, detail="Участник не найден")

    # Get criteria names for scores
    criteria_stmt = select(models.Criterion).filter(
        models.Criterion.id.in_([score.criterion_id for score in participant.scores if score.criterion_id])
    )
    criteria_result = await db.execute(criteria_stmt)
    criteria = {crit.id: crit.name for crit in criteria_result.scalars().all()}

    scores = [
        ScoreDetail(
            id=score.id,
            score=score.score,
            judge_name=f"{score.judge.first_name} {score.judge.last_name}",
            criterion_name=criteria.get(score.criterion_id) if score.criterion_id else None,
            round_id=score.round_id,
            heat_id=score.heat_id,
        )
        for score in participant.scores
    ]

    heats = [
        HeatDetail(
            id=hp.heat.id,
            heat_number=hp.heat.heat_number,
            status=hp.heat.status,
            round_id=hp.heat.round.id,
            round_type=hp.heat.round.round_type,
            stage_format=hp.heat.round.stage_format,
            category_name=hp.heat.round.category.name,
            event_title=hp.heat.round.event.title,
        )
        for hp in participant.heats
    ]

    return ParticipantStats(
        id=participant.id,
        first_name=participant.first_name,
        last_name=participant.last_name,
        number=participant.number,
        role=participant.role,
        gender=participant.gender,
        category_id=participant.category_id,
        category_name=participant.category.name,
        event_id=participant.event_id,
        event_title=participant.event.title,
        event_date=participant.event.date.isoformat() if participant.event.date else None,
        event_location=participant.event.location,
        scores=scores,
        heats=heats,
    )
