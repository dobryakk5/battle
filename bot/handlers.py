from aiogram import Router, F
from aiogram.filters.command import Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery

import httpx

from .config import settings

router = Router()


@router.message(Command("start"))
async def start_handler(message: Message) -> None:
    await message.answer(
        "Добро пожаловать в Battle Judges Bot 👋\n"
        "Команды:\n"
        "/battle — список всех соревнований\n"
        "/login — привязка Telegram ID\n"
        "/mytasks — список назначенных заходов\n"
        "/help — краткая справка"
    )


@router.message(Command("battle"))
async def battle_handler(message: Message) -> None:
    """Показать список всех соревнований."""
    async with httpx.AsyncClient(base_url=str(settings.api_base_url), timeout=10.0) as client:
        try:
            response = await client.get("/competitions")
            if response.status_code != 200:
                await message.answer("Ошибка при получении списка соревнований.")
                return

            competitions = response.json()

            if not competitions:
                await message.answer("Соревнований пока нет.")
                return

            # Создаем inline-кнопки для каждого соревнования
            keyboard_buttons = []
            for idx, comp in enumerate(competitions, start=1):
                button = InlineKeyboardButton(
                    text=f"{idx}. {comp.get('title', 'Без названия')}",
                    callback_data=f"competition_{comp.get('id')}"
                )
                keyboard_buttons.append([button])

            keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons)

            await message.answer(
                "📋 <b>Все соревнования:</b>\n\nВыберите соревнование для просмотра деталей:",
                reply_markup=keyboard
            )

        except Exception as e:
            await message.answer(f"Ошибка подключения к серверу: {str(e)}")


@router.callback_query(F.data.startswith("competition_"))
async def competition_detail_handler(callback: CallbackQuery) -> None:
    """Показать детали выбранного соревнования."""
    if not callback.data:
        return

    competition_id = callback.data.split("_")[1]

    async with httpx.AsyncClient(base_url=str(settings.api_base_url), timeout=10.0) as client:
        try:
            # Получаем детали соревнования
            comp_response = await client.get(f"/competitions/{competition_id}")
            if comp_response.status_code != 200:
                await callback.message.answer("Ошибка при получении данных соревнования.")
                await callback.answer()
                return

            competition = comp_response.json()

            # Получаем участников
            participants_response = await client.get(f"/competitions/{competition_id}/all-participants")
            participants = participants_response.json() if participants_response.status_code == 200 else []

            # Формируем сообщение
            title = competition.get('title', 'Без названия')
            date = competition.get('date', 'Дата не указана')
            location = competition.get('location', 'Место не указано')

            message_text = f"🏆 <b>{title}</b>\n\n"
            message_text += f"📅 <b>Дата:</b> {date}\n"
            message_text += f"📍 <b>Место:</b> {location}\n\n"

            if participants:
                message_text += f"👥 <b>Участники ({len(participants)}):</b>\n"
                for idx, participant in enumerate(participants, start=1):
                    first_name = participant.get('first_name', '')
                    last_name = participant.get('last_name', '')
                    number = participant.get('number')
                    gender = participant.get('gender', '')
                    gender_icon = '👨' if gender == 'male' else '👩' if gender == 'female' else '👤'

                    full_name = f"{first_name} {last_name}".strip()
                    number_str = f"#{number} " if number else ""
                    message_text += f"{idx}. {gender_icon} {number_str}{full_name}\n"
            else:
                message_text += "👥 <b>Участников пока нет</b>"

            await callback.message.answer(message_text)
            await callback.answer()

        except Exception as e:
            await callback.message.answer(f"Ошибка: {str(e)}")
            await callback.answer()


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
        "/battle — посмотреть все соревнования\n"
        "/mytasks — посмотреть назначенные заходы\n"
        "/login — привязать Telegram к судье\n"
        "По техническим вопросам пишите главному судье."
    )
