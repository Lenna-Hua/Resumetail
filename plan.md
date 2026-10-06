# ResuTail — Phased Build Plan

> Fast resume tailoring workspace. Checker-first, editor-first, AI-second. All third-party services use **free tiers only**.

**Source briefs:**
- Original: `TailorStack ATS-Friendly Resume & Cover Letter Web App - Detailed Product & Design Brief.docx`
- Update (2026-07): `brief/resume-tailoring-follow-up-brief.docx` (workspace pivot)
- **v2 (2026-07):** `brief/resume-tailoring-brief-v2.docx` (modular content library + template families)

---

## Product direction (updated)

**Positioning:** ResuTail is a fast resume optimization workspace — import an existing resume, compare it to a target job description, identify ATS and recruiter gaps, edit quickly, and use AI only when you choose.

**Promise:** Upload your resume → paste a job description → see what to fix → tailor fast → export an ATS-ready version.

**Core principle:** Checker-first, editor-first, AI-second. The app must be useful with **zero AI calls**.

| Old framing | New framing |
|-------------|-------------|
| AI-first resume generator | Resume tailoring workspace |
| Linear wizard (paste → tailor → export) | Persistent 3-panel workspace |
| Opaque ATS feedback | Transparent multi-dimension score |
| Single resume session | Multi-version management |
| AI as main CTA | AI as optional, contextual actions |

---

## Guiding principles

| Principle | Why |
|-----------|-----|
| **Checker-first** | Rules + lightweight NLP before any LLM; lower cost, higher trust |
| **Editor-first** | Users already have resumes; optimize for fast editing, not generation |
| **AI-second** | Explicit user actions only; never auto-overwrite original content |
| **Explainable scoring** | Five visible dimensions — no black-box “match rate” |
| **Multi-version** | Target users maintain several resume bases; duplication is core |
| **Mobile-first** | Phone is primary; one pane per mode, bottom nav; desktop split-pane is P2 |
| **Client-first** | Parsing, checks, and scoring run in browser; stay inside free tiers |
| **Privacy-first** | `localStorage` by default; no server file storage in MVP |
| **Honest ATS** | Guidance, not guarantees |

---

## Free third-party stack

(Unchanged from original plan — see sections below.)

### Hosting & deploy

| Service | Free tier | Use |
|---------|-----------|-----|
| **Vercel Hobby** | 100 GB bandwidth, serverless functions | Primary host (Next.js) |
| **Netlify Free** | Static + functions | Backup host if preferred |

### AI (free tiers)

| Service | Free tier | Best for |
|---------|-----------|----------|
| **Google AI Studio (Gemini)** | Free RPM/RPD for `gemini-2.5-flash-lite` | JD extraction, bullet rewrite, cover letters |
| **Groq** | Free tier | Fallback if Gemini limits hit |
| **Hugging Face Inference** | Free tier (rate-limited) | Fallback only |

**Primary choice:** Gemini Flash Lite via Google AI Studio + Vercel AI SDK.

### Parsing & export (npm, no API cost)

| Library | Use |
|---------|-----|
| **mammoth** | DOCX → text |
| **pdfjs-dist** | PDF → text |
| **jspdf** | PDF export |
| **docx** | DOCX export (Phase 2b) |

### NLP / ATS (no paid API)

| Approach | Use |
|----------|-----|
| Custom rules + regex | Sections, dates, formatting, contact info |
| String similarity | JD keyword coverage |
| Heuristics | Bullet strength (metrics, action verbs) |

### Storage & auth

| Service | Free tier | When |
|---------|-----------|------|
| **localStorage / IndexedDB** | Free | Default — guest sessions + resume versions |
| **Supabase** | 500 MB DB, 50K MAU | Optional account sync (Phase 3) |

---

## Transparent scoring model

Overall score is a weighted sum of five explainable dimensions (not one opaque number):

| Dimension | Weight | What it measures |
|-----------|--------|------------------|
| Keyword & skill coverage | 35% | JD skills/keywords found in resume |
| Section completeness | 20% | Experience, Education, Skills, etc. present |
| ATS formatting safety | 20% | Single-column, no tables/columns, plain-text friendly |
| Bullet quality | 15% | Metrics, action verbs, outcome language |
| Contact & metadata | 10% | Name, email, phone, LinkedIn hints |

