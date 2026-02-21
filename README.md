# 🛸 UB Gym Tracker - The Omniverse Training Matrix

A futuristic, high-performance gym tracking application designed for the modern athlete. Features individual PR rankings, dynamic routine management, and a global leaderboard matrix.

## 🚀 Key Features

- **Biological Access**: Secure Username/Email based authentication.
- **Global Leaderboard Matrix**: Compete with other users in individual lifts (Bench, Squat, Deadlift) and overall Powerlifting Total.
- **Dynamic Routine Engine**: Manage your weekly training cycles with the intuitive Matrix editor.
- **Operational Mode (Deload)**: High-tech toggle for deload weeks with UI-wide accent changes.
- **PR Signal Tracking**: Real-time persistence of your personal records across all devices.
- **Archive System**: Detailed history logs of every training session.

## 🛠️ Tech Stack

**Frontend:**
- React + TypeScript
- Vite (Build Tool)
- Vanilla CSS (Glassmorphism & Ben 10 Aesthetic)

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Argon2 (Secure Password Hashing)
- JWT (User Session Integrity)

## 📡 Installation & Setup

### Prerequisites

- Node.js (v18+)
- Python (3.10+)
- PostgreSQL Database

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ub_gym
JWT_SECRET=your_super_secret_key
```

Run the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
npm install
```

Create a `.env.local` if needed:
```env
VITE_API_URL=http://localhost:8000/api
```

Run the app:
```bash
npm run dev
```

## 🌍 Deployment

### Backend
The backend is ready to be deployed on platforms like **Render**, **Railway**, or **Heroku**.
- Ensure `DATABASE_URL` is set in the environment variables.
- The `database.py` includes a fix for Postgres dialect mapping.

### Frontend
Build the production bundle:
```bash
npm run build
```
Deploy the `dist/` folder to **Vercel**, **Netlify**, or **Cloudflare Pages**.

---

*Designed for the Omniverse. Stay synced.* 🛸
