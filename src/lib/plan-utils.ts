/*
  Purpose: Helpers for plan JSON structure to compute progress and keys.
*/
import type { GeneratedPlan } from '@/lib/gemini';

export function countTotalTasks(plan: GeneratedPlan): number {
  return plan.weeks.reduce((acc, w) => acc + w.days.reduce((ad, d) => ad + d.tasks.length, 0), 0);
}

export function taskKey(weekIndex: number, dayIndex: number, taskIndex: number): string {
  return `w${weekIndex + 1}_d${dayIndex + 1}_t${taskIndex + 1}`;
}

export function parseTaskKey(key: string): { w: number; d: number; t: number } | null {
  const m = key.match(/^w(\d+)_d(\d+)_t(\d+)$/);
  if (!m) return null;
  const w = parseInt(m[1], 10) - 1;
  const d = parseInt(m[2], 10) - 1;
  const t = parseInt(m[3], 10) - 1;
  if ([w, d, t].some((x) => Number.isNaN(x) || x < 0)) return null;
  return { w, d, t };
}

export function setTaskResource(plan: import('@/lib/gemini').GeneratedPlan, key: string, url: string) {
  const idx = parseTaskKey(key);
  if (!idx) return plan;
  const { w, d, t } = idx;
  // Deep copy shallowly by levels we touch
  const weeks = plan.weeks.map((week, wi) => {
    if (wi !== w) return week;
    return {
      ...week,
      days: week.days.map((day, di) => {
        if (di !== d) return day;
        return {
          ...day,
          tasks: day.tasks.map((task, ti) => (ti === t ? { ...task, resource: url } : task)),
        };
      }),
    };
  });
  return { ...plan, weeks } as typeof plan;
}

/**
 * Purpose: Determine the next "One Thing" task to focus on.
 * Strategy: Iterate week/day/task order and prioritize produce/execution tasks
 * (identified by resource === ''), then pick the first unchecked task.
 * Returns identifiers and metadata for rendering the One Thing card.
 */
export function nextOneThing(
  plan: import('@/lib/gemini').GeneratedPlan,
  completion: Record<string, boolean | unknown>
): { key: string; task: { title: string; description: string; resource?: string }; day: number; weekTitle: string } | null {
  for (let wi = 0; wi < plan.weeks.length; wi += 1) {
    const week = plan.weeks[wi];
    for (let di = 0; di < week.days.length; di += 1) {
      const day = week.days[di];
      // Prefer produce tasks first (resource === ''). Keep original indices for keys.
      const indices = day.tasks
        .map((_, idx) => idx)
        .sort((i, j) => {
          const ai = day.tasks[i];
          const bj = day.tasks[j];
          const ap = (ai.resource ?? '') === '' ? 0 : 1;
          const bp = (bj.resource ?? '') === '' ? 0 : 1;
          return ap - bp;
        });
      for (let k = 0; k < indices.length; k += 1) {
        const ti = indices[k];
        const key = taskKey(wi, di, ti);
        if (!completion[key]) {
          return { key, task: day.tasks[ti], day: day.day, weekTitle: week.title };
        }
      }
    }
  }
  return null;
}
