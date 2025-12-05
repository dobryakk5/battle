from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .. import crud, models
from ..database import get_db
from ..schemas import (
    HeatDistributionRequest,
    HeatDistributionResponse,
    HeatParticipantRead,
    HeatRead,
    ManualHeatCreate,
    RoundCreate,
    RoundRead,
)
from ..services import heats as heats_service

router = APIRouter(prefix="/rounds", tags=["rounds"])


@router.get("/{round_id}", response_model=RoundRead)
async def get_round(round_id: int, db: AsyncSession = Depends(get_db)):
    round_obj = await crud.get_round(db, round_id=round_id)
    return RoundRead.from_orm(round_obj)


def build_heat_response(heat: models.Heat) -> HeatRead:
    participants = sorted(heat.participants, key=lambda participant: participant.participant_id)
    return HeatRead(
        id=heat.id,
        heat_number=heat.heat_number,
        status=heat.status,
        participants=[
            HeatParticipantRead(
                participant_id=hp.participant_id,
                participant_name=f"{hp.participant.first_name} {hp.participant.last_name}",
            )
            for hp in participants
        ],
    )


@router.post("", response_model=RoundRead)
async def create_round(payload: RoundCreate, db: AsyncSession = Depends(get_db)):
    new_round = await crud.create_round(
        db,
        event_id=payload.event_id,
        category_id=payload.category_id,
        round_type=payload.round_type,
        stage_format=payload.stage_format,
    )
    return RoundRead.from_orm(new_round)


@router.get("", response_model=List[RoundRead])
async def list_rounds(event_id: int, db: AsyncSession = Depends(get_db)):
    rounds = await crud.list_rounds(db, event_id=event_id)
    return [RoundRead.from_orm(round_) for round_ in rounds]


@router.post("/{round_id}/distribute", response_model=HeatDistributionResponse)
async def distribute_heats(round_id: int, payload: HeatDistributionRequest, db: AsyncSession = Depends(get_db)):
    heats_created = await heats_service.distribute_heats(
        db, round_id=round_id, max_in_heat=payload.max_in_heat
    )
    return HeatDistributionResponse(round_id=round_id, heats_created=heats_created)


@router.get("/{round_id}/heats", response_model=List[HeatRead])
async def get_heats(round_id: int, db: AsyncSession = Depends(get_db)):
    heats = await heats_service.get_heats_with_participants(db, round_id=round_id)
    return [build_heat_response(heat) for heat in heats]


@router.post("/{round_id}/heats", response_model=HeatRead)
async def create_manual_heat(
    round_id: int,
    payload: ManualHeatCreate,
    db: AsyncSession = Depends(get_db),
):
    if not payload.participant_ids:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы одного участника")

    round_obj = await crud.get_round(db, round_id=round_id)

    stmt_participants = (
        select(models.Participant)
        .filter(models.Participant.id.in_(payload.participant_ids))
        .order_by(models.Participant.id)
    )
    result = await db.execute(stmt_participants)
    participants = result.scalars().all()
    unique_ids = set(payload.participant_ids)
    if len(participants) != len(unique_ids):
        raise HTTPException(status_code=404, detail="Некоторые участники не найдены")
    for participant in participants:
        if participant.category_id != round_obj.category_id:
            raise HTTPException(status_code=400, detail="Участник не относится к выбранной категории")

    heat_number_stmt = select(func.coalesce(func.max(models.Heat.heat_number), 0)).filter(
        models.Heat.round_id == round_id
    )
    current_max = await db.execute(heat_number_stmt)
    next_number = current_max.scalar_one() + 1

    heat = models.Heat(round_id=round_id, heat_number=next_number, status="waiting")
    db.add(heat)
    await db.flush()
    for participant_id in payload.participant_ids:
        db.add(models.HeatParticipant(heat_id=heat.id, participant_id=participant_id))
    await db.commit()

    stmt_heat = (
        select(models.Heat)
        .options(selectinload(models.Heat.participants).selectinload(models.HeatParticipant.participant))
        .filter(models.Heat.id == heat.id)
    )
    created_heat = (await db.execute(stmt_heat)).scalar_one()
    return build_heat_response(created_heat)


@router.put("/{round_id}/heats/{heat_id}", response_model=HeatRead)
async def update_manual_heat(
    round_id: int,
    heat_id: int,
    payload: ManualHeatCreate,
    db: AsyncSession = Depends(get_db),
):
    if not payload.participant_ids:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы одного участника")

    round_obj = await crud.get_round(db, round_id=round_id)

    stmt_heat = select(models.Heat).filter(models.Heat.id == heat_id, models.Heat.round_id == round_id)
    heat = (await db.execute(stmt_heat)).scalar_one_or_none()
    if heat is None:
        raise HTTPException(status_code=404, detail="Заход не найден")

    stmt_participants = (
        select(models.Participant)
        .filter(models.Participant.id.in_(payload.participant_ids))
        .order_by(models.Participant.id)
    )
    result = await db.execute(stmt_participants)
    participants = result.scalars().all()
    if len(participants) != len(set(payload.participant_ids)):
        raise HTTPException(status_code=404, detail="Участник не найден")
    for participant in participants:
        if participant.category_id != round_obj.category_id:
            raise HTTPException(status_code=400, detail="Участник не относится к выбранной категории")

    await db.execute(
        delete(models.HeatParticipant).where(models.HeatParticipant.heat_id == heat_id)
    )
    for participant_id in payload.participant_ids:
        db.add(models.HeatParticipant(heat_id=heat_id, participant_id=participant_id))
    await db.commit()

    stmt_heat = (
        select(models.Heat)
        .options(selectinload(models.Heat.participants).selectinload(models.HeatParticipant.participant))
        .filter(models.Heat.id == heat_id)
    )
    updated_heat = (await db.execute(stmt_heat)).scalar_one()
    return build_heat_response(updated_heat)


@router.delete("/{round_id}/heats/{heat_id}", status_code=204)
async def delete_heat(round_id: int, heat_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.Heat)
        .options(selectinload(models.Heat.participants))
        .filter(models.Heat.id == heat_id, models.Heat.round_id == round_id)
    )
    heat = (await db.execute(stmt)).scalar_one_or_none()
    if heat is None:
        raise HTTPException(status_code=404, detail="Заход не найден")
    await db.delete(heat)
    await db.commit()
