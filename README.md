# ResuTail

Fast resume tailoring workspace — **checker-first, editor-first, AI-second**.

Import a resume, paste a job description, see explainable match gaps, edit in place, optionally rewrite with AI, export ATS-safe PDF/DOCX.

## Product principles

- Useful with **zero AI calls** (offline JD analyze + client-side scoring)
- Guest mode works without an account (local IndexedDB)
- Sign-in is **optional** and only for cross-device sync
- AI only on explicit user actions

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Primary AI (JD refine, rewrite, cover letter) |
| `GROQ_API_KEY` | Optional | Fallback / sole AI provider |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Auth + cloud sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Auth + cloud sync |

Without AI keys, Analyze still works via heuristics. Without Supabase, the app stays fully local.

If using Supabase, run `supabase/schema.sql` once in the SQL editor.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Roadmap snapshot

See `plan.md` (phased build) and `progress.md` (what shipped).

**Current focus (P0):** guest access, honest privacy, restored AI routes, offline Analyze.

**Next (P1):** Chrome JD capture extension + application board.