Each dimension shows: score (0–100), status (good/warning/poor), and actionable notes.

---

## Workspace architecture

**IA reference:** `brief/Reference/information-architecture.md`, `screen-map.md`, `mobile-first-strategy.md`

### Routes

```
/                     Landing
/app                  Dashboard (resume versions)
/app/new              Create — import or paste
/app/v/[id]           Workspace (?mode=edit|tailor|checks|more)
```

### Mobile (<1024px) — primary

```
[ ← Dashboard · version · score · Export ]
┌──────────────────────────────────────────┐
│  Single mode pane (Edit | Tailor | Checks)│
└──────────────────────────────────────────┘
[ Edit ] [ Tailor ] [ Checks ] [ More ]
```

Library, Customize, Cover letter, AI rewrites → **More** sheet until P1/P2.

### Desktop (≥1024px)

Multi-panel grid (Library | Resume | JD | Checks) until P2 split-pane polish.

No linear wizard for the core loop — import and JD are always reachable via modes.

---

## Phase status overview

| Phase | Name | Status | Focus |
|-------|------|--------|-------|
| 0 | Foundation | Done | Next.js, Tailwind, shadcn, landing |
| 1 | MVP Core Loop | Done | Paste → tailor → ATS → PDF (wizard) |
| 2a | File upload | Done | mammoth + pdfjs client-side import |
| **2b** | **Workspace pivot** | **Done** | 3-panel UI, scoring, versions, structured editor, landing copy, base diff |
| **2e** | **v2: Content library + templates** | **Done** | Library, master profile, Workflow B, customize + export settings |
| **2f** | **Mobile-first IA** | **P3 done — QA pending** | IndexedDB, backup nudge, PWA manifest; manual device QA remaining |
| 2c | Optional AI extensions | Done | Cover letter, tone, humanize |
| 2d | Export & analytics | Done | DOCX export, Vercel Analytics |
| 3 | Persistence & polish | Done | Supabase auth (**optional** for sync) + cloud sync, application history, share links, ATS tooltips |
| 4 | Growth | In progress | Groq fallback done; ATS gap closure done; **P0 trust/access** in progress; extension deferred |

---

## Phase 5 — Trust, access & growth (active)

> Product research (2026-10): keep checker-first moat; fix auth/privacy contradiction; close Teal-style workflow gap next.

### P0 — Trust & access (now)

- [x] Guest `/app` access (no forced sign-in)
- [x] Honest privacy copy (local-first + optional sync)
- [x] Restore AI API routes + model helpers (keys still env-only)
- [x] Offline / heuristic JD Analyze fallback
- [x] Header + sign-in UX for guest vs sync
- [ ] Production deploy health + env verification
- [ ] Remaining mobile device QA (iOS/Android PDF)

### P1 — Workflow moat (next)

- [ ] Chrome extension: capture JD → Tailor mode
- [ ] Application board stages (Saved → Applied → …)
- [ ] Deep link from board card → workspace
- [ ] Post-export onboarding (extension / save application)

### P2 — Scoring credibility

- [ ] Section-aware keyword placement
- [ ] Template ATS plain-text round-trip fixtures
- [ ] Score regression snapshots

### P3 — Scale

- [ ] Split `tailoring-workspace.tsx`
- [ ] Unit tests for score/coverage/parser
- [ ] Monetize AI/sync only (never the checker)

---

## Phase 2e — v2 modular workspace (current)

**Goal:** Per `resume-tailoring-brief-v2.docx` — reusable career content library + presentation-only template families.

**Product shift:** Master profile + content blocks + resume assemblies (not single-document-only).

### 2e.1 Career content library

- [x] `ContentBlock` types + localStorage storage (`content-library.ts`)
- [x] Import structured resume sections into library (deduped)
- [x] Search, filter, star blocks
- [x] Rule-based JD recommendations (no AI)
- [x] `ContentLibraryPanel` — browse + "Add to resume"
- [x] Block metadata editor (function, seniority, domain tags)
- [x] Drag-from-library into resume sections
- [x] Workflow B: build new resume from library only (no upload)

