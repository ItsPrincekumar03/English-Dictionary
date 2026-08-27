# PRODUCTION RELEASE CHECKLIST

## AUTOMATED LOCAL / CI CHECKS
- PASS - Tests passing (64/64)
- PASS - npm audit clean (0 vulnerabilities)
- PASS - Dataset validated (OEWN 2025 parsed, 127,311 canonical words)
- PASS - Migration safety certified (upsert only, 4 safety gates enforced)
- PASS - CI verified (GitHub Actions configured)
- PASS - Security verified (Secrets scanned, credentials masked)
- PASS - Licensing verified (NOTICE, README, about.html attribution in place)
- PASS - Deployment configuration verified (render.yaml, vercel.json safe routing)
- PASS - Secret Scan verified
- PASS - Frontend structural checks verified
- PASS - Backend API schemas verified

## AUTHENTICATED PRODUCTION CHECKS
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: Production backup required (MongoDB Atlas Snapshot)
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: Production authorization required (ALLOW, CONFIRM, VERIFY, HUMAN vars)
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: Database verification (Document counts, missing fields)
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: API verified (GET /api/words/... against live domain)
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: Frontend verified (Search, definitions, IPA, tags against live domain)
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: Rollback verified (Snapshot intact)
- BLOCKED — PRODUCTION AUTHENTICATION REQUIRED: 48-hour monitoring prepared (Render/Vercel dashboards)
