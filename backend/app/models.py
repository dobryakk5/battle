from datetime import date
from typing import List

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    Date,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(64), nullable=False)
    last_name: Mapped[str] = mapped_column(String(64), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    telegram_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True)

    scores: Mapped[List["Score"]] = relationship("Score", back_populates="judge")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)

    categories: Mapped[List["Category"]] = relationship("Category", back_populates="event")
    rounds: Mapped[List["Round"]] = relationship("Round", back_populates="event")
    participants: Mapped[List["Participant"]] = relationship("Participant", back_populates="event")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="categories")
    rounds: Mapped[List["Round"]] = relationship("Round", back_populates="category")
    participants: Mapped[List["Participant"]] = relationship("Participant", back_populates="category")
    criteria: Mapped[List["Criterion"]] = relationship("Criterion", back_populates="category")


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    first_name: Mapped[str] = mapped_column(String(64), nullable=False)
    last_name: Mapped[str] = mapped_column(String(64), nullable=False)
    number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    role: Mapped[str | None] = mapped_column(String(32), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)

    event: Mapped["Event"] = relationship("Event", back_populates="participants")
    category: Mapped["Category"] = relationship("Category", back_populates="participants")
    heats: Mapped[List["HeatParticipant"]] = relationship("HeatParticipant", back_populates="participant")
    scores: Mapped[List["Score"]] = relationship("Score", back_populates="participant")


class Round(Base):
    __tablename__ = "rounds"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    round_type: Mapped[str] = mapped_column(String(32), nullable=False)
    stage_format: Mapped[str | None] = mapped_column(String(32), nullable=True)

    event: Mapped["Event"] = relationship("Event", back_populates="rounds")
    category: Mapped["Category"] = relationship("Category", back_populates="rounds")
    heats: Mapped[List["Heat"]] = relationship("Heat", back_populates="round")
    scores: Mapped[List["Score"]] = relationship("Score", back_populates="round")
    final_places: Mapped[List["FinalPlace"]] = relationship("FinalPlace", back_populates="round")


class Heat(Base):
    __tablename__ = "heats"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    round_id: Mapped[int] = mapped_column(ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False)
    heat_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="waiting")

    round: Mapped["Round"] = relationship("Round", back_populates="heats")
    participants: Mapped[List["HeatParticipant"]] = relationship(
        "HeatParticipant", back_populates="heat", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("round_id", "heat_number", name="uq_round_heat"),
    )


class HeatParticipant(Base):
    __tablename__ = "heat_participants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    heat_id: Mapped[int] = mapped_column(ForeignKey("heats.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)

    heat: Mapped["Heat"] = relationship("Heat", back_populates="participants")
    participant: Mapped["Participant"] = relationship("Participant", back_populates="heats")

    __table_args__ = (
        UniqueConstraint("heat_id", "participant_id", name="uq_heat_participant"),
    )


class Criterion(Base):
    __tablename__ = "criteria"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    scale_min: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scale_max: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    category: Mapped["Category"] = relationship("Category", back_populates="criteria")


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (
        CheckConstraint("score >= 0", name="ck_score_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    round_id: Mapped[int] = mapped_column(ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    judge_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    criterion_id: Mapped[int | None] = mapped_column(ForeignKey("criteria.id", ondelete="SET NULL"), nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    heat_id: Mapped[int | None] = mapped_column(ForeignKey("heats.id", ondelete="SET NULL"), nullable=True)

    round: Mapped["Round"] = relationship("Round", back_populates="scores")
    participant: Mapped["Participant"] = relationship("Participant", back_populates="scores")
    judge: Mapped["User"] = relationship("User", back_populates="scores")


class FinalPlace(Base):
    __tablename__ = "final_places"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    round_id: Mapped[int] = mapped_column(ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    place: Mapped[int] = mapped_column(Integer, nullable=False)
    sum_places: Mapped[float] = mapped_column(Float, nullable=False)

    round: Mapped["Round"] = relationship("Round", back_populates="final_places")

    __table_args__ = (
        UniqueConstraint("round_id", "participant_id", name="uq_round_participant_final"),
    )
