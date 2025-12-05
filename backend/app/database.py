from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


engine = create_async_engine(str(settings.database_url), future=True, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
)
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional async session."""
    async with AsyncSessionLocal() as session:
        yield session
