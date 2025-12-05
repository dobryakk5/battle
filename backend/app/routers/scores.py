from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud
from ..database import get_db
from ..schemas import ScoreCreate, ScoreRead

router = APIRouter(prefix="/scores", tags=["scores"])


@router.post("", response_model=ScoreRead)
async def create_score(payload: ScoreCreate, db: AsyncSession = Depends(get_db)):
    score = await crud.upsert_score(
        db,
        participant_id=payload.participant_id,
        judge_id=payload.judge_id,
        round_id=payload.round_id,
        heat_id=payload.heat_id,
        criterion_id=payload.criterion_id,
        value=payload.score,
    )
    return ScoreRead.from_orm(score)


@router.get("/heats/{heat_id}", response_model=List[ScoreRead])
async def get_scores_for_heat(heat_id: int, db: AsyncSession = Depends(get_db)):
    scores = await crud.get_scores_by_heat(db, heat_id=heat_id)
    return [ScoreRead.from_orm(score) for score in scores]
