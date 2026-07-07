from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UserCardAdd(BaseModel):
    catalogue_id: str
    last_four_digits: str = "0000"
    credit_limit: float = 500000
    statement_day: int = 1
    due_day: int = 20
    card_nickname: Optional[str] = None

class UserCardUpdate(BaseModel):
    credit_limit: Optional[float] = None
    card_nickname: Optional[str] = None
    statement_day: Optional[int] = None
    due_day: Optional[int] = None

class TransactionCreate(BaseModel):
    user_card_id: str
    merchant: str
    category: str = "Other"
    amount: float
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    merchant: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    notes: Optional[str] = None

class RecommendationRequest(BaseModel):
    merchant: str
    category: str = "Other"
    amount: float
