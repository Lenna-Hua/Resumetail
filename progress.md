# ResuTail — Build Progress Log

> Living record of what has been built. Update this file after each meaningful step so we never need to scroll back through chat history.
>
> **Plan reference:** [plan.md](./plan.md)  
> **Product briefs:** `brief/resume-tailoring-brief-v2.docx` (latest), `brief/resume-tailoring-follow-up-brief.docx`, original `.docx`

---

## Current status

| Field | Value |
|-------|-------|
| **Phase** | P0 trust/access (guest mode + AI routes + offline Analyze) |
| **Last updated** | 2026-10-06 |
| **Deployed URL** | https://resutail.vercel.app (verify deploy health) |
| **Dev server** | `npm run dev` → http://localhost:3000 |
| **Repo** | ResuTail |

---

## Phase summary

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Foundation | Done | Next.js 16, Tailwind 4, shadcn, landing, privacy |
| 1 | MVP Core Loop | Done (local) | Paste → tailor → ATS → PDF; AI verified with gemini-2.5-flash-lite |
| 2a | File upload | Done | mammoth + pdfjs client-side import |
| **2b** | **Workspace pivot** | **Done** | 3-panel UI, match score, versions, editor, landing, base diff, bullet reorder |
| **2e** | **v2: Content library + templates** | **Done** | Library, master profile, Workflow B, customize panel |
| **2f** | **Mobile-first IA** | **P3 done — QA pending** | IndexedDB, backup nudge, PWA; 12-item device QA remaining |
| **2c** | **Optional AI extensions** | **Done** | Cover letter, tone presets, humanize |
| **2d** | **Export & analytics** | **Done** | DOCX export, Vercel Web Analytics |
| 3 | Persistence & Polish | Done | History, share, ATS tooltips, Supabase auth (**optional sync**) + cloud sync |
| 4 | Growth & Extensions | In progress | Groq fallback; ATS heuristics; **P0 guest access + AI routes restored**; extension next |

**Legend:** `Not started` · `In progress` · `Done` · `Skipped`

---

## Completed steps

<!-- Add newest entries at the TOP of this section -->

### 2026-10-06 — P0: Guest access, privacy honesty, AI routes, offline Analyze

- [x] **Guest `/app`** — `proxy.ts` no longer redirects unauthenticated users; auth is for optional sync only
- [x] **Privacy copy** — landing documents local-first IndexedDB + optional Supabase `user_data` sync
- [x] **AI routes restored** — `extract-jd`, `tailor-bullet`, `cover-letter`, `humanize` + `ai-model` / `ai-generate` / rate-limit (removed from `.gitignore`)
- [x] **Heuristic JD extract** — `extract-jd-heuristic.ts`; Analyze works offline / without API keys; API falls back on quota/errors
- [x] **Header / auth UX** — always show Open workspace; Sign in secondary; Continue as guest on sign-in/up
- [x] **Docs** — README, `plan.md` Phase 5, progress log

**Still open:** Production deploy health; remaining mobile device QA; P1 Chrome extension + application board

**Key files:** `proxy.ts`, `extract-jd-heuristic.ts`, `src/app/api/**`, `ai-model.ts`, `ai-generate.ts`, `site-header.tsx`, `page.tsx`, `tailoring-workspace.tsx`, `version-picker.tsx`

### 2026-10-06 — Fix: Analyze tab OOM (VersionPicker remount loop)

- [x] **Root cause** — `VersionPicker` called `onVersionsChange` from a mount effect while parent remounted it via `key={versionKey}`, causing infinite remounts / Chrome Aw Snap (error 5)
- [x] **Fix** — load versions on mount without notifying parent; notify only after user mutations; stabilize parent callback with `useCallback`

### 2026-07-17 — ATS spec gap closure (heuristics)

- [x] **Strict ATS layout** — two-column templates marked `atsSafe: false`; font whitelist (Arial–Verdana) in Customize → Text; preview/PDF/DOCX honor font; match-score formatting penalizes two-column selection
- [x] **Weighted JD profile** — `ParsedJD.skills` hard/soft/domain with weights + acronym forms; `extract-jd` schema/prompt updated; coverage + keyword score use weighted coverage
- [x] **Heuristic skill mapping** — `skill-mapping.ts` matched/close/gap; surfaced in Checks + JD panels with jump-to-Review
- [x] **Honest skill add** — confirm dialog before inserting missing JD skills into Skills section
- [x] **Review edit-before-accept** — editable suggestion textarea; `edited` status when text changes
- [x] **Page trim** — `page-estimate.ts` + trim suggestions in Checks
- [x] **Import health** — text-level health strip on create + workspace import; Apply ATS template CTA (`simple-ats` + Helvetica)

