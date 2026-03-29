# Beta Polish — Roadmap

## Milestone 2: Professional Polish & Friction Reduction

### Phase 5: Landing Page & Micro-Copy ✦
Clean up the landing page to remove fake social proof and improve the brand tone.
- `frontend/app/page.tsx` [MODIFY]
- **Success Criteria:**
  - 100% of fake social proof numbers removed.
  - "Neural Velocity" and AI-buzzwords replaced with benefit-led copy.
  - Indian students/freelancers mentioned in value proposition.

### Phase 6: Guest Access & Feature Gating ✦
Enable frictionless Merge, Compress, and Split PDF tools for unauthenticated users.
- `frontend/app/tools/layout.tsx` [MODIFY]
- `frontend/lib/store.ts` [MODIFY]
- **Success Criteria:**
  - Merge, Compress, and Split tools accessible without login.
  - Other tools still enforce login.
  - "Free" plan constraints apply to guest operations.

### Phase 7: Post-Op Engagement (Signup Banner) ✦
Add a subtle banner after a guest finishes a PDF operation to encourage signups.
- `frontend/components/tools/ToolResultBanner.tsx` [NEW]
- `frontend/app/tools/[tool]/page.tsx` [MODIFY]
- **Success Criteria:**
  - Signup CTA appears after output files are generated for guests.
  - Non-intrusive style (subtle banner, no popups).

### Phase 8: Final Sweep & Ralph Test ✦
End-to-end testing of guest flow vs authenticated flow.
- Verify guest users can successfully download output files.
- Verify guests cannot access private storage or AI summaries.
