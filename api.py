# api.py — Welth ML inference service (FastAPI)
import os

import joblib
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from stable_baselines3 import DQN

app = FastAPI(title="Welth ML API")

# The Next.js server calls this service server-side, so browsers never need
# direct access. Restrict origins via ML_ALLOWED_ORIGINS (comma separated).
allowed_origins = [o.strip() for o in os.getenv("ML_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

# --- Models are loaded once at startup ---
dqn_model = DQN.load("dqn_financial_agent")
kmeans_model = joblib.load("kmeans_persona_model.pkl")
persona_scaler = joblib.load("persona_scaler.pkl")
lstm_model = tf.keras.models.load_model("lstm_sub_model.keras")
lstm_scaler = joblib.load("lstm_scaler.pkl")


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Reinforcement learning: purchase advice ---
class FinancialState(BaseModel):
    current_day: int = Field(ge=1, le=31)
    actual_pacing: float = Field(ge=0)
    expected_pacing: float = Field(ge=0, le=100)
    runway: float = Field(ge=0)


ACTIONS = {0: "Spend Normal", 1: "Save", 2: "Defer Purchases"}


@app.post("/predict_action")
def predict_action(state: FinancialState):
    obs = np.array(
        [state.current_day, state.actual_pacing, state.expected_pacing, state.runway],
        dtype=np.float32,
    )
    action, _ = dqn_model.predict(obs, deterministic=True)
    return {"action": ACTIONS[int(action)]}


# --- Clustering: spending persona ---
class SpendingProfile(BaseModel):
    housing_pct: float = Field(ge=0)
    food_pct: float = Field(ge=0)
    entertainment_pct: float = Field(ge=0)
    savings_pct: float = Field(ge=0)


PERSONAS = {
    0: "The Super Saver",
    1: "The Lifestyle Spender",
    2: "The Housing-Heavy Spender",
    3: "The Balanced Budgeter",
}


@app.post("/analyze_persona")
def analyze_persona(profile: SpendingProfile):
    features = np.array(
        [[profile.housing_pct, profile.food_pct, profile.entertainment_pct, profile.savings_pct]]
    )
    cluster = int(kmeans_model.predict(persona_scaler.transform(features))[0])
    return {"cluster": cluster, "name": PERSONAS.get(cluster, "Unknown")}


# --- LSTM: recurring cost forecast ---
class SubHistory(BaseModel):
    name: str = Field(max_length=100)
    history: list[float] = Field(min_length=5, max_length=5)


class SubRequest(BaseModel):
    subscriptions: list[SubHistory] = Field(max_length=20)


@app.post("/predict_subscriptions")
def predict_subscriptions(req: SubRequest):
    results = []
    for sub in req.subscriptions:
        hist = np.array(sub.history, dtype=np.float32)
        if np.any(hist < 0):
            raise HTTPException(status_code=422, detail="history values must be >= 0")

        scaled = lstm_scaler.transform(hist.reshape(-1, 1)).reshape(1, 5, 1)
        pred_scaled = lstm_model.predict(scaled, verbose=0)
        pred_value = float(lstm_scaler.inverse_transform(pred_scaled)[0][0])
        delta = pred_value - hist[-1]

        if hist[-1] > hist[-2] > hist[-3] and delta > 2:
            status = "Creeping Cost"
        elif pred_value > np.mean(hist) * 1.5:
            status = "Anomalous Spike"
        else:
            status = "Stable"

        results.append(
            {
                "name": sub.name,
                "current_cost": round(float(hist[-1]), 2),
                "predicted_next": round(max(0.0, pred_value), 2),
                "status": status,
            }
        )

    return {"predictions": results}
