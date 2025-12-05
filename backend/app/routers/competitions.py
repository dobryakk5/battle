from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, models
from ..database import get_db
from ..schemas import CategoryCreate, CategoryRead, CompetitionCreate, CompetitionRead, CriterionRead

router = APIRouter(prefix="/competitions", tags=["competitions"])


def build_category_response(category: models.Category) -> CategoryRead:
    return CategoryRead(
        id=category.id,
        name=category.name,
        type=category.type,
        criteria=[
            CriterionRead(
                id=criterion.id,
                name=criterion.name,
                scale_min=criterion.scale_min,
                scale_max=criterion.scale_max,
            )
            for criterion in sorted(category.criteria, key=lambda crit: crit.id)
        ],
    )


@router.post("", response_model=CompetitionRead)
async def create_competition(payload: CompetitionCreate, db: AsyncSession = Depends(get_db)):
    event_date = None
    if payload.date:
        try:
            event_date = date.fromisoformat(payload.date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Некорректный формат даты. Используйте YYYY-MM-DD.")
    event = await crud.create_competition(db, title=payload.title, date=event_date, location=payload.location)
    return CompetitionRead(
        id=event.id,
        title=event.title,
        date=str(event.date) if event.date else None,
        location=event.location,
        categories=[],
    )


@router.get("", response_model=List[CompetitionRead])
async def list_competitions(db: AsyncSession = Depends(get_db)):
    events = await crud.list_competitions(db)
    return [
        CompetitionRead(
            id=event.id,
            title=event.title,
            date=str(event.date) if event.date else None,
            location=event.location,
            categories=[build_category_response(cat) for cat in sorted(event.categories, key=lambda c: c.id)],
        )
        for event in events
    ]


@router.get("/{competition_id}", response_model=CompetitionRead)
async def get_competition(competition_id: int, db: AsyncSession = Depends(get_db)):
    event = await crud.get_competition(db, competition_id)
    categories = [build_category_response(cat) for cat in sorted(event.categories, key=lambda c: c.id)]
    return CompetitionRead(
        id=event.id,
        title=event.title,
        date=str(event.date) if event.date else None,
        location=event.location,
        categories=categories,
    )


@router.post("/{competition_id}/categories", response_model=CategoryRead)
async def create_category(competition_id: int, payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    if not payload.criteria:
        raise HTTPException(status_code=400, detail="At least one criterion is required")
    category = await crud.create_category(
        db,
        event_id=competition_id,
        name=payload.name,
        type=payload.type,
        criteria=payload.criteria,
    )
    return build_category_response(category)