### 2e.2 Template families

- [x] Template definitions (`resume-templates.ts`) — ATS, Harvard-style, Clean, Tech, Compact, Student
- [x] `TemplatePicker` UI + persist selection
- [x] PDF export respects template typography/spacing
- [x] Live template preview in workspace
- [x] Student template: education-first section ordering

### 2e.3 Workspace layout (v2)

- [x] Four-surface layout: Library | Resume | JD | Checks (+ template row)
- [x] Template/format panel integrated with export settings (`CustomizePanel`)

### Checklist

- [x] Content library storage + types
- [x] Import from resume → library
- [x] Add block to resume canvas
- [x] JD-suggested blocks (rules)
- [x] Template picker + PDF template rendering
- [x] Master profile model (identity separate from blocks)
- [x] Multi-select insert
- [x] Drag-and-drop library → resume

---

## Phase 2f — Mobile-first IA (current priority)

**Goal:** Reference-informed IA with **mobile web as primary** — dashboard → workspace modes → export. Adopt modes; reject desktop split-pane on small screens.

**Strategy doc:** `brief/Reference/mobile-first-strategy.md`

### 2f.1 P0 — Mobile MVP

| # | Task | Status |
|---|------|--------|
| 1 | Mobile app shell (bottom nav, header, safe-area) | Done |
| 2 | Dashboard `/app` — version cards, Open/Tailor/Export | Done |
| 3 | Workspace mode router `?mode=edit\|tailor\|checks\|more` | Done |
| 4 | Edit mode — single pane on mobile | Done |
| 5 | Tailor mode — JD paste + Analyze | Done |
| 6 | Checks mode — 5-dimension score | Done |
| 7 | Export from header (PDF) | Done |
| 8 | Remove 4-panel vertical stack on mobile | Done |
| 9 | Touch targets ≥44px | Done |
| 10 | `/app/new` create/import entry | Done |

### 2f.2 P1 — Core parity

- [x] Preview bottom sheet (lazy)
- [x] Save tailored copy → Dashboard tab
- [x] Customize mode lite (template + color)
- [x] Version switcher in header dropdown
- [x] Auto-save indicator
- [x] JD paste-from-clipboard button
- [x] Landing mobile pass

### 2f.3 P2 — Enhance

- [x] Review mode (suggestion queue)
- [x] Content library in More sheet
- [x] Customize full (text/layout sub-tabs)
- [x] Cover letter under More
- [x] Desktop split-pane at `lg:`

### 2f.4 P3 — Hardening

- [x] IndexedDB migration (dual-write + recovery from IDB)
- [x] Export backup nudge
- [x] Optional PWA (web manifest + appleWebApp)
- [ ] Auth + sync (Phase 3)

### Mobile QA checklist

- [x] 320px width — no horizontal scroll (automated 320×568)
- [ ] Import PDF from Files app (iOS + Android)
- [ ] Paste JD from LinkedIn / Indeed
- [ ] Analyze JD without network (after load)
- [x] Edit bullet → score updates live
- [ ] Export PDF on iOS Safari
- [x] Tab backgrounded 10 min — stale-session banner
- [ ] Clear site data — graceful empty state
- [x] Portrait ↔ landscape stable (resize smoke)
- [x] Virtual keyboard — field visible (`KeyboardInsetProvider`)
- [x] Long resume scroll performance OK
- [x] AI rewrite loading + error states

### Success criteria (P0 done)

1. Import → paste JD → see score → edit bullet → export PDF on iPhone Safari, no horizontal scroll
2. Each mode shows one primary column on mobile
3. Analyze works offline after initial load
4. Dashboard lists versions with Open/Tailor actions

### Track G — Mobile-first (parallel)

