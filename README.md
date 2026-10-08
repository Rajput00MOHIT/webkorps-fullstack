# Webkorps Fullstack Platform

Enterprise web platform with an AI-driven knowledge retrieval, search intelligence, and conversion system.

---

## 📁 Repository Structure

```
webkorps-fullstack/
├── frontend/          # Next.js 16 (Turbopack, TypeScript, CSS Variables Design System)
│   ├── src/           # Components, Views, Sections, Assets & AI Assistant UI
│   ├── public/        # Static assets
│   └── package.json
│
├── backend/           # Node.js + TypeScript + Express + PostgreSQL (pgvector)
│   ├── src/           # API Routers, AI/RAG Orchestration, Ingestion & Retrieval
│   ├── data/          # Seed datasets, golden datasets, crawled intelligence
│   ├── tests/         # Comprehensive backend integration & unit tests
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env     # Update your GEMINI_API_KEY, DATABASE_URL, etc.
npm run build
npm start
```
The backend API runs on `http://localhost:4000/api/v1`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend application runs on `http://localhost:3000`.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, TypeScript, React 19, Vanilla CSS Design System, Responsive Navigation & Mega-Menus.
- **Backend**: Express, TypeScript, PostgreSQL + pgvector, Gemini 2.5 Orchestration, Crawling & Geo Intelligence Pipelines.
- **AI Features**: Corp Talk / AI Conversation Assistant, Streaming responses, Rich Markdown formatting, Source citation cards, Entity graph retrieval.

---

## 📄 License
Private & Proprietary - Webkorps Technologies.
