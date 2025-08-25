'use client';
/*
  Purpose: Plan detail page. Displays weekly accordion with daily tasks and lets user
  check off items, updating progress. Also supports status changes (Complete/Archive).
*/
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { countTotalTasks, taskKey } from '@/lib/plan-utils';
import type { GeneratedPlan } from '@/lib/gemini';

interface PageProps {
  params: { id: string };
}

type TaskRowProps = {
  planId: string;
  skill: string;
  wi: number;
  di: number;
  ti: number;
  t: GeneratedPlan['weeks'][number]['days'][number]['tasks'][number];
  checked: boolean;
  disabled: boolean;
  onToggle: (key: string, next: boolean) => void;
  onAfterChange: () => void;
};

function TaskRow({ planId, skill, wi, di, ti, t, checked, disabled, onToggle, onAfterChange }: TaskRowProps) {
  const qc = useQueryClient();
  const key = taskKey(wi, di, ti);

  const noteQuery = useQuery({
    queryKey: ['note', planId, key],
    queryFn: async () => {
      const res = await fetch(`/api/notes?planId=${encodeURIComponent(planId)}&taskKey=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('Failed to load note');
      return res.json() as Promise<{ note: { id: string; content: string } | null }>;
    },
  });

  const [content, setContent] = React.useState('');
  React.useEffect(() => {
    setContent(noteQuery.data?.note?.content || '');
  }, [noteQuery.data?.note?.content]);

  const saveNote = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, taskKey: key, content }),
      });
      if (!res.ok) throw new Error('Save failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['note', planId, key] }),
  });

  const suggestResource = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/suggest-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, title: t.title, description: t.description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Suggest failed');
      const url: string | undefined = json?.url;
      if (!url) return null;
      const res2 = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resource', key, url }),
      });
      if (!res2.ok) throw new Error('Update resource failed');
      return url;
    },
    onSuccess: () => onAfterChange(),
  });

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => {
          if (disabled) return;
          onToggle(key, Boolean(v));
        }}
        disabled={disabled}
      />
      <div className="space-y-2 w-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium">{t.title}</div>
            <div className="text-sm text-muted-foreground">{t.description}</div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {t.resource ? (
              <a className="text-sm text-primary underline" href={t.resource} target="_blank" rel="noreferrer">Resource</a>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => suggestResource.mutate()} disabled={suggestResource.isPending}>
                {suggestResource.isPending ? 'Finding…' : 'Suggest resource'}
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea
            className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your deconstruction, outline, or reflections here…"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => saveNote.mutate()} disabled={saveNote.isPending}>
              {saveNote.isPending ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Plan = {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  skillToMaster: string;
  tasksCompleted: number;
  planData: GeneratedPlan;
  taskCompletionStatus: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

export default function PlanDetailPage({ params }: PageProps) {
  const { id } = params;
  const qc = useQueryClient();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['plan', id],
    queryFn: async (): Promise<{ plan: Plan }> => {
      const res = await fetch(`/api/plans/${id}`);
      if (!res.ok) throw new Error('Failed to load plan');
      return res.json();
    },
  });

  const plan = data?.plan;
  const total = plan ? countTotalTasks(plan.planData) : 0;
  const progress = plan ? (total > 0 ? Math.round((plan.tasksCompleted / total) * 100) : 0) : 0;
  const disabled = plan?.status !== 'ACTIVE';

  const toggleMutation = useMutation({
    mutationFn: async ({ key, checked }: { key: string; checked: boolean }) => {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', key, checked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      return json;
    },
    onMutate: async ({ key, checked }) => {
      await qc.cancelQueries({ queryKey: ['plan', id] });
      const prev = qc.getQueryData<{ plan: Plan }>(['plan', id]);
      if (prev?.plan) {
        const next: Plan = {
          ...prev.plan,
          taskCompletionStatus: { ...prev.plan.taskCompletionStatus, [key]: checked },
          tasksCompleted: (prev.plan.tasksCompleted || 0) + (checked ? 1 : -1),
        };
        qc.setQueryData(['plan', id], { plan: next });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['plan', id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['plan', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Status update failed');
      return json;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['plan', id] });
      await qc.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string')
          ? (err as { message: string }).message
          : 'Failed to update status';
      setErrorMsg(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card><CardContent className="p-4">Loading…</CardContent></Card>
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <p>Plan not found.</p>
        <Button onClick={() => router.push('/plans')}>Back to Plans</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{plan.skillToMaster}</h1>
          <p className="text-sm text-muted-foreground">{plan.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push('/plans')}>All Plans</Button>
          {plan.status === 'ACTIVE' ? (
            <Button onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending}>Mark Completed</Button>
          ) : (
            <Button onClick={() => statusMutation.mutate('ACTIVE')} disabled={statusMutation.isPending}>Re-Activate</Button>
          )}
          <Button variant="destructive" onClick={() => statusMutation.mutate('ARCHIVED')} disabled={statusMutation.isPending}>Archive</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Progress: {progress}%</div>
        <Progress value={progress} />
      </div>

      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

      <Accordion type="multiple" className="w-full">
        {plan.planData.weeks.map((week, wi) => (
          <AccordionItem key={`w${wi}`} value={`w${wi}`}>
            <AccordionTrigger>
              <span className="font-medium">{week.title || `Week ${wi + 1}`}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {week.days.map((day, di) => (
                  <Card key={`w${wi}_d${di}`}>
                    <CardHeader>
                      <CardTitle className="text-base">Day {day.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {day.tasks.map((t, ti) => (
                        <TaskRow
                          key={taskKey(wi, di, ti)}
                          planId={plan.id}
                          skill={plan.skillToMaster}
                          wi={wi}
                          di={di}
                          ti={ti}
                          t={t}
                          checked={Boolean(plan.taskCompletionStatus?.[taskKey(wi, di, ti)])}
                          disabled={disabled}
                          onToggle={(key, next) => toggleMutation.mutate({ key, checked: next })}
                          onAfterChange={() => qc.invalidateQueries({ queryKey: ['plan', id] })}
                        />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
