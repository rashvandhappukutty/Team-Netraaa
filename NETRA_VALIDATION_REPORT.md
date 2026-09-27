# NETRA Validation Report

## 1. System Status

NETRA is currently demo-operational in the local environment, but it is not yet a fully signed-off production system.

Verified live behavior:
- backend is running and serving API responses
- auth is working with the seeded demo investigator account
- the Operation Nexus dataset is active and populated
- the entity extraction and graph workflows are producing data

Outstanding limitation:
- one shipped end-to-end verification script still fails and therefore the final sign-off is not absolute

## 2. Tests Completed

The following checks were run successfully with fresh runtime evidence:

- Health endpoint check: `ONLINE`
- Login check with seeded investigator account succeeded
- Phase 1 integration test passed: `ALL NETRA PHASE 1 INGESTION, EXTRACTION & NORMALIZATION TESTS PASSED WITH 100% SUCCESS!`
- Phase 2 entity extraction/resolution test passed: `ALL NETRA PHASE 2 AI ENTITY EXTRACTION & RESOLUTION TESTS PASSED WITH 100% SUCCESS!`
- AI grounding validation for unsupported fact: the system now correctly refuses unsupported claims instead of inventing data

## 3. Tests Failed

The following test is currently failing:

- `node test_e2e.js`

Failure evidence:
- `SyntaxError: Unexpected token '<'`
- API response was HTML, not JSON

This indicates the script is not presently valid as a full JSON-based end-to-end verification pass.

## Actual Prototype Metrics

Confirmed from the live database and runtime output:

- sources: 4
- normalized records: 27
- entities: 82
- relationships: 54
- patterns: 3
- timeline events: 11
- leads: 2

## Security Status

- JWT authentication is active
- passwords are hashed with bcrypt
- synthetic local demo data is used
- the application is not hardened for production deployment

## AI Grounding Status

The AI assistant was adjusted to reject unsupported claims and return a clear no-evidence result instead of fabricating a fact.

Example verified query:
- "What is Devraj Malhotra's passport number?"

Verified response behavior:
- grounded refusal with `UNSUPPORTED FACT CHECK — NO VERIFIED EVIDENCE FOUND`

## Demo Readiness

NETRA is suitable for local demonstration with the seeded dataset and live API flow. It demonstrates the core investigation workflow and is useful for stakeholder walkthroughs.

However, it is not yet fully sign-off ready for production deployment or for complete end-to-end automation because one validation script still fails.

## Remaining Issues

- `test_e2e.js` still fails due to HTML/JSON mismatch
- full browser-level end-to-end workflow has not been fully proven in the UI
- project remains a local demo prototype, not a production system

## Files Modified

- `README.md`
- `server/src/services/aiAssistantService.js`

## Exact Commands to Run NETRA

```powershell
cd e:\SIH
npm --prefix server install
npm --prefix client install
```

Start backend:

```powershell
cd e:\SIH
npm --prefix server run start
```

If port 5000 is busy, stop the old process first:

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Start frontend:

```powershell
cd e:\SIH
npm --prefix client run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:3000
```

Login:

```text
Email: priya.sharma@netra.gov.in
Password: Investigator@2026
```

## Final Verdict

The prototype is live, demonstrates the investigation workflow, and passes the major seeded-data validation checks. It is not fully production-ready because the final end-to-end script still fails and the UI workflow remains partially unproven.
