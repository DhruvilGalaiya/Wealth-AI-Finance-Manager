# api.py
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from stable_baselines3 import DQN
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf

app = FastAPI()

# Allow Next.js to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your trained brain!
model = DQN.load("dqn_financial_agent")

# Define what data Next.js will send us
class FinancialState(BaseModel):
    current_day: int
    actual_pacing: float
    expected_pacing: float
    runway: float

@app.post("/predict_action")
def predict_action(state: FinancialState):
    # Convert the data into an array the AI understands
    obs = np.array([state.current_day, state.actual_pacing, state.expected_pacing, state.runway], dtype=np.float32)
    
    # Ask the model what to do!
    action, _states = model.predict(obs, deterministic=True)
    
    # Translate the number back to English
    actions_map = {
        0: "Spend Normal",
        1: "Save",
        2: "Defer Purchases"
    }
    
    return {"action": actions_map[int(action)]}


# --- CLUSTERING MICROSERVICE ---
# Load the clustering model and scaler
kmeans_model = joblib.load("kmeans_persona_model.pkl")
persona_scaler = joblib.load("persona_scaler.pkl")

class SpendingProfile(BaseModel):
    housing_pct: float
    food_pct: float
    entertainment_pct: float
    savings_pct: float

@app.post("/analyze_persona")
def analyze_persona(profile: SpendingProfile):
    # 1. Format the incoming data
    user_data = np.array([[
        profile.housing_pct, 
        profile.food_pct, 
        profile.entertainment_pct, 
        profile.savings_pct
    ]])
    
    # 2. Scale the data using the EXACT same scaler from training
    scaled_user_data = persona_scaler.transform(user_data)
    
    # 3. Predict the cluster
    cluster_id = kmeans_model.predict(scaled_user_data)[0]
    
    # 4. Map the math to a Human Persona
    personas = {
        0: {
            "name": "The Super Saver", 
            "trait": "You save a large portion of your income, prioritizing future wealth over current spending.", 
            "color": "text-emerald-500"
        },
        1: {
            "name": "The Lifestyle Spender", 
            "trait": "You spend heavily on entertainment and dining, which might be slowing down your long-term savings.", 
            "color": "text-amber-500"
        },
        2: {
            "name": "The Housing-Heavy Spender", 
            "trait": "A massive portion of your income goes toward rent and fixed bills, leaving you with very little flexible cash.", 
            "color": "text-rose-500"
        },
        3: {
            "name": "The Balanced Budgeter", 
            "trait": "You maintain a perfect, healthy balance between everyday living, having fun, and saving for the future.", 
            "color": "text-blue-500"
        }
    }
    
    return personas[int(cluster_id)]

# --- DEEP LEARNING LSTM MICROSERVICE ---
lstm_model = tf.keras.models.load_model("lstm_sub_model.keras")
lstm_scaler = joblib.load("lstm_scaler.pkl")

class SubHistory(BaseModel):
    name: str
    history: list[float]

class SubRequest(BaseModel):
    subscriptions: list[SubHistory]

@app.post("/predict_subscriptions")
def predict_subscriptions(req: SubRequest):
    results = []
    for sub in req.subscriptions:
        # 1. Format and scale the 5-month history
        hist = np.array(sub.history)
        hist_scaled = lstm_scaler.transform(hist.reshape(-1, 1)).reshape(1, 5, 1)
        
        # 2. Ask the Neural Network to predict the 6th month!
        pred_scaled = lstm_model.predict(hist_scaled, verbose=0)
        pred_value = lstm_scaler.inverse_transform(pred_scaled)[0][0]
        
        # 3. AI Diagnostic Logic
        delta = pred_value - hist[-1]
        
        if hist[-1] > hist[-2] and hist[-2] > hist[-3] and delta > 2:
            status = "Creeping Cost"
            color = "text-amber-600 bg-amber-100"
        elif pred_value > np.mean(hist) * 1.5:
            status = "Anomalous Spike"
            color = "text-rose-600 bg-rose-100"
        else:
            status = "Stable"
            color = "text-emerald-600 bg-emerald-100"
            
        results.append({
            "name": sub.name,
            "current_cost": round(float(hist[-1]), 2),
            "predicted_next": round(float(pred_value), 2),
            "status": status,
            "color": color
        })
        
    return {"predictions": results}