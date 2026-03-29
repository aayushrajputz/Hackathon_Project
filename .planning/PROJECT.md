# BinaryPDF — Scalability Hardening

## What This Is
BinaryPDF is a Go + Next.js PDF toolkit SaaS. This milestone hardens the backend for production traffic by fixing 4 critical scalability issues that would crash the server under concurrent load.

## Context
- **Stack:** Go (Gin) backend, Next.js frontend, MongoDB, MinIO, Firebase Auth
- **Problem:** All PDF operations are unbounded — no concurrency limits, no request timeouts, temp files leak on crash, entire files loaded into RAM

## Requirements

### Active
- [ ] Worker pool to cap concurrent PDF operations
- [ ] Per-request temp directories with guaranteed cleanup
- [ ] Request body limits and per-route timeouts
- [ ] Background orphan temp file sweeper

### Out of Scope
- Frontend changes — backend only
- New PDF features — stability fixes only
- Database schema changes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Semaphore pattern for worker pool | Simple, no external deps, Go-idiomatic | Pending |
| Per-request UUID temp dirs | Guarantees cleanup with single `os.RemoveAll` | Pending |
| Gin middleware for timeouts | Non-invasive, applies at route group level | Pending |

---
*Last updated: 2026-03-29 after initialization*
