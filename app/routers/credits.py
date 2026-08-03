from fastapi import APIRouter

from ..schemas import CreditsResponse

router = APIRouter(prefix="/api", tags=["credits"])

_balance = 2480


@router.get("/credits", response_model=CreditsResponse)
async def get_credits():
    return CreditsResponse(balance=_balance)


@router.post("/credits/add", response_model=CreditsResponse)
async def add_credits(amount: int = 500):
    global _balance
    _balance += amount
    return CreditsResponse(balance=_balance)


@router.post("/credits/deduct", response_model=CreditsResponse)
async def deduct_credits(amount: int = 0):
    global _balance
    _balance = max(0, _balance - amount)
    return CreditsResponse(balance=_balance)
