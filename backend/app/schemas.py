from typing import Dict, List, Optional, Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"


class UserBase(BaseModel):
    first_name: str
    last_name: str
    role: str
    email: Optional[str] = None


class UserCreate(UserBase):
    telegram_id: Optional[int] = None


class UserRead(UserBase):
    id: int
    telegram_id: Optional[int] = None

    class Config:
        from_attributes = True


class CompetitionCreate(BaseModel):
    title: str
    date: Optional[str]
    location: Optional[str]


class CompetitionRead(CompetitionCreate):
    id: int
    categories: List["CategoryRead"] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    type: str = Field(..., description="amateur|pro|master|debut")
    criteria: List[str] = Field(default_factory=list)


class CriterionRead(BaseModel):
    id: int
    name: str
    scale_min: int
    scale_max: int

    class Config:
        from_attributes = True


class CategoryRead(BaseModel):
    id: int
    name: str
    type: str
    criteria: List[CriterionRead] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ParticipantCreate(BaseModel):
    full_name: str = Field(..., description="Имя и фамилия через пробел")
    number: Optional[int] = None
    role: Optional[str] = None
    gender: Literal["male", "female"]
    category_id: int


class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = Field(None, description="Имя и фамилия через пробел")
    number: Optional[int] = None
    role: Optional[str] = None
    gender: Optional[Literal["male", "female"]] = None
    category_id: Optional[int] = None


class ParticipantRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    number: Optional[int]
    role: Optional[str] = None
    gender: Optional[str] = None

    class Config:
        from_attributes = True


class RoundCreate(BaseModel):
    event_id: int
    category_id: int
    round_type: str
    stage_format: Optional[str] = None


class RoundRead(RoundCreate):
    id: int

    class Config:
        from_attributes = True


class ScoreCriterion(BaseModel):
    name: str
    value: float


class ScoreCreate(BaseModel):
    participant_id: int
    judge_id: int
    round_id: int
    heat_id: Optional[int] = None
    criterion_id: Optional[int] = None
    score: float


class ScoreRead(ScoreCreate):
    id: int

    class Config:
        from_attributes = True


class HeatParticipantRead(BaseModel):
    participant_id: int
    participant_name: str


class HeatRead(BaseModel):
    id: int
    heat_number: int
    status: str
    participants: List[HeatParticipantRead] = Field(default_factory=list)


class HeatDetailRead(HeatRead):
    round_id: int
    round_type: str
    event_id: int
    event_title: str
    category_id: int
    category_name: str
    criteria: List[CriterionRead] = Field(default_factory=list)


class HeatDistributionRequest(BaseModel):
    max_in_heat: int = Field(..., gt=0)


class HeatDistributionResponse(BaseModel):
    status: str = "ok"
    round_id: int
    heats_created: int


class HeatStatusUpdate(BaseModel):
    status: Literal["waiting", "in_progress", "finished"]


class HeatStatusRead(BaseModel):
    id: int
    status: Literal["waiting", "in_progress", "finished"]


class ManualHeatCreate(BaseModel):
    participant_ids: List[int] = Field(..., min_length=1)


class ResultRow(BaseModel):
    participant_id: int
    participant_name: str
    total_score: float
    placement: int


class CategoryRoundResult(BaseModel):
    category_id: int
    category_name: str
    round: str
    scores: List[ResultRow]


class ExportLink(BaseModel):
    xls_url: str
    pdf_url: str


CompetitionRead.update_forward_refs()
