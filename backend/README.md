# Corp Talk — Backend Platform

This repository contains the standalone, decoupled **Backend, Intelligence Engines, Database Migrations, APIs, and Services** for the **Corp Talk** platform.

Primary Dogfood Customer: **Webkorps**

---

## Architecture Overview

```text
                    CORP TALK BACKEND
                           │
                     API / Gateway (/api/v1)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Auth/RBAC        Multi-Tenancy        Healthcheck
        │                  │
        └──────────────────┼──────────────────┘
                           │
                    CORE SERVICES
                           │
      ┌────────────┬───────┼────────┬────────────┐
      │            │       │        │            │
   Assistant     Leads    Content Knowledge  Analytics
      │            │       │        │            │
      └────────────┴───────┼────────┴────────────┘
                           │
                 INTELLIGENCE ENGINE
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
 Knowledge Graph     GEO Citations       Competitor Engine
       │                   │                   │
       └───────────────────┼───────────────────┘
```

---

## Directory Structure

```text
backend webkorps/
├── docs/
│   ├── Webkorps_Website_AI_SEO_Strategy_Report.pdf  # Strategic Reference
│   ├── architecture.md                              # Full Backend Spec
│   └── database.md                                  # Schema & ERD
├── src/
│   ├── config/env.ts                                # Environment Loader
│   ├── db/
│   │   └── migrations/001_initial_schema.sql        # PostgreSQL + pgvector Schema
│   ├── middleware/
│   │   ├── tenantContext.ts                         # Multi-Tenancy Resolver
│   │   └── errorHandler.ts                          # Error Standardizer
│   ├── modules/
│   │   ├── assistant/                               # AI Assistant RAG Engine
│   │   ├── leads/                                   # Lead Scoring & Intake
│   │   ├── content/                                 # Dynamic Insights & Articles
│   │   ├── knowledge/                               # Ground Truth Entity Graph
│   │   ├── analytics/                               # Telemetry & Event Ingestion
│   │   ├── crawler/                                 # Web Crawler Worker
│   │   ├── seo/                                     # Technical SEO Auditing
│   │   └── geo/                                     # AI Visibility Engine
│   ├── providers/                                   # FOSS / Self-Hosted Adapters
│   ├── queue/                                       # Async Task Queues
│   └── server.ts                                    # Express API Server
├── tests/
│   └── test_ai_assistant.mjs                        # Verification Suites
├── package.json
└── tsconfig.json
```

---

## Running the Backend

```bash
# 1. Install dependencies
npm install

# 2. Start development server with live reload
npm run dev

# 3. Test healthcheck
curl http://localhost:4000/health
```

---

## Frontend Integration Point

The frontend running in `/Users/webkorps/Desktop/Webkorps website` communicates with this backend over standard HTTP endpoints:

- `POST http://localhost:4000/api/v1/conversations/messages` -> AI Assistant Dialog
- `POST http://localhost:4000/api/v1/leads` -> Contact / Consultation Intake
- `GET http://localhost:4000/api/v1/content/insights` -> Dynamic Insights Blog
- `GET http://localhost:4000/api/v1/knowledge/ground-truth` -> Webkorps Entity Graph
- `POST http://localhost:4000/api/v1/analytics/events` -> User Event Tracking
