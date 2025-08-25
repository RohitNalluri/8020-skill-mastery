# 8020 UX Brief — V1 Core Flows

Purpose: Lock the smallest set of flows and UI states that drive daily engagement. Scope covers One Thing view, Session Timer with mid-prompt, Post-session Journal, Momentum widgets, and Commitment gating. Built for Next.js App Router, Tailwind, Shadcn, React Query.


## Product Goals (V1)
- Make the first 30 seconds brainless: show one action and a single CTA.
- Optimize for produce/execution tasks before consumption.
- Capture high-signal feedback with near-zero friction.
- Visualize momentum without clutter.

## Status (Aug 25, 2025)
### Completed
- One Thing logic: `nextOneThing()` helper implemented in `src/lib/plan-utils.ts` (prioritizes produce tasks).
- OneThingCard UI: `src/components/OneThingCard.tsx` with Begin (stub) + Mark Done; badges for Produce/Learn; empty-state CTA; a11y polish.
- Dashboard integration: `src/app/dashboard/page.tsx` fetches plans, picks ACTIVE, computes One Thing, and toggles Done via `/api/plans/[id]` (check action). Trailing-URL bug fixed.
- Lint/typecheck: all current issues resolved.

### Pending / In Progress
- Session Timer (full-screen) with start/pause/finish and mid-prompt; auto-open Journal on finish.
- Journal modal: required 2 fields; persist on finish; show last 3 reflections on plan detail.
- Sessions model + API: `Session` table and `/api/sessions` endpoints (start/finish/summary).
- Momentum summary endpoint + compact widget on dashboard.
- Commitment gating: modal if commitment not set on plan.


## Prerequisites / First-run
If no ACTIVE plan exists:
- Prompt user to create a plan: enter skill, confirm default 30-day sprint (or suggested sprint), and set daily minutes commitment.
- After plan creation, the Dashboard opens to the One Thing card.
- If multiple plans exist, default to the most recently updated ACTIVE plan. User can switch via Plans.

## Primary User Flow
1) Launch app → Dashboard shows One Thing card (no list, no noise).
2) Tap Begin Session → full-screen session timer starts.
3) Mid-session prompt at T+10m nudges a targeted focus.
4) Finish session → Post-session Journal (2 short fields) → Save.
5) Dashboard updates momentum (minutes, streak) and next One Thing.


## Information Architecture (V1)
- Dashboard (`src/app/dashboard/page.tsx`)
  - One Thing Card (primary)
  - Momentum mini-widgets (secondary)
  - Tiny link to "View Plan" for context (tertiary)
- Plan Detail (`src/app/plans/[id]/page.tsx`)
  - Existing plan view (unchanged in V1) + recent reflections list


## Components (new)
- OneThingCard (`src/components/OneThingCard.tsx`)
  - Props: { plan, completion, onBegin, onDone }
  - Shows: title, optional description, small tag if it’s a produce task, Begin button, Done toggle.
- SessionTimer (`src/components/SessionTimer.tsx`)
  - Props: { planId, taskKey, durationMins=25, midPromptAt=10, onEnd }
  - States: idle → running → paused → finished; mid-session prompt surface.
- JournalModal (`src/components/JournalModal.tsx`)
  - Props: { open, onClose, onSubmit }
  - Fields: challenge (required), breakthrough (required)
- MomentumWidget (`src/components/MomentumWidget.tsx`)
  - Props: { streak, weeklyMinutes[] }
  - Compact bar/line for week; badge for streak
- CommitmentModal (`src/components/CommitmentModal.tsx`)
  - Props: { open, onConfirm }
  - Fields: commitmentText, dailyMinutes; blocks first session until set


## API/Model (minimal V1)
- Sessions API: `src/app/api/sessions/route.ts`
  - POST /sessions/start { planId, taskKey, startedAt }
  - POST /sessions/finish { sessionId, endedAt, durationMins, challenge, breakthrough }
  - GET  /sessions/summary?planId=... → { streak, weeklyMinutes: [7] }
- Prisma (V1 migration): add `Session` and optional fields on `Plan`
  - Session { id, userId, planId, taskKey, startedAt, endedAt, durationMins, challenge, breakthrough, createdAt }
  - Plan { commitmentText?, dailyMinutes? }


## Copy (micro)
- One Thing title: "Your One Thing"
- Begin CTA: "Begin Session"
- Mid-prompt: "Next 5 minutes: isolate the weak link."
- Journal labels: "Biggest challenge" / "One small breakthrough"
- Momentum: "This week" and "Streak"
- Commitment: "I, {name}, commit to {X} minutes/day for {N} days."


## Acceptance Criteria
- One Thing
  - Uses helper to choose earliest uncompleted produce task first; otherwise next best.
  - Done toggle updates `/api/plans/[id]` action=check immediately (optimistic update).
- Session Timer
  - Full-screen mode; handles start/pause/finish; mid-prompt at configured minute.
  - On finish, opens JournalModal automatically.
- Journal
  - Requires both fields; saves with session finish; shows last 3 reflections on plan detail.
- Momentum
  - Summary endpoint returns streak + minutes for last 7 days; dashboard renders compactly.
- Commitment
  - If not set on the plan, CommitmentModal blocks Begin Session; persists via `/api/plans/[id]` PATCH.


## Wireframe (low-fi)

Dashboard

+-------------------------------------------------------+
| Your One Thing                                        |
|  [Task Title]                                         |
|  [Short description if any]                           |
|                                                       |
|  [ Begin Session ]   [ Mark Done ]                    |
|                                                       |
|  (view plan)                                          |
+-------------------------------------------------------+

Below the fold (secondary):
[ Streak: 5 days ]   [ This week: |███░░░░| 65m ]

Session (full screen)
+-------------------------------------------------------+
|  25:00  (running)                                     |
|  [ Pause ]   [ Finish ]                               |
|                                                       |
|  At 10:00 → prompt bubble:                            |
|  "Next 5 minutes: isolate the weak link."            |
+-------------------------------------------------------+

Journal (modal)
+------------------------------+
| Biggest challenge  [input]   |
| Small breakthrough [input]   |
| [ Save ]                     |
+------------------------------+


## Accessibility & Responsiveness
- Keyboard operable buttons, visible focus, proper ARIA for dialogs.
- Mobile-first layout; One Thing is readable and tappable on small screens.
- Timer controls large enough for thumb usage; avoid accidental taps.


## Error States
- Sessions API failures: retry toasts + graceful resume for timer.
- No ACTIVE plan: trigger first-run flow to create/select a plan (skill, sprint, daily minutes).
- Journal save fail: keep modal open; retry option.


## Open Questions
- Where to choose active plan if multiple exist? (V1: pick most recent ACTIVE.)
- Default timer length: 25 or respect `dailyMinutes`? (V1: 25; later personalize.)
- Allow skipping journal? (V1: required; V2: allow skip with nudge.)


## Build Order (V1)
1) `nextOneThing()` helper (pure logic)
2) OneThingCard and dashboard integration
3) Sessions model + API scaffold
4) SessionTimer with mid-prompt
5) JournalModal + finish flow
6) Momentum summary endpoint + widget
7) CommitmentModal gating
