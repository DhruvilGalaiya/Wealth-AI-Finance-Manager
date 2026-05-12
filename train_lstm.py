# train_lstm.py
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
import joblib

print("Generating Time-Series Data for LSTM...")
np.random.seed(42)

# Generate 6 months of data for 1500 simulated subscriptions
# 1. Stable subscriptions (e.g., $15/mo Netflix)
stable = np.random.normal(loc=20, scale=0.5, size=(500, 6))
# 2. Creeping subscriptions (e.g., Server costs scaling up: 10, 15, 22, 30, 45)
creep = np.linspace(10, 50, 6) + np.random.normal(0, 2, size=(500, 6))
# 3. Erratic usage (Utility bills fluctuating)
erratic = np.random.uniform(40, 100, size=(500, 6))

data = np.vstack([stable, creep, erratic])
data = np.clip(data, 1, 500) # Ensure no negative bills

# We use the first 5 months (X) to predict the 6th month (y)
X = data[:, :5]
y = data[:, 5]

print("Scaling data for Neural Network...")
# Neural Networks require data to be scaled between 0 and 1
scaler = MinMaxScaler()
data_flat = data.reshape(-1, 1)
scaler.fit(data_flat)

X_scaled = scaler.transform(X.reshape(-1, 1)).reshape(X.shape)
y_scaled = scaler.transform(y.reshape(-1, 1)).reshape(y.shape)

# LSTM expects 3D input: (samples, time steps, features)
X_reshaped = X_scaled.reshape((X_scaled.shape[0], X_scaled.shape[1], 1))

print("Building LSTM Neural Network...")
model = Sequential([
    LSTM(32, activation='relu', input_shape=(5, 1)),
    Dense(16, activation='relu'),
    Dense(1) # Predict a single future value
])

model.compile(optimizer='adam', loss='mse')

print("Training Deep Learning Model (This will take a few seconds)...")
model.fit(X_reshaped, y_scaled, epochs=15, batch_size=32, verbose=1)

# Save the trained brain
model.save("lstm_sub_model.keras")
joblib.dump(scaler, "lstm_scaler.pkl")
print("Success! LSTM Model and Scaler saved.")