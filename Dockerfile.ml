# Wealth AI Finance Manager - FastAPI / ML service
# linux/amd64 is used because TensorFlow + Stable-Baselines3 model
# compatibility is more predictable in this environment.
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.docker.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY api.py ./
COPY dqn_financial_agent.zip ./
COPY kmeans_persona_model.pkl ./
COPY persona_scaler.pkl ./
COPY lstm_sub_model.keras ./
COPY lstm_scaler.pkl ./

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
