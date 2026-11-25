# Full Stack AI Fianace Platform with Next JS, Supabase, Tailwind, Prisma, Inngest, Deep Learning, Machine Learning, Generative AI


<img width="1470" alt="Screenshot 2024-12-10 at 9 45 45 AM" src="https://github.com/user-attachments/assets/1bc50b85-b421-4122-8ba4-ae68b2b61432">

# Wealth: AI-Native Proactive Financial Copilot 🚀

Wealth is an intelligent, full-stack personal finance platform that shifts the paradigm from reactive expense tracking to proactive wealth management. By leveraging a decoupled microservices architecture, Welth actively monitors live transactions, forecasts recurring bills, evaluates the risk of hypothetical purchases, and provides empathetic, human-readable financial advice.

## 🧠 System Architecture

The application is split into two specialized microservices:
1. **The Web Brain (Next.js):** Handles the interactive user interface, authentication, and secure database routing.
2. **The Math Brain (FastAPI):** A dedicated Python inference server that holds pre-trained Machine Learning models in memory for high-speed predictions.

## 🛠️ Technical Stack

* **Frontend:** Next.js (React), Tailwind CSS
* **Backend:** Node.js (Server Actions), Python (FastAPI)
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Authentication:** Clerk
* **Artificial Intelligence Pipeline:**
  * **Deep Learning (LSTM):** Time-series forecasting for predicting creeping subscription costs.
  * **Reinforcement Learning (DQN):** A Deep Q-Network policy agent that evaluates the safety of hypothetical purchases against a dynamic daily burn rate.
  * **Unsupervised Learning (K-Means):** Clusters users into peer-based financial personas based on spending habits.
  * **Generative AI (Gemini 2.5):** Implements Server-Side Retrieval-Augmented Generation (RAG) to ground the conversational AI in the user's actual financial telemetry.

## 🚀 Key Features

* **Real-Time Dashboard:** Track liquid assets, monthly budgets, and daily pacing.
* **Subscription Watcher:** Automatically detects and predicts next-cycle billing costs.
* **The "What-If" Agent:** Test a purchase (e.g., "Can I afford a $500 flight?") and get an instant AI risk assessment.
* **GenAI Financial Copilot:** Chat naturally with your finances. The AI knows your exact balance and runway without requiring manual data entry.

## ⚙️ Local Development Setup

### 1. Environment
Copy `.env.example` to `.env` and fill in your keys (Postgres/Supabase, Clerk, Gemini, Resend, Arcjet).

### 2. Web app (Next.js)
```bash
npm install
npx prisma migrate deploy   # applies migrations, incl. the user currency column
npm run dev                 # http://localhost:3000
```

Optional demo data (development only): sign in, create an account, then run
`fetch("/api/seed", { method: "POST" })` from the browser console on any app page.

### 3. ML inference service (Python)
The Next.js server calls this service server-side via `PYTHON_API_URL`. If it is offline, the dashboard falls back to rule-based insights.
```bash
pip install -r requirements.docker.txt
uvicorn api:app --reload --port 8000
```

### 4. Background jobs (Inngest)
```bash
npx inngest-cli@latest dev   # recurring transactions, budget alerts, monthly reports
```

### Docker
```bash
docker compose up --build
```

---
**Developed by:** Dhruvil Galaiya

