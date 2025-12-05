import asyncio

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from .config import settings
from .handlers import router


async def main():
    bot = Bot(token=settings.telegram_token, parse_mode="HTML")
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
