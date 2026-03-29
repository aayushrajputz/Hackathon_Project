# BinaryPDF — Beta Polish

## What This Is
BinaryPDF is a lean, professional Go + Next.js PDF toolkit for students, freelancers, and small business owners in India. This milestone focuses on professionalizing the landing page and enabling guest access for core tools to lower the barrier to entry.

## Context
- **Stack:** Go (Gin) backend, Next.js frontend, MongoDB, Cloudflare R2 (MinIO local), Firebase Auth.
- **Current State:** Backend is hardened for high concurrency. Frontend is functional but has "fake" marketing copy and requires login for every basic tool.

## Current Milestone: v1.1 Beta Polish

**Goal:** Clean up the landing page for a smart, minimal look and allow frictionless guest usage of core PDF tools.

## Requirements

### Active
- [ ] **UI-01**: Remove all fake social proof stats (25M+, 800K+, etc.) from the landing page.
- [ ] **UI-02**: Rewrite landing page copy to be minimal, human-centric, and benefit-focused (Notion/Linear style).
- [ ] **UI-03**: Target copy specifically at Indian students, freelancers, and small business owners.
- [ ] **FE-01**: Enable guest access for Merge, Compress, and Split PDF tools (bypass login).
- [ ] **FE-02**: Implement a subtle post-operation signup banner for guests ("Save and share your files — create a free account").
- [ ] **BE-01**: Ensure backend handlers allow unauthenticated requests for Merge, Compress, and Split (with "free" plan limits).

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
*Last updated: 2026-03-29 — Milestone v1.1 started*
