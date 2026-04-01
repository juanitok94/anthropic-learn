# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server on :3000
npm run build    # Production build
npm run start    # Run production server
```

No test runner is configured. Lint is not configured as a separate script — TypeScript type-checking is the primary validation:

```bash
npx tsc --noEmit   # Type check without emitting
```

## Architecture

**anthropic-learn** is a self-populating AI curriculum platform. Users browse a structured 14-module curriculum, click to harvest lessons (Claude generates content from live Anthropic docs), and export the harvested content as JSON seed files that pre-populate the app for future visitors.

### Data Flow

```
User clicks "Harvest Topic"
  → POST /api/claude { type: 'harvest', topic, sourceId }
    → Fetches live doc from docs.anthropic.com (strips HTML, 6000 char limit)
    → Calls Claude API (claude-sonnet-4-20250514, max 800 tokens)
    → Returns markdown lesson
  → Saved to localStorage via useKnowledgeBase hook
  → Rendered in UI via custom renderMd() function

Export → JSON seed file downloaded → committed to src/data/
  → On next visit, hooks load seed data as default (if localStorage empty)
```

### Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/app/api/claude/route.ts` — Single API route handling `harvest`, `analyze`, and `gaps` request types
- `src/components/` — Nav, InfoTooltip
- `src/hooks/` — useProgress, useKnowledgeBase, useTranscriptAnalyses (all localStorage-backed)
- `src/types/index.ts` — All shared TypeScript interfaces
- `src/data/` — JSON source files: curriculum.json, sources.json, transcripts.json, plus seed files

### State Management

All state is client-side localStorage — no backend database. The three hooks bootstrap from seed JSON files (`knowledge-base-seed.json`, `transcripts-seed.json`) if localStorage is empty, then persist changes to localStorage.

localStorage keys:
- `anthropic-learn-progress`
- `anthropic-learn-kb`
- `anthropic-learn-analyses`

### Markdown Rendering

Pages use a custom `renderMd()` regex function (not a library) to render harvested markdown to HTML. Each page that displays harvested content implements its own copy — this is intentional, not a bug.

### Tailwind v4

This project uses Tailwind CSS v4. The import syntax is `@import "tailwindcss"` (not `@tailwind base/components/utilities`). Config is via PostCSS (`postcss.config.mjs`), not a `tailwind.config.*` file.

### Claude API Route

`POST /api/claude` accepts `{ type: 'harvest' | 'analyze' | 'gaps', ... }`. The `gaps` type is implemented but not wired to any UI. Model is `claude-sonnet-4-20250514`.

## Lab Notes Protocol

When you make a mistake or take a wrong approach, automatically append a lab note to this CLAUDE.md under ## Lab Notes without being asked. Format:
`[date] - what failed - why - what to do instead`

## Lab Notes