**Key files:** `ats-fonts.ts`, `coverage.ts`, `skill-mapping.ts`, `page-estimate.ts`, `import-health.ts`, `extract-jd/route.ts`, `customize-panel.tsx`, `jd-insights-panel.tsx`, `checks-panel.tsx`, `review-panel.tsx`, `import-health-strip.tsx`, `tailoring-workspace.tsx`, `create-resume-page.tsx`

### 2026-07-07 — Phase 3: Supabase sign-in (required) + cloud sync + first-time welcome

- [x] **Auth** — `@supabase/ssr` + `@supabase/supabase-js`; email/password sign-up/sign-in via Server Actions
- [x] **Route gating** — `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) redirects unauthenticated visitors away from `/app/*` to `/sign-in`; falls back to pass-through (with a console warning) if Supabase env vars are unset, so the site doesn't 500 before setup
- [x] **Cloud data sync** — single `user_data` jsonb table (`supabase/schema.sql`) mirrors `browser-store.ts`'s `PERSISTED_KEYS`; pulls newer cloud data on sign-in, debounced push on every local write (dynamic import from `browser-store.ts` to avoid a static circular import and keep Supabase out of unrelated bundles)
- [x] **First-time-sign-in instructions** — `FirstTimeWelcome` modal shown once per account (`user_data.onboarded` flag), walks through import → paste JD → review score → export
- [x] **Header** — `AuthProvider` context + sign-in/sign-out controls in `SiteHeader`
- [x] Verified: `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass

**Key files:** `src/proxy.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/app/actions/auth.ts`, `src/components/auth-form.tsx`, `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`, `src/lib/cloud-sync.ts`, `src/components/auth-provider.tsx`, `src/components/first-time-welcome.tsx`, `supabase/schema.sql`

**Still open (user action):** Create a Supabase project, add `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` and Vercel env vars, and run `supabase/schema.sql` in the Supabase SQL editor.

### 2026-07-01 — Phase 4: Groq AI fallback

- [x] **`@ai-sdk/groq`** — optional provider via `GROQ_API_KEY`
- [x] **`withAiFallback`** — all AI routes retry on Gemini 429/503 with Groq when both keys set
- [x] **Groq-only mode** — works with only `GROQ_API_KEY` (no Gemini required)
- [x] Updated `.env.example` and quota error messaging

**Key files:** `ai-model.ts`, `ai-generate.ts`, `api/extract-jd`, `api/tailor-bullet`, `api/cover-letter`, `api/humanize`

### 2026-07-01 — Mobile QA follow-up + dashboard tab fix

- [x] **Checks mode @ 320px** — match score, dimension tooltips, ATS FAQ, plain-text preview
- [x] **Tab labels** — `whitespace-nowrap` on All/Tailored dashboard tabs (fixed "Tailor ed" break)
- [x] **Dashboard overflow** — `overflow-x-hidden` on dashboard container
- [x] **Edit → score** — `applyResumeText` re-runs `runChecks` on every edit (verified in code path)

### 2026-07-01 — P3 hardening + browser QA (320px)

- [x] IndexedDB dual-write confirmed wired across storage modules
- [x] Backup nudge banner visible on `/app` when no recent export
- [x] Session stale banner + keyboard inset provider in app shell
- [x] Fixed hydration-prone nav: plain `Link` in site header + dashboard Open/Tailor/New
- [x] Stable date formatting (`format-date.ts`) for SSR-safe labels
- [x] **Browser QA @ 320×568:** dashboard loads, version card, workspace bottom nav, share link button, no horizontal scroll observed
- [ ] **Manual only:** iOS/Android PDF import, Safari PDF export, 10min background tab, device keyboard

**Key files:** `browser-store.ts`, `backup-nudge.ts`, `format-date.ts`, `site-header.tsx`, `versions-dashboard.tsx`

### 2026-07-01 — Phase 2f P3: IndexedDB, backup nudge, PWA

- [x] **Application history** — log JD analyze per version; panel on Checks + dashboard
- [x] **View-only share links** — gzip-compressed `/share#…` + copy link in workspace header
- [x] **ATS education** — dimension tooltips + collapsible FAQ in checks panel
- [x] **Mobile QA (code)** — keyboard inset provider, stale-session banner (10min), `overflow-x-hidden`, 16px inputs

**Key files:** `application-history.ts`, `share-link.ts`, `ats-education.ts`, `share-view.tsx`, `session-stale-banner.tsx`

**Still open:** Manual device QA (12 items); Supabase auth (Phase 3)

### 2026-07-01 — Phase 2f P2: review mode, library sheet, desktop split-pane

- [x] **Review mode** — `?mode=review` + `ReviewPanel` suggestion queue (accept/dismiss per bullet)
- [x] **Mobile More sub-nav** — Style | Library | Review | Letter under Customize tab
- [x] **Content library sheet** — bottom sheet on mobile (opens from Library tab)
- [x] **Customize full** — Text + Layout sub-tabs (spacing + margin sliders)
- [x] **Desktop split-pane** — `DesktopWorkspaceShell` with mode tabs + sticky live preview at `lg:`
- [x] **Checks → Review CTA** on mobile when JD analyzed

**Key files:** `review-panel.tsx`, `content-library-sheet.tsx`, `mobile-more-nav.tsx`, `desktop-workspace-shell.tsx`, `customize-panel.tsx`, `workspace-mode.ts`, `tailoring-workspace.tsx`

**Still open:** Manual device QA (iOS/Android PDF, Safari export); Supabase auth (deferred)

### 2026-07-01 — Status audit, lint clean, docs sync

- [x] Audited `plan.md` vs codebase — **Phase 2e Done**, **Phase 2f P0+P1 Done** in code
- [x] ESLint 0 errors — `handleResumeStarter` rename, preview sheet effect fix, unused imports
- [x] Verified `/app/new` — Templates | Import | From library + `?tab=library`
- [x] Synced `plan.md` + `progress.md` phase tables and checklists

**Still open at time of audit:**
- [ ] Mobile QA — 12 manual device tests (checklist below)
- [x] 2f P2 — Review mode, library in More sheet, desktop split-pane (done in follow-up session)
- [ ] 2f P3 — IndexedDB, export backup nudge, optional PWA
- [ ] Phase 3 — Auth, application history, share links

### 2026-07-01 — Phase 2f P1: mobile core parity

- [x] Preview bottom sheet (lazy `TemplatePreview`) — eye icon in mobile header
- [x] Version switcher dropdown in workspace header
- [x] Auto-save indicator ("Saved" / relative time)
- [x] Save tailored copy → new version + **Tailored** tab on dashboard
- [x] Landing mobile pass (full-width CTAs, tighter spacing)
- [x] Deployed to https://resutail.vercel.app

**Key files:** `preview-bottom-sheet.tsx`, `version-header-switcher.tsx`, `save-label.ts`, `resume-versions.ts` (`tailoredFor`)

### 2026-07-01 — Phase 2e: master profile + multi-select insert

- [x] **Master profile** — `MasterProfile` type + localStorage (`master-profile.ts`)
- [x] Contact fields: name, email, phone, location, LinkedIn, portfolio
- [x] Extract from resume / apply to resume / prepend on library create
- [x] `MasterProfilePanel` in content library (workspace + create flow)
- [x] **Multi-select insert** — batch add blocks from library in workspace

**Key files:**
- `src/lib/master-profile.ts`, `src/lib/types.ts`
- `src/components/master-profile-panel.tsx`
- `src/components/content-library-panel.tsx` — select multiple + batch insert
- `src/lib/structured-resume.ts` — `addBlocksToSections`

### 2026-07-01 — Phase 2e complete + 2f P1 parity + lint fixes

- [x] **2e** Master profile model — `master-profile.ts`, `MasterProfilePanel`, apply/extract
- [x] **2e** Multi-select batch insert in workspace library (`onAddBlocksToResume`)
- [x] **2e** Workflow B re-wired — `/app/new` Templates | Import | From library tabs + `?tab=library`
- [x] **2f P1** Preview bottom sheet, save tailored copy + dashboard Tailored tab
- [x] **2f P1** Customize mode (template + accent), version header switcher, auto-save label
- [x] **2f P1** JD paste-from-clipboard on mobile Tailor mode
- [x] Fixed ESLint — renamed `handleResumeStarter`, preview sheet mount pattern

**Key files:**
- `src/lib/master-profile.ts`, `src/components/master-profile-panel.tsx`
- `src/components/create-resume-page.tsx` — 3-tab create flow
- `src/components/preview-bottom-sheet.tsx`, `version-header-switcher.tsx`
- `src/components/versions-dashboard.tsx` — All / Tailored tabs

**Next:** Manual mobile QA (12 items); Phase 2f P2 (review mode, desktop split-pane)

### 2026-07-01 — Phase 2e: Workflow B (build from library)

- [x] **2e.1** `buildResumeTextFromBlocks()` — assemble plain resume from selected blocks
- [x] `/app/new` — "From library" tab with multi-select, preview, optional name
- [x] Deep link `/app/new?tab=library`
- [x] Empty library state with guidance

**Key files:**
- `src/lib/content-library.ts` — `buildResumeTextFromBlocks`
- `src/components/create-from-library.tsx` — multi-select create flow
- `src/components/create-resume-page.tsx` — import vs library tabs

### 2026-07-01 — Phase 2e: drag-from-library, template preview, student ordering

- [x] **2e.1** Drag library blocks onto resume sections (desktop) — section header or bullet row drop targets
- [x] **2e.2** Live template preview in `TemplatePicker` with typography from selected template
- [x] **2e.2** Student template exports Education before Experience (`orderSectionsForTemplate`)
- [x] PDF/DOCX export + dashboard export respect student section ordering

**Key files:**
- `src/lib/library-drag.ts` — drag payload MIME type
- `src/lib/structured-resume.ts` — `orderSectionsForTemplate`, `insertSectionItemAt`, `resumeTextForExport`
- `src/components/template-preview.tsx` — live preview component
- `src/components/resume-editor-panel.tsx` — library drop zones
- `src/components/content-library-panel.tsx` — draggable blocks (`enableDrag`)

**Parallel note:** Track G (2f mobile) unchanged — drag is desktop-only per mobile strategy.

### 2026-07-01 — Phase 2e: block metadata editor (parallel track)

- [x] **2e.1** Block metadata editor — function, seniority, domain, tags on library blocks
- [x] Filter library by function + seniority
- [x] Metadata badges on block cards (view mode)

**Key files:**
- `src/lib/content-library.ts` — filter by function/seniority, display labels
- `src/components/content-library-panel.tsx` — inline metadata editor UI

**Parallel note:** Track G (2f mobile shell) continues separately — no overlap.

### 2026-07-01 — Phase 2f: mobile-first IA (P0 foundation)

- [x] Added Phase 2f to `plan.md` — P0/P1/P2/P3 tasks + mobile QA checklist
- [x] Strategy docs in `brief/Reference/` (IA, screen-map, mobile-first-strategy)
- [x] `use-media-query`, `use-workspace-mode`, `workspace-mode` types
- [x] `MobileWorkspaceShell` — bottom nav, header, safe-area, export, clipboard paste
- [x] `VersionsDashboard` — `/app` single-column cards (Open, Tailor, Export, Copy)
- [x] `/app/new` — create/import flow → `/app/v/[id]`
- [x] `/app/v/[id]` — workspace with `?mode=edit|tailor|checks|more`
- [x] Mobile single-pane modes (no 4-panel vertical stack below 1024px)
- [x] Desktop keeps multi-panel grid at `lg+`
- [x] Paste-from-clipboard on Tailor mode
- [x] Touch targets `min-h-11` on primary mobile actions
- [ ] Mobile QA checklist (12 items) — manual device pass pending

**Key files:**
- `src/hooks/use-media-query.ts`, `src/hooks/use-workspace-mode.ts`
- `src/lib/workspace-mode.ts`
- `src/components/mobile-workspace-shell.tsx`, `versions-dashboard.tsx`, `create-resume-page.tsx`
- `src/app/app/page.tsx`, `src/app/app/new/page.tsx`, `src/app/app/v/[id]/page.tsx`
- `src/components/tailoring-workspace.tsx` — mode router refactor

**Next:** Manual mobile QA checklist; P1 preview sheet, tailored copy tab, header version dropdown

### 2026-07-01 — Batch 4: cover letter, DOCX export, analytics, deploy

- [x] **2c** `POST /api/cover-letter` — resume + JD + tone preset (Concise / Friendly / Direct)
- [x] **2c** `POST /api/humanize` — natural-language pass on cover letter text
- [x] **2c** `CoverLetterPanel` — draft, humanize, copy, export DOCX; wired in workspace
- [x] **2d** `docx` npm — `exportResumeDocx` + header Export DOCX button
- [x] **2d** `@vercel/analytics` in root layout
- [x] **Deploy** — production live at https://resutail.vercel.app (Vercel project `resutail`)

**Key files:**
- `src/app/api/cover-letter/route.ts`, `src/app/api/humanize/route.ts`
- `src/lib/cover-letter-tones.ts`, `src/lib/docx-export.ts`
- `src/components/cover-letter-panel.tsx`

**Post-deploy:** Add `GOOGLE_GENERATIVE_AI_API_KEY` in [Vercel project env vars](https://vercel.com/huabichnhu03-oss-projects/resutail/settings/environment-variables) for AI routes on production.

### 2026-07-01 — Batch 2 verified + Batch 3 integration smoke test

- [x] **Batch 2 (C1+C2+C3):** All UI panels verified in browser at `/app`
  - Checks panel — 5-dimension score, ATS plain-text preview, dimension notes
  - Version picker — duplicate/rename/switch (wired in workspace shell)
  - Resume editor — structured inline edit + bullet reorder (up/down + drag)
  - JD insights — seed JD loads, coverage stats render after analyze
- [x] **Batch 3 (D):** Workspace integration confirmed
  - `TailoringWorkspace` orchestrates library + resume + JD + checks + templates
  - `/app` returns 200 (after `.next` cache reset — stale dev server was 500)
- [x] Fixed session hydration on load — run checks + bootstrap version when seed resume present
- [x] ESLint clean (`npm run lint` passes)

**Tested at:** http://localhost:3000/app with Lenna Hua seed profile

### 2026-07-01 — Batch 2: landing, reorder, base diff, deploy prep

- [x] **E1** Landing copy — workspace positioning, how-it-works steps, checker-first privacy
- [x] **E3** Bullet reorder — drag-and-drop + up/down buttons in structured editor
- [x] **E4** Base vs tailored diff — `BaseDiffPanel` + per-item strikethrough for edits
- [x] **E2** Deploy prep — `.env.example` Vercel notes, `.vercelignore`
- [ ] **E2** Vercel deploy — blocked locally: `EPERM` on `H:\ResuTail\.next` (drive permissions)

**Key files:**
- `src/app/page.tsx`, `src/components/site-header.tsx`
- `src/lib/text-diff.ts`, `src/components/base-diff-panel.tsx`
- `src/lib/structured-resume.ts` — `moveSectionItem`, `reorderSectionItem`
- `src/components/resume-editor-panel.tsx` — drag reorder + inline change hints

**Deploy workaround:** Push to GitHub and import in [Vercel Dashboard](https://vercel.com/new), or run `npx vercel` from a path without `.next` permission issues. Set `GOOGLE_GENERATIVE_AI_API_KEY` in project env vars.

### 2026-07-01 — Phase 2e: v2 content library + template families (foundation)

- [x] Read `brief/resume-tailoring-brief-v2.docx` — modular library + template system direction
- [x] Updated `plan.md` with Phase 2e scope and agent coordination (avoid overlap with 2c/2d/deploy)
- [x] Added `ContentBlock` types + localStorage storage (`src/lib/content-library.ts`)
- [x] Import resume sections → library (deduped), search/filter/star
- [x] Rule-based JD block recommendations (no AI)
- [x] Built `ContentLibraryPanel` — import, suggest, add-to-resume
- [x] Added 6 template families (`src/lib/resume-templates.ts`)
- [x] Built `TemplatePicker` + template-aware PDF export
- [x] Wired 4-surface workspace: Library | Resume | JD | Checks
- [x] Added `addSectionItem` helper for library → resume insertion

**Key files:**
- `src/lib/content-library.ts`, `src/lib/resume-templates.ts`
- `src/components/content-library-panel.tsx`, `src/components/template-picker.tsx`
- `src/lib/types.ts` — `ContentBlock`, `ResumeTemplate` types
- `src/components/tailoring-workspace.tsx` — library + template integration

**Next (2e):** Block metadata editor, drag library→resume, Workflow B (build from library only)
**Other agents:** Cover letter (2c), DOCX export (2d), Vercel deploy — do not duplicate

### 2026-07-01 — Phase 2b: workspace pivot complete

- [x] Landing copy updated for workspace positioning (`src/app/page.tsx`)
- [x] Bullet reorder (drag + up/down) in `resume-editor-panel.tsx`
- [x] Base vs tailored diff panel (`base-diff-panel.tsx`, `text-diff.ts`)
- [x] Phase 2b foundation (match score, versions, structured editor, 3-panel UI)

**Key files:** `src/app/page.tsx`, `src/components/base-diff-panel.tsx`, `src/lib/text-diff.ts`

### 2026-07-01 — Phase 2b: workspace pivot (plan + foundation)

- [x] Rewrote `plan.md` for checker-first workspace direction per follow-up brief
- [x] Added transparent 5-dimension match score (`src/lib/match-score.ts`)
- [x] Added multi-version storage (`src/lib/resume-versions.ts`)
- [x] Added structured resume parser (`src/lib/structured-resume.ts`)
- [x] Added ATS plain-text preview util (`src/lib/ats-text-preview.ts`)
- [x] Built 3-panel workspace UI (`tailoring-workspace.tsx`)
- [x] Built checks panel, JD insights panel, resume editor panel, version picker
- [x] Wired `/app` to `TailoringWorkspace` (replaces linear wizard)
- [x] Extended `types.ts` with `MatchScore`, `ResumeVersion`, `StructuredResume`

**Key files:**
- `plan.md` — updated phases, parallel workstreams, scoring model
- `src/lib/match-score.ts`, `src/lib/resume-versions.ts`, `src/lib/structured-resume.ts`
- `src/components/tailoring-workspace.tsx`, `checks-panel.tsx`, `jd-insights-panel.tsx`, `resume-editor-panel.tsx`, `version-picker.tsx`

**Next:** Landing copy update, bullet reorder, cover letter (2c), DOCX export, Vercel deploy

### 2026-06-30 — Phase 2 start: file upload + AI model fix

- [x] Diagnosed AI failures: `gemini-2.0-flash` hit free-tier quota (limit: 0 on user's key)
- [x] Switched default model to `gemini-2.5-flash-lite` via `src/lib/ai-model.ts`
- [x] Added `GOOGLE_GENERATIVE_AI_MODEL` env override in `.env.example`
- [x] Improved API error messages for quota/rate-limit (429) in `src/lib/api-errors.ts`
- [x] Verified `POST /api/extract-jd` returns 200 with new model (~1s)
- [x] Fixed `tailorBullet` resume text sync bug (`buildResumeFromBullets(nextBullets)`)
- [x] Phase 2 file upload: `mammoth` (DOCX) + `pdfjs-dist` (PDF), client-side only
- [x] Added `ResumeFileUpload` component on resume step in app wizard
- [x] Added `src/lib/file-extract.ts` — parses .txt, .docx, .pdf in browser
- [x] Initialized git repo (`git init`) for upcoming Vercel deploy
- [x] Updated landing page privacy copy for local file parsing

**Key files:**
- `src/lib/ai-model.ts`, `src/lib/api-errors.ts`, `src/lib/file-extract.ts`
- `src/components/resume-file-upload.tsx`
- `src/app/api/extract-jd/route.ts`, `src/app/api/tailor-bullet/route.ts`

**Next:** Vercel deploy, cover letter generator, DOCX export

### 2026-06-30 — Local dev setup & PowerShell fix

- [x] User created `.env.local` from `.env.example` (`cp .env.example .env.local`)
- [x] `GOOGLE_GENERATIVE_AI_API_KEY` configured in `.env.local` (Next.js loads it — see dev server output)
- [x] Hit PowerShell execution policy error on `npm run dev` (`npm.ps1` blocked)
- [x] Workaround: use `npm.cmd run dev` instead of `npm run dev` in PowerShell
- [x] Dev server started successfully — Next.js 16.2.9 (Turbopack) on http://localhost:3000
- [x] Verified routes respond: `GET /` 200, `GET /app` 200

**Notes for Windows:**
- `npm run dev` fails in PowerShell when execution policy blocks scripts
- Alternatives: `npm.cmd run dev`, use **cmd**, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 2026-06-30 — Phase 0 + Phase 1 MVP scaffold

- [x] Next.js 16 App Router + TypeScript + Tailwind CSS v4
- [x] shadcn/ui components (button, card, textarea, badge, progress, tabs, alert, separator, label)
- [x] Landing page (`/`) with features + privacy section
- [x] App wizard (`/app`): resume paste → JD paste → tailor → export
- [x] `localStorage` session persistence + clear data
- [x] Resume bullet parser (section headings + bullet detection)
- [x] JD extraction API: `POST /api/extract-jd` (Gemini 2.0 Flash)
- [x] Bullet tailoring API: `POST /api/tailor-bullet` (Gemini 2.0 Flash)
- [x] Rule-based JD coverage summary
- [x] Rule-based ATS check (structure, keywords, content)
- [x] PDF export via jspdf (single-column, Helvetica)
- [x] IP rate limit (~20 AI calls/day) with graceful error messages
- [x] `.env.example` for `GOOGLE_GENERATIVE_AI_API_KEY`
- [x] Production build passes (`npm run build`)
- [x] Branding: **ResuTail** (resolved)

**Key files:**
- `src/app/page.tsx` — landing
- `src/app/app/page.tsx` — app shell
- `src/components/app-wizard.tsx` — main wizard UI
- `src/app/api/extract-jd/route.ts`, `src/app/api/tailor-bullet/route.ts`
- `src/lib/` — storage, parser, coverage, ATS, PDF, rate limit

**Follow-up:** Add API key to `.env.local`, deploy to Vercel

### 2026-06-30 — Planning

- [x] Read and reviewed product & design brief (`.docx`)
- [x] Created phased build plan with free-tier-only third parties
- [x] Created `plan.md` (full implementation plan)
- [x] Created `progress.md` (this file)

---

## In progress

- **Mobile QA:** 12 manual device tests (checklist in plan.md)
- **Phase 3:** Supabase auth (deferred until validated)

---

### 2026-07-01 — Phase 2f P3: IndexedDB, backup nudge, PWA

- [x] **IndexedDB dual-write** — `browser-store.ts` mirrors all persisted keys; recovers localStorage from IDB on init
- [x] **Storage init** — `StorageInit` on app load + `resutail-storage-ready` event for dashboard refresh
- [x] **Export backup nudge** — banner on `/app/*` when data exists and no export in 7+ days; snooze 3 days
- [x] **Export tracking** — `markLastExport()` on PDF/DOCX export
- [x] **PWA manifest** — `app/manifest.ts`, viewport + `appleWebApp` metadata

**Key files:** `browser-store.ts`, `backup-nudge.ts`, `backup-nudge-banner.tsx`, `storage-init.tsx`, `app/manifest.ts`, `app/app/layout.tsx`

**Still open:** Mobile QA (12 items); Phase 3 auth/sync


---

## Blockers & decisions

| Date | Item | Status | Resolution |
|------|------|--------|------------|
| 2026-06-30 | Branding: ResuTail vs TailorStack | Resolved | Using **ResuTail** in UI and package name |
| 2026-06-30 | Google AI Studio API key | Resolved | Added in `.env.local` |
| 2026-06-30 | PowerShell `npm run dev` blocked | Resolved | Use `npm.cmd run dev` or change execution policy |
| 2026-06-30 | Gemini 2.0 Flash quota exhausted | Resolved | Default model → `gemini-2.5-flash-lite` |
| 2026-07-01 | Vercel deploy | Resolved | Live at https://resutail.vercel.app — add `GOOGLE_GENERATIVE_AI_API_KEY` in Vercel env for production AI |
| 2026-07-07 | Auth provider: Clerk vs Supabase | Resolved | Chose **Supabase** — bundles Auth + Postgres in one free-tier service for the requested cloud sync (Clerk would need a second DB vendor) |
| 2026-07-07 | Supabase project setup | **Open** | User must create a Supabase project, set `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and run `supabase/schema.sql` before sign-in/sync work end-to-end |

---

## Environment & setup notes

| Item | Value |
|------|-------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Set in `.env.local` |
| `GOOGLE_GENERATIVE_AI_MODEL` | Optional; defaults to `gemini-2.5-flash-lite` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Not yet set** — create a free Supabase project, add keys, run `supabase/schema.sql` |
| Vercel project | `resutail` — https://resutail.vercel.app |
| Node / stack | Next.js 16.2.9, React 19, Tailwind 4 |
| Dev server (PowerShell) | `npm.cmd run dev` → http://localhost:3000 |
| Dev server (cmd) | `npm run dev` → http://localhost:3000 |
| App route | http://localhost:3000/app |
| Network (LAN) | http://10.5.0.2:3000 (when dev server running) |

---

## Quick checklist (sync with plan.md)

### Phase 0
- [x] Next.js + Tailwind + shadcn scaffold
- [x] Vercel deploy (+ set production env vars for AI)
- [x] Landing + privacy statement

### Phase 1
- [x] Resume/JD paste UI + localStorage
- [x] `/api/extract-jd` (Gemini)
- [x] Coverage summary (rules)
- [x] `/api/tailor-bullet` + diff UI
- [x] ATS check panel (rules only)
- [x] PDF export (single-column template)
- [x] Rate limit + graceful degradation

### Phase 2b (workspace)
- [x] Match score engine (5 dimensions)
- [x] Version storage + picker
- [x] Structured resume parser + inline editor
- [x] 3-panel workspace UI
- [x] Checks panel with transparent scoring
- [x] ATS plain-text preview
- [x] Wire `/app` to workspace
- [x] Landing copy update
- [x] Bullet reorder / base vs. tailored diff

### Phase 2e (v2 library + templates)
- [x] Content library storage + types
- [x] Import resume → library
- [x] Library panel + add-to-resume
- [x] JD-suggested blocks (rules)
- [x] Template families + picker
- [x] Template-aware PDF export
- [x] Block metadata editor
- [x] Drag library → resume
- [x] Build-from-library workflow (Workflow B)
- [x] Master profile model
- [x] Multi-select insert

### Phase 2c
- [x] Cover letter + tone + humanize

### Phase 2d
- [x] DOCX export
- [x] Analytics

### Phase 2f (mobile-first IA)
- [x] Mobile app shell (bottom nav, header, safe-area)
- [x] Dashboard `/app` — version cards
- [x] Workspace mode router (`edit` | `tailor` | `checks` | `more`)
- [x] Edit / Tailor / Checks single-pane on mobile
- [x] Remove 4-panel stack on mobile
- [x] `/app/new` create/import
- [x] Export from workspace header
- [x] Touch targets ≥44px (`min-h-11`)
- [x] JD paste-from-clipboard (Tailor mode)

#### Phase 2f P1 (done)
- [x] Preview bottom sheet
- [x] Save tailored copy + dashboard Tailored tab
- [x] Customize lite (template + color)
- [x] Header version dropdown
- [x] Auto-save indicator
- [x] Landing mobile pass (responsive layout)

#### Mobile QA checklist
- [x] 320px — no horizontal scroll (browser @ 320×568)
- [ ] Import PDF (iOS + Android)
- [ ] Paste JD from job apps
- [ ] Analyze JD offline (after load)
- [x] Edit bullet → live score update (`applyResumeText` + `runChecks`)
- [ ] PDF export iOS Safari
- [x] Tab background 10 min — stale-session banner (code); data retention needs device
- [ ] Clear site data — graceful empty
- [x] Portrait / landscape stable (resize smoke test)
- [x] Keyboard doesn't hide fields — `KeyboardInsetProvider` + scroll-margin (code)
- [x] Long resume scroll OK (browser smoke test)
- [x] AI rewrite loading + errors (loading state + alert on API failure)

#### Phase 2f P3 (done)
- [x] IndexedDB migration (dual-write + recovery)
- [x] Export backup nudge
- [x] Optional PWA manifest

#### Phase 2f P2 (done)
- [x] Review mode (suggestion queue)
- [x] Content library in More sheet
- [x] Customize full (text/layout sub-tabs)
- [x] Cover letter under More
- [x] Desktop split-pane at `lg:`

### Phase 3
- [x] Supabase auth (optional for sync — guest workspace allowed)
- [x] Application history
- [x] Share links + ATS tooltips
