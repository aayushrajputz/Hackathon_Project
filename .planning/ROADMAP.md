# Scalability Hardening — Roadmap

## Milestone 1: Production-Ready Backend

### Phase 1: Worker Pool & Config ✦
Add concurrency-limited worker pool and config fields.
- `internal/services/worker_pool.go` [NEW]
- `internal/config/config.go` [MODIFY]
- `internal/services/pdf_service.go` [MODIFY]

### Phase 2: Unique Temp Dirs & Cleanup ✦
Per-request temp directories and orphan sweeper.
- `internal/services/pdf_service.go` [MODIFY]
- `cmd/server/main.go` [MODIFY]

### Phase 3: Request Limits & Timeout Middleware ✦
Body size limits, per-route timeouts, and server wiring.
- `internal/middleware/timeout.go` [NEW]
- `cmd/server/main.go` [MODIFY]
- `internal/handlers/core_pdf_handler.go` [MODIFY]

### Phase 4: Verify & Ship ✦
Build, vet, and validate all changes compile correctly.
