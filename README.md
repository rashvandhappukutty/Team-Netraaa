# NETRA

NETRA is a local demo prototype for investigative intelligence analysis. It is designed to ingest fragmented case evidence, normalize it into a usable data model, resolve entities and relationships, and present an operational dashboard for investigators.

This project is not a production law-enforcement system. It is a synthetic, demo-ready environment for showcasing an investigation workflow, evidence handling, knowledge graph generation, AI-assisted analysis, and lead review.

## Overview

NETRA combines a React front end with an Express + SQLite backend to support:

- secure local login and investigator sessions
- multi-source evidence ingestion
- normalization and traceability for source records
- entity extraction and resolution
- relationship and graph analysis
- suspicious-pattern detection
- timeline reconstruction
- lead generation and investigator review
- grounded AI responses tied to the loaded investigation data

The included demo case is an Operation Nexus investigation focused on a synthetic cyber and financial crime scenario.

## Tech Stack

- Frontend: React, Vite, Lucide icons
- Backend: Node.js, Express
- Database: SQLite via sql.js
- Auth: JWT with bcrypt
- Data handling: CSV, text, structured normalized records

## Project Structure

```text
.
├── client/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   ├── data/
│   ├── uploads/
│   └── package.json
├── test_e2e.js
├── test_e2e_phase1.js
├── test_e2e_phase2.js
├── package.json
├── README.md
└── .gitignore
```

## Key Demo Workflow

The core investigation experience follows this flow:

1. Login as an investigator
2. Open the investigation workspace
3. Review evidence sources and stats
4. Run entity extraction and graph analysis
5. Inspect relationships, timeline, and suspicious patterns
6. Review generated leads
7. Query the grounded AI assistant for investigation-specific answers

## Demo Credentials

A seeded investigator account is included for local use:

- Email: `priya.sharma@netra.gov.in`
- Password: `Investigator@2026`

## Prerequisites

- Node.js 18+
- npm
- Permission to bind local ports 3000 and 5000

## Installation

From the project root:

```bash
npm --prefix server install
npm --prefix client install
```

## Run the Application

Start the backend:

```bash
cd e:\SIH
npm --prefix server run start
```

Start the frontend:

```bash
cd e:\SIH
npm --prefix client run dev -- --host 0.0.0.0
```

Then open:

```text
http://localhost:3000
```

## Verification Scripts

The project includes sample validation scripts that exercise the API flow:

```bash
cd e:\SIH
node test_e2e_phase1.js
node test_e2e_phase2.js
node test_e2e.js
```

These scripts check the health endpoints, authentication, ingestion flow, AI entity processing, and investigation data lifecycle.

## Demo Data and Safety Notes

- The included data is intentionally synthetic
- It is designed for local demo usage only
- It contains no real personal data or live production intelligence
- AI answers are expected to be grounded in the investigation dataset and should not fabricate unsupported facts

## Security Notes

- Authentication uses JWT tokens
- Local passwords are hashed before storage
- This is a demo project and is not hardened for production deployment
- Do not expose the app publicly without additional security hardening

## Current Status

NETRA is suitable for local demonstration and validation in a developer environment. It is not intended as a production-ready criminal intelligence platform.

## Limitations

- SQLite is used for local persistence, not enterprise-grade multi-user database scaling
- The dataset is intentionally synthetic and limited to demonstrations
- AI grounding is scoped to the loaded investigation records and should not claim facts not present in the evidence set

## Contributing

This repository is intended for prototype/demo work. Changes should be focused on reliability, demonstration quality, and evidence-grounded analysis rather than broad feature expansion.

