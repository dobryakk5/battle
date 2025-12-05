from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud
from ..database import get_db
from ..schemas import ParticipantCreate, ParticipantRead, ParticipantUpdate

router = APIRouter(prefix="/competitions/{competition_id}/participants", tags=["participants"])


@router.post("", response_model=ParticipantRead)
async def create_participant(
    competition_id: int,
    payload: ParticipantCreate,
    db: AsyncSession = Depends(get_db),
):
    parts = payload.full_name.strip().split()
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Укажите имя и фамилию через пробел.")
    participant = await crud.create_participant(
        db,
        event_id=competition_id,
        category_id=payload.category_id,
        first_name=" ".join(parts[:-1]),
        last_name=parts[-1],
        number=payload.number,
        role=payload.role,
        gender=payload.gender,
    )
    return ParticipantRead.from_orm(participant)


@router.get("", response_model=List[ParticipantRead])
async def list_participants(competition_id: int, category_id: int, db: AsyncSession = Depends(get_db)):
    participants = await crud.list_participants(db, category_id=category_id)
    return [ParticipantRead.from_orm(participant) for participant in participants]


@router.patch("/{participant_id}", response_model=ParticipantRead)
async def update_participant(
    competition_id: int,
    participant_id: int,
    payload: ParticipantUpdate,
    db: AsyncSession = Depends(get_db),
):
    updates = {}
    if payload.full_name:
        parts = payload.full_name.strip().split()
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="Укажите имя и фамилию через пробел.")
        updates["first_name"] = " ".join(parts[:-1])
        updates["last_name"] = parts[-1]

    if payload.number is not None:
        updates["number"] = payload.number
    if payload.role is not None:
        updates["role"] = payload.role
    if payload.gender is not None:
        updates["gender"] = payload.gender
    if payload.category_id is not None:
        updates["category_id"] = payload.category_id

    if not updates:
        raise HTTPException(status_code=400, detail="Нет данных для обновления.")

    participant = await crud.update_participant(db, participant_id, competition_id, updates)
    return ParticipantRead.from_orm(participant)
