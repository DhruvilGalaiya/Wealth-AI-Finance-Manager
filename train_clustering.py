# train_clustering.py
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib

print("Generating synthetic peer data...")
# We generate 1000 users with 4 features:
# [Housing %, Food %, Entertainment %, Savings %]
np.random.seed(42)

# Cluster 0: The Frugal Savers (Low spend, high save)
frugal = np.random.normal(loc=[25, 15, 10, 50], scale=[5, 3, 2, 5], size=(250, 4))
# Cluster 1: The Lifestyle Spenders (High entertainment/food)
lifestyle = np.random.normal(loc=[35, 30, 25, 10], scale=[5, 5, 5, 3], size=(250, 4))
# Cluster 2: The House Poor (Massive housing cost, low everything else)
house_poor = np.random.normal(loc=[60, 20, 10, 10], scale=[5, 4, 3, 3], size=(250, 4))
# Cluster 3: The Balanced Planners (Perfect 50/30/20 rule roughly)
balanced = np.random.normal(loc=[40, 25, 15, 20], scale=[4, 3, 3, 4], size=(250, 4))

# Combine and ensure no negative percentages
data = np.vstack([frugal, lifestyle, house_poor, balanced])
data = np.clip(data, 1, 100) 

# Scale the data (CRITICAL for K-Means)
print("Scaling data...")
scaler = StandardScaler()
scaled_data = scaler.fit_transform(data)

# Train K-Means
print("Training K-Means Model...")
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
kmeans.fit(scaled_data)

# Save the model and the scaler
joblib.dump(kmeans, "kmeans_persona_model.pkl")
joblib.dump(scaler, "persona_scaler.pkl")

print("Success! Model and Scaler saved.")