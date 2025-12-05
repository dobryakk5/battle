from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud
from ..database import get_db
from ..schemas import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await crud.create_user(
        db,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        email=payload.email,
        telegram_id=payload.telegram_id,
    )
    return UserRead.from_orm(user)


@router.get("", response_model=List[UserRead])
async def list_users(db: AsyncSession = Depends(get_db)):
    users = await crud.get_users(db)
    return [UserRead.from_orm(user) for user in users]


@router.get("/me", response_model=UserRead)
async def get_my_profile(
    telegram_id: int = Query(..., description="Telegram ID of the user"),
    db: AsyncSession = Depends(get_db),
):
    user = await crud.get_user_by_telegram(db, telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.from_orm(user)
