from aiogram import Router, F
from aiogram.filters.command import Command
from aiogram.types import Message

import httpx

from .config import settings

router = Router()


@router.message(Command("start"))
async def start_handler(message: Message) -> None:
    await message.answer(
        "Добро пожаловать в Battle Judges Bot 👋\n"
        "Команды:\n"
        "/login — привязка Telegram ID\n"
        "/mytasks — список назначенных заходов\n"
        "/help — краткая справка"
    )


@router.message(Command("login"))
async def login_handler(message: Message) -> None:
    await message.answer(
        "Отправьте персональный код из админ-панели. "
        "Если кода нет — обратитесь к главному судье."
    )


@router.message(Command("mytasks"))
async def mytasks_handler(message: Message) -> None:
    telegram_id = message.from_user.id if message.from_user else None
    if not telegram_id:
        await message.answer("Не удалось определить Telegram ID.")
        return

    async with httpx.AsyncClient(base_url=str(settings.api_base_url), timeout=10.0) as client:
        profile_resp = await client.get("/users/me", params={"telegram_id": telegram_id})
        if profile_resp.status_code != 200:
            await message.answer(
                "Судья не найден. Отправьте /login или обратитесь к администратору."
            )
            return

        profile = profile_resp.json()
        competitions_resp = await client.get("/competitions")

    competitions = competitions_resp.json() if competitions_resp.status_code == 200 else []

    lines = [
        f"Привет, {profile.get('first_name')}!",
        f"Связанный email: {profile.get('email') or 'не указан'}",
        "",
        "Активные соревнования:",
    ]

    for competition in competitions[:3]:
        lines.append(f"- {competition.get('title')} ({competition.get('date') or 'дата не указана'})")

    lines.append(f"\nАдмин-панель: {settings.admin_panel_url}")
    await message.answer("\n".join(lines))


@router.message(Command("help"))
async def help_handler(message: Message) -> None:
    await message.answer(
        "Команды:\n"
        "/mytasks — посмотреть назначенные заходы\n"
        "/login — привязать Telegram к судье\n"
        "По техническим вопросам пишите главному судье."
    )
