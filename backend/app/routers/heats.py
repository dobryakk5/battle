from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .. import crud, models
from ..crud import get_or_404
from ..database import get_db
from ..schemas import HeatDetailRead, HeatParticipantRead, CriterionRead, HeatStatusRead, HeatStatusUpdate
from ..services import notifications

router = APIRouter(prefix="/heats", tags=["heats"])


@router.get("/{heat_id}", response_model=HeatDetailRead)
async def get_heat_detail(heat_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.Heat)
        .options(
            selectinload(models.Heat.participants).selectinload(models.HeatParticipant.participant),
            selectinload(models.Heat.round).selectinload(models.Round.event),
            selectinload(models.Heat.round)
            .selectinload(models.Round.category)
            .selectinload(models.Category.criteria),
        )
        .filter(models.Heat.id == heat_id)
    )
    heat = await get_or_404(db, stmt, "Heat not found")

    category = heat.round.category
    event = heat.round.event

    return HeatDetailRead(
        id=heat.id,
        heat_number=heat.heat_number,
        status=heat.status,
        participants=[
            HeatParticipantRead(
                participant_id=hp.participant_id,
                participant_name=f"{hp.participant.first_name} {hp.participant.last_name}",
            )
            for hp in sorted(heat.participants, key=lambda participant: participant.participant_id)
        ],
        round_id=heat.round.id,
        round_type=heat.round.round_type,
        event_id=event.id,
        event_title=event.title,
        category_id=category.id,
        category_name=category.name,
        criteria=[
            CriterionRead(
                id=crit.id,
                name=crit.name,
                scale_min=crit.scale_min,
                scale_max=crit.scale_max,
            )
            for crit in sorted(category.criteria, key=lambda criterion: criterion.id)
        ],
    )


@router.patch("/{heat_id}/status", response_model=HeatStatusRead)
async def update_heat_status(
    heat_id: int, payload: HeatStatusUpdate, db: AsyncSession = Depends(get_db)
) -> HeatStatusRead:
    heat = await crud.update_heat_status(db, heat_id=heat_id, status=payload.status)
    if payload.status == "finished":
        await notifications.notify_heat_finished(db, heat)
    return HeatStatusRead(id=heat.id, status=heat.status)
