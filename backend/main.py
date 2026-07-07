from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
import auth, database, models
import uvicorn
from typing import Optional

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield

app = FastAPI(title="CCIMS Premium API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── AUTH ─────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
def register(user: models.UserCreate):
    existing = database.get_user_by_username(user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_pw = auth.get_password_hash(user.password)
    user_id = database.create_user(user.username, hashed_pw)
    return {"user_id": user_id, "username": user.username}

@app.post("/api/auth/login")
def login(form_data: auth.OAuth2PasswordRequestForm = Depends()):
    user = auth.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"})
    access_token = auth.create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(auth.get_current_user)):
    profile = database.get_user_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile

# ─── CATALOGUE ───────────────────────────────────────────────────────
@app.get("/api/catalogue/cards")
def get_catalogue(search: Optional[str] = None, category: Optional[str] = None):
    return database.get_catalogue_cards(search, category)

@app.get("/api/catalogue/cards/{card_id}")
def get_catalogue_detail(card_id: str):
    card = database.get_catalogue_card_detail(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

# ─── USER CARDS ──────────────────────────────────────────────────────
@app.get("/api/user/cards")
def get_user_cards(current_user: dict = Depends(auth.get_current_user)):
    return database.get_user_cards(current_user["id"])

@app.post("/api/user/cards")
def add_user_card(card: models.UserCardAdd, current_user: dict = Depends(auth.get_current_user)):
    card_id, error = database.add_user_card(
        current_user["id"], card.catalogue_id, card.last_four_digits,
        card.credit_limit, card.statement_day, card.due_day, card.card_nickname)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"id": card_id, "status": "success"}

@app.get("/api/user/cards/{card_id}")
def get_user_card_detail(card_id: str, current_user: dict = Depends(auth.get_current_user)):
    card = database.get_user_card_detail(current_user["id"], card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@app.delete("/api/user/cards/{card_id}")
def remove_user_card(card_id: str, current_user: dict = Depends(auth.get_current_user)):
    database.remove_user_card(current_user["id"], card_id)
    return {"status": "removed"}

@app.put("/api/user/cards/{card_id}")
def update_user_card(card_id: str, update: models.UserCardUpdate, current_user: dict = Depends(auth.get_current_user)):
    database.update_user_card(current_user["id"], card_id, update.model_dump(exclude_none=True))
    return {"status": "updated"}

# ─── TRANSACTIONS ────────────────────────────────────────────────────
@app.get("/api/transactions")
def get_transactions(limit: int = 20, offset: int = 0, card_id: Optional[str] = None,
                     current_user: dict = Depends(auth.get_current_user)):
    return database.get_transactions(current_user["id"], limit, offset, card_id)

@app.post("/api/transactions")
def create_transaction(tx: models.TransactionCreate, current_user: dict = Depends(auth.get_current_user)):
    result, error = database.create_transaction(
        current_user["id"], tx.user_card_id, tx.merchant, tx.category, tx.amount, tx.notes)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return result

@app.get("/api/transactions/{tx_id}")
def get_transaction(tx_id: str, current_user: dict = Depends(auth.get_current_user)):
    tx = database.get_transaction(current_user["id"], tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@app.put("/api/transactions/{tx_id}")
def update_transaction(tx_id: str, update: models.TransactionUpdate, current_user: dict = Depends(auth.get_current_user)):
    result = database.update_transaction(current_user["id"], tx_id, update.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result

@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: str, current_user: dict = Depends(auth.get_current_user)):
    if not database.delete_transaction(current_user["id"], tx_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": "deleted"}

# ─── ANALYTICS ───────────────────────────────────────────────────────
@app.get("/api/analytics/dashboard")
def get_dashboard(current_user: dict = Depends(auth.get_current_user)):
    return database.get_dashboard_stats(current_user["id"])

@app.get("/api/analytics/trends")
def get_trends(current_user: dict = Depends(auth.get_current_user)):
    return database.get_spending_trends(current_user["id"])

@app.get("/api/analytics/categories")
def get_categories(current_user: dict = Depends(auth.get_current_user)):
    return database.get_category_breakdown(current_user["id"])

@app.post("/api/analytics/recommend")
def get_recommendation(req: models.RecommendationRequest, current_user: dict = Depends(auth.get_current_user)):
    res = database.get_recommendation(current_user["id"], req.merchant, req.category, req.amount)
    if not res:
        raise HTTPException(status_code=400, detail="No cards in portfolio. Add cards first.")
    return res

# ─── ALERTS ──────────────────────────────────────────────────────────
@app.get("/api/alerts")
def get_alerts(current_user: dict = Depends(auth.get_current_user)):
    return database.get_alerts(current_user["id"])

@app.put("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: str, current_user: dict = Depends(auth.get_current_user)):
    database.mark_alert_read(current_user["id"], alert_id)
    return {"status": "read"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