| Task | Files | Blocked by |
|------|-------|------------|
| Mode hook + types | `use-workspace-mode.ts`, `workspace-mode.ts` | — |
| Media query hook | `use-media-query.ts` | — |
| Mobile shell | `mobile-workspace-shell.tsx` | hooks |
| Dashboard | `versions-dashboard.tsx`, `app/page.tsx` | versions API |
| Workspace routes | `app/v/[id]/page.tsx`, `app/new/page.tsx` | shell |
| Mode router refactor | `tailoring-workspace.tsx` | shell + hooks |

**Batch 6 (now):** 2f P0 mobile shell + dashboard + mode router  
**Do not start:** desktop split-pane polish until P0 QA passes

---

## Phase 2b — Workspace pivot (complete)

**Goal:** Reframe the app from wizard to tailoring workspace per follow-up brief.

### 2b.1 Transparent match scoring

- [x] `src/lib/match-score.ts` — five-dimension weighted score
- [x] Extend ATS checker with section completeness, contact metadata, plain-text preview
- [x] `ChecksPanel` component — dimension breakdown + notes

### 2b.2 Multi-version management

- [x] `src/lib/resume-versions.ts` — save/duplicate/list versions in localStorage
- [x] Version picker UI — select base, duplicate as new version, name versions
- [x] Preserve original imported text for comparison and undo

### 2b.3 Structured resume editor

- [x] `src/lib/structured-resume.ts` — parse text into editable sections + bullets
- [x] Inline editing of bullets and section content
- [x] Reorder bullets within sections (stretch)
- [x] Side-by-side base vs. current diff indicator

### 2b.4 Workspace layout

- [x] Replace wizard with `TailoringWorkspace` — 3-panel responsive layout
- [x] JD panel always accessible; re-run checks on edit without re-calling AI
- [x] AI actions secondary (per-bullet “Rewrite” button, not bulk-first CTA)
- [x] Plain-text ATS extraction preview in checks panel

### 2b.5 Landing copy update

- [x] Reflect workspace positioning (not “AI resume builder”)

### Checklist

- [x] Match score engine (5 dimensions)
- [x] Version storage + picker
- [x] Structured resume parser + inline editor
- [x] 3-panel workspace UI
- [x] Checks panel with transparent scoring
- [x] ATS plain-text preview
- [x] Wire `/app` to workspace

---

## Phase 2c — Optional AI extensions

**Goal:** High-value AI features that remain optional and user-triggered.

### Features

- Cover letter generator (resume + JD + tone preset)
- Tones: Concise Professional, Confident & Friendly, Direct
- “Humanize” pass on cover letter or summary
- Summary generation for target role

### API routes

| Route | Calls | Trigger |
|-------|-------|---------|
| `POST /api/extract-jd` | 1× Gemini | User pastes JD (existing) |
| `POST /api/tailor-bullet` | 1× Gemini | User clicks “Rewrite bullet” |
| `POST /api/cover-letter` | 1× Gemini | User clicks “Draft cover letter” |

### Checklist

- [x] Cover letter API + UI
- [x] Tone presets
- [x] Humanize pass

---

## Phase 2d — Export & analytics

- [x] DOCX export (`docx` npm)
- [x] Vercel Web Analytics

---

## Phase 3 — Persistence & polish

- [x] Supabase auth (optional — guest can use `/app`; account enables sync)
- [x] Cloud data sync (`user_data` jsonb table, pull on login / debounced push)
- [x] Application history per JD
- [x] View-only share links
- [x] ATS education tooltips + disclaimers

---

## Phase 4 — Growth & extensions

- [ ] Chrome extension (JD capture)
- [x] Groq fallback for Gemini limits
- [ ] Multi-region templates

**Defer until validated:** paid parsers, Jobscan-style APIs, billing.

---

## Parallel workstreams

Use these tracks to work in parallel without blocking each other:

### Track A — Scoring & checks (no UI dependency)

| Task | Files | Blocked by |
|------|-------|------------|
| Match score engine | `match-score.ts` | `types.ts` |
| Extend ATS checker | `ats-checker.ts` | — |
| Plain-text preview util | `ats-text-preview.ts` | — |

**Can start immediately.** No UI or storage changes needed.

### Track B — Data & versions (no UI dependency)

