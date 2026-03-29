# BinaryPDF — Beta Polish

## What This Is
BinaryPDF is a lean, professional Go + Next.js PDF toolkit for students, freelancers, and small business owners in India. This milestone focuses on professionalizing the landing page and enabling guest access for core tools to lower the barrier to entry.

## Context
- **Stack:** Go (Gin) backend, Next.js frontend, MongoDB, Cloudflare R2 (MinIO local), Firebase Auth.
- **Current State:** Backend is hardened for high concurrency. Frontend is functional but has "fake" marketing copy and requires login for every basic tool.

## Current Milestone: v1.1 Beta Polish

**Goal:** Clean up the landing page for a smart, minimal look and allow frictionless guest usage of core PDF tools.

## Requirements

### Validated (v1.1 Beta Polish)
- [x] **UI-01**: Removed all fake social proof stats (25M+, 800K+, etc.) from the landing page.
- [x] **UI-02**: Rewrote landing page copy to be minimal, human-centric, and benefit-focused.
- [x] **UI-03**: Targeted copy at Indian students, freelancers, and SMOs.
- [x] **FE-01**: Enabled guest access for Merge, Compress, and Split PDF tools (bypass login).
- [x] **FE-02**: Implemented a subtle post-operation signup banner for guests.
- [x] **BE-01**: Ensured backend handlers allow unauthenticated requests for Merge, Compress, and Split.

### Validated (v1.0 Scalability Hardening)
- [x] Worker pool to cap concurrent PDF operations
- [x] Per-request temp directories with guaranteed cleanup
- [x] Request body limits and per-route timeouts
- [x] Background orphan temp file sweeper

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No fake stats | Builds trust with smart users; "minimal" is the brand. | Active |
| Guest access for top 3 tools | Lowers friction; Merge/Compress/Split are highest volume entry points. | Active |
| Cloudflare R2 for Prod | Zero egress fees; standard S3 API compatibility. | Confirmed |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 — Milestone v1.1 Complete*
