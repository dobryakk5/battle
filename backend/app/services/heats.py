import math

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..crud import get_or_404
from .. import models


async def distribute_heats(db: AsyncSession, round_id: int, max_in_heat: int) -> int:
    """Rebuilds heats for the requested round with a maximum size."""

    stmt_round = select(models.Round).filter(models.Round.id == round_id)
    round_obj = await get_or_404(db, stmt_round, "Round not found")

    stmt_participants = (
        select(models.Participant)
        .filter(models.Participant.category_id == round_obj.category_id)
        .order_by(models.Participant.id)
    )
    result = await db.execute(stmt_participants)
    participants = result.scalars().all()
    if not participants:
        return 0

    if max_in_heat == 2:
        male = [participant for participant in participants if participant.gender == "male"]
        female = [participant for participant in participants if participant.gender == "female"]
        others = [participant for participant in participants if participant.gender not in {"male", "female"}]

        paired: list[models.Participant] = []
        for man, woman in zip(male, female):
            paired.extend([man, woman])

        leftovers = male[len(female):] if len(male) > len(female) else female[len(male):]
        participants = paired + leftovers + others

    heat_count = math.ceil(len(participants) / max_in_heat)

    heat_ids_stmt = select(models.Heat.id).filter(models.Heat.round_id == round_id)
    await db.execute(delete(models.HeatParticipant).where(models.HeatParticipant.heat_id.in_(heat_ids_stmt)))
    await db.execute(delete(models.Heat).where(models.Heat.round_id == round_id))

    for idx in range(heat_count):
        status = "in_progress" if idx == 0 else "waiting"
        heat = models.Heat(round_id=round_id, heat_number=idx + 1, status=status)
        db.add(heat)
        await db.flush()
        start = idx * max_in_heat
        end = min(start + max_in_heat, len(participants))
        for participant in participants[start:end]:
            db.add(models.HeatParticipant(heat_id=heat.id, participant_id=participant.id))

    await db.commit()
    return heat_count


async def get_heats_with_participants(db: AsyncSession, round_id: int) -> list[models.Heat]:
    stmt = (
        select(models.Heat)
        .options(
            selectinload(models.Heat.participants).selectinload(models.HeatParticipant.participant)
        )
        .filter(models.Heat.round_id == round_id)
        .order_by(models.Heat.heat_number)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
