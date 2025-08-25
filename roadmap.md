# 8020 Roadmap

Purpose: A concise, evolving plan to deliver a Tim Ferriss–grade experience: ruthless prioritization, minimum effective dose, and deconstruction. Tracks features, status, acceptance criteria, and file impacts.


## Product Principles (Operating System)
- Eliminate to accelerate: fewer screens, fewer clicks, higher throughput.
- MED first: ship the smallest unit that drives behavior change today.
- Produce > consume: favor execution tasks before learning tasks.
- Build feedback loops: reflect, measure, adjust.
- Reliability compounds: plans and resources must be trustworthy.


## Release Plan

### V1 — Daily Engagement Core (build now)
Top 5 features designed to maximize daily usage and mastery.

1) One Thing — Daily Focus View
- Why: Removes overwhelm. Presents the single most important action.
- UX: Dashboard opens to a full-screen card with today’s “One Thing,” a Begin Session button, and an optional tiny link to view plan.
- AC (Acceptance Criteria):
  - Shows the earliest uncompleted produce/execution task (resource === '').
  - If none, shows next best task.
  - “Done” toggle updates `taskCompletionStatus` and progress.
- Files/Changes:
  - Update `src/app/dashboard/page.tsx` to render the One-Thing card by default.
  - Add helper `nextOneThing(plan, completion)` to `src/lib/plan-utils.ts`.
  - Optional new component `src/components/OneThingCard.tsx` (Shadcn + Tailwind).
  - Read plan via existing APIs (`/api/plans/[id]`).
- Status: Planned

2) Deliberate Practice Session Timer
- Why: Quality over quantity; timeboxed deep work with guidance.
- UX: Tapping Begin Session starts a 25–50 min timer with mid-block prompts (e.g., “For the next 5 minutes, isolate the weak link.”).
- AC:
  - Start/pause/complete a session; mid-session prompt appears at T+10 min (configurable).
  - On complete, log duration and link it to `planId` and `taskKey`.
- Files/Changes:
  - New model `Session` in `prisma/schema.prisma` (planId, taskKey, startedAt, endedAt, durationMins, notes optional).
  - New API `src/app/api/sessions/route.ts` (POST create/complete, GET list by plan).
  - New component `src/components/SessionTimer.tsx` with prompts.
  - Wire into Dashboard One-Thing card.
- Status: Planned

3) Feedback Loop — Post-Session Journal
- Why: 30-second reflection to consolidate learning and surface bottlenecks.
- UX: On session completion, show two required fields: “Biggest challenge?” and “One small breakthrough?”
- AC:
  - Persist two fields with the session record.
  - Surface last 3 reflections in plan detail for context.
- Files/Changes:
  - Extend `Session` with `challenge` and `breakthrough` fields in Prisma.
  - Reuse sessions API to persist/read.
  - UI modal after timer ends; small list in `plans/[id]/page.tsx`.
- Status: Planned

4) Momentum Tracker — Streaks + Focused Minutes
- Why: “What gets measured gets managed.” Make progress tangible.
- UX: A simple weekly graph (minutes practiced) and a visible streak counter. No social feed, just personal momentum.
- AC:
  - Compute current streak (daily sessions) and minutes per week from `Session` logs.
  - Small graph in Dashboard; streak badge on One-Thing card.
- Files/Changes:
  - Add `/api/sessions/summary` (server aggregates: streak, weekly totals).
  - UI in `src/app/dashboard/page.tsx` using existing UI primitives.
- Status: Planned

5) Commitment Contract (Day 1)
- Why: Pre-commitment increases follow-through.
- UX: On plan creation (or first open), user types: “I, [name], commit to [X minutes/day] for [N days].” Must confirm before starting Day 1.
- AC:
  - Store commitment text and daily minutes on `Plan`.
  - If not set, block session start with a gentle nudge to commit.
- Files/Changes:
  - Add fields to `Plan` in Prisma: `commitmentText String?`, `dailyMinutes Int?`.
  - UI: a lightweight modal before the first session (Dashboard or `plans/[id]/page.tsx`).
  - Extend `/api/plans/[id]` PATCH to save commitment fields.
- Status: Planned


### V2 — Leverage, Reliability, and Personalization (next)
The rest of the requested features plus platform upgrades.

6) Actionable AI Check-ins (in-app prompts; notifications later)
- Why: Data-driven accountability. 
- Notes: Start with in-app nudge when user returns (no push infra yet). Notification/push as a later phase (PWA/service worker).
- Files: `src/app/dashboard/page.tsx` (prompt UI), new `/api/checkins` to store ratings.
- Status: Backlog

7) Resource Quality Pipeline + Offline Cache (Premium)
- Why: Only the highest-signal content; remove Wi-Fi as a failure point.
- Scope:
  - Tighten `src/app/api/suggest-resource/route.ts`: strict JSON output, URL whitelist, HEAD verification.
  - Optional: Search fallback + re-rank with LLM.
  - Offline cache premium: service worker + Cache API for whitelisted domains.
- Files: `src/lib/url.ts` (validation), `public/sw.js` (if PWA), API enhancements.
- Status: Backlog

8) In-App Focus Mode
- Why: Aggressive elimination of distractions during a session.
- Notes: Web can’t toggle OS DND; provide auto full-screen + instruction to enable OS Focus. Consider mobile/PWA enhancements later.
- Files: `src/components/SessionTimer.tsx` (full-screen), optional PWA guidance.
- Status: Backlog

9) Milestone-Based Social Sharing
- Why: Lightweight accountability via shareable wins (week complete).
- Files: `src/app/api/share-image/route.ts` (generate OG-style image), small UI button on weekly completion.
- Status: Backlog

10) Plan Calibration — Thumbs Up/Down per Task
- Why: Adaptive difficulty over time.
- Files: New model `TaskFeedback` (planId, taskKey, rating enum), UI icons on task rows, `/api/task-feedback`.
- Status: Backlog

11) Adaptive Sprints (7, 14, 30 days) + Intensity (Standard/Accelerated/Immersion)
- Why: Smart defaults with flexibility.
- Files: Onboarding step to capture minutes/day, `src/lib/gemini.ts` prompt to select duration and density, plan schema adjustments.
- Status: Backlog

12) Weekly Reflection Checkpoints
- Why: Systematize elimination/automation and set next lead measure.
- Files: `src/app/api/reflection/route.ts` (LLM summary), UI nudge on days 7/14/21/30; reuse `Note` or `Session` for storage.
- Status: Backlog

13) Identity Cues and Assumption Tests in Plan
- Why: Challenge beliefs; operate as if already world-class.
- Files: `src/lib/gemini.ts` schema to include `assumptionToTest` (per day) and `identityCue` (per week); minor UI surfacing.
- Status: Backlog

14) Plan Reliability Upgrade — JSON mode + Zod Validation
- Why: Eliminate brittle parsing; improve determinism.
- Files: `src/lib/gemini.ts` (JSON response mode, `responseSchema`), `src/lib/schemas.ts` (Zod), re-try logic; `suggest-resource` stricter JSON.
- Status: Backlog (Recommended early)


## Engineering Notes
- Follow Next.js App Router, client/server component boundaries, Tailwind + Shadcn UI.
- Use React Query for data fetching/mutations; React Hook Form + Zod for forms.
- Prisma migrations grouped per release (V1: Sessions + Commitment; V2: Feedback/Calibration/etc.).
- Keep components small and composable; name with PascalCase and prefer named exports.


## Tracking
- Status values: Planned, In Progress, Done, Blocked.
- Update this file per PR with:
  - Feature status change
  - Brief implementation note
  - Any deviations from spec
