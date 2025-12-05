from fastapi import APIRouter

from ..schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health_check():
    """Simple health check for uptime monitoring."""
    return HealthResponse()
