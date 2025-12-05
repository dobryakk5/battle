"""Notification helpers (Telegram, etc.)."""

from __future__ import annotations

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import models
from ..config import settings


async def notify_heat_finished(db: AsyncSession, heat: models.Heat) -> None:
    """Broadcast a Telegram notification when a heat is finished."""

    if not settings.telegram_bot_token:
        return

    stmt = select(models.User.telegram_id).filter(models.User.telegram_id.is_not(None))
    result = await db.execute(stmt)
    chat_ids: list[int] = [telegram_id for (telegram_id,) in result.all() if telegram_id]
    if not chat_ids:
        return

    round_obj = heat.round
    event = round_obj.event if round_obj else None
    category = round_obj.category if round_obj else None

    message_parts: list[str] = [f"Заход №{heat.heat_number} завершён."]
    if category:
        message_parts.append(f"Категория: {category.name}.")
    if event:
        message_parts.append(f"Соревнование: {event.title}.")
    message = " ".join(part for part in message_parts if part).strip()
    if settings.admin_link_base:
        message = f"{message}\nПодробнее: {settings.admin_link_base}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        for chat_id in chat_ids:
            await client.post(
                f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": message},
            )