| Task | Files | Blocked by |
|------|-------|------------|
| Version types + storage | `resume-versions.ts`, `types.ts` | — |
| Structured resume parser | `structured-resume.ts` | `types.ts` |

**Can start immediately** in parallel with Track A.

### Track C — UI components (depends on A + B types)

| Task | Files | Blocked by |
|------|-------|------------|
| Checks panel | `checks-panel.tsx` | `match-score.ts` types |
| Version picker | `version-picker.tsx` | `resume-versions.ts` |
| Structured editor panel | `resume-editor-panel.tsx` | `structured-resume.ts` |
| JD insights panel | `jd-insights-panel.tsx` | `coverage.ts` (exists) |

**Tracks C1, C2, C3 can run in parallel** once A/B types are merged.

### Track D — Workspace shell (integration)

| Task | Files | Blocked by |
|------|-------|------------|
| 3-panel layout | `tailoring-workspace.tsx` | C panels exist |
| Wire `/app` | `app/page.tsx` | workspace shell |
| Landing copy | `page.tsx` | — (parallel anytime) |

### Track E — Deferred (parallel later)

| Task | When |
|------|------|
| Cover letter API + UI | After workspace stable |
| DOCX export | After workspace stable |
| Vercel deploy | Anytime (independent) |

### Track F — v2 content library (parallel, agent-owned)

| Task | Files | Blocked by |
|------|-------|------------|
| Content block types + storage | `content-library.ts`, `types.ts` | — |
| Library panel UI | `content-library-panel.tsx` | storage |
| Template families | `resume-templates.ts`, `template-picker.tsx` | — |
| Wire workspace 4-panel | `tailoring-workspace.tsx` | panels |
| PDF template rendering | `pdf-export.ts` | templates |

**Do not overlap:** Track E cover letter (2c), DOCX export (2d), Vercel deploy — other agents.

### Recommended parallel batches

**Batch 1 (done):** A + B + landing copy
**Batch 2 (done):** C1 + C2 + C3 in parallel
**Batch 3 (done):** D integration
**Batch 4 (now):** 2e content library + templates
**Batch 5 (parallel, other agents):** 2c cover letter, 2d DOCX, deploy

---

## Architecture (workspace)

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Next.js client)                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Structured   │ │ JD + coverage│ │ Match score + ATS checks │ │
│  │ editor       │ │ (rules)      │ │ (rules, no LLM)          │ │
│  │ Versions     │ │              │ │ Plain-text preview       │ │
│  │ localStorage │ │              │ │                          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST only on explicit AI actions
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Vercel Serverless — /api/extract-jd, /api/tailor-bullet        │
│  (+ rate limit ~20 AI calls/day)                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Google AI Studio — Gemini Flash Lite (free tier)               │
└─────────────────────────────────────────────────────────────────┘
```

Checks and scoring run entirely client-side. AI is optional.

---

## Free-tier budget guardrails

| Resource | Free limit | Mitigation |
|----------|------------|------------|
| Vercel bandwidth | 100 GB/mo | Client-side parsing |
| Vercel serverless CPU | ~4 hr/mo Hobby | Short functions; checks client-side |
| Gemini API | RPM/RPD caps | AI only on explicit user action |
| localStorage | ~5 MB | Text only, no file blobs |

---

## What to cut if time is tight

| Cut | Impact |
|-----|--------|
| Cover letters | Medium — Phase 2c |
| DOCX export | Low — PDF enough for MVP |
| Bullet reorder drag-drop | Low — edit in place first |
| Accounts | Low — localStorage fine |
| Share links | Low — Phase 3 |

**Never cut from workspace pivot:** import → JD compare → transparent checks → inline edit → optional AI → PDF export.

---

## Product differentiators

1. Checker-first workspace — useful without AI
2. Transparent five-dimension match score (not opaque AI judgment)
3. Multi-version resume management for repeat applicants
4. JD-driven gap analysis with visible missing skills
5. Optional diff-based AI — user controls every change
6. Privacy-first: local parsing, local storage, clear data policy
7. Honest ATS feedback — guidance, not guarantees
