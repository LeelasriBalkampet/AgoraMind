# AgoraMind — Voice-First Socratic Tutoring System

**Live Demo:** [https://agora-mind-tau.vercel.app](https://agora-mind-tau.vercel.app)

A full-stack web application that uses the **Socratic method** to guide students through learning. The AI tutor **never gives direct answers** — instead, it asks questions to help students discover answers themselves.

## Features

- **Dual Input Modes** - Type or use push-to-talk voice input
- **Socratic Tutoring** - AI never gives answers, only guides through questions
- **Multi-Agent System** - 4 specialized agents (Question, Analysis, Socratic, Fitness)
- **Session Tracking** - Neon PostgreSQL database stores all conversations and progress
- **Real-time Dashboard** - Mastery score, weak areas, and recommendations

## Tech Stack
- React 18
- FastAPI
- Python 3.11+
- PostgreSQL

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         React + JavaScript + Vite                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Chat   │  │  Voice   │  │  Dashboard   │  │
│  │Interface │  │  Input   │  │   Sidebar    │  │
│  └────┬─────┘  └────┬─────┘  └──────────────┘  │
│       │              │                           │
│       └──────┬───────┘                           │
│              │ WebSocket + REST                  │
└──────────────┼───────────────────────────────────┘
               │
┌──────────────┼───────────────────────────────────┐
│              │          Backend                   │
│         FastAPI + WebSocket                       │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │          Multi-Agent System                │   │
│  │                                            │   │
│  │  Question → Analysis → Socratic → Fitness  │   │
│  │   Agent      Agent      Agent      Agent   │   │
│  └───────────────────┬───────────────────────┘   │
│                      │                           │
│              ┌───────┴───────┐                   │
│              │    SQLite     │                   │
│              │   Database    │                   │
│              └───────────────┘                   │
└──────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)

### 1. Clone & Setup

```bash
cd AgoraMind
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set up OpenAI API key
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY
# Without it, the app runs in demo mode with mock responses

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:5173** in your browser.

## How to Use

1. **Open the app** - you'll get a unique student ID automatically
2. **The tutor greets you** - "What topic would you like to explore today?"
3. **Type or speak** - use the text input or hold the microphone button to talk
4. **Learn through questions** - the tutor asks guiding questions, never gives answers
5. **Track your progress** - check the dashboard for mastery score and weak areas
6. **Close & resume** - session summary is generated when you disconnect

## 🤖 Multi-Agent System

| Agent | Role |
|-------|------|
| **Question Agent** | Generates initial probing questions about the chosen topic |
| **Analysis Agent** | Analyzes student responses, identifies knowledge gaps |
| **Socratic Agent** | Generates next guiding question based on gap analysis |
| **Fitness Agent** | Tracks progress, calculates mastery score, recommends next steps |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI API key for GPT + Whisper. Without it, runs in demo mode. |

## Design

- **Dark theme** with blue/purple gradient accents
- **Glassmorphism** card effects with backdrop blur
- **Smooth animations** on messages, buttons, and dashboard
- **Responsive** - works on desktop and mobile
- **Push-to-talk** - large, intuitive voice button

## Project Structure

```
AgoraMind/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utilities
│   │   ├── App.jsx            # Root component
│   │   └── index.css          # Design system
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── agents/            # Multi-agent system
│   │   ├── main.py            # FastAPI app
│   │   ├── database.py        # SQLite layer
│   │   ├── websocket_handler.py
│   │   └── transcribe.py
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy the `dist/` folder to Vercel
```

### Backend → Render
- Set the start command to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add `OPENAI_API_KEY` as an environment variable
- Set the root directory to `backend/`
