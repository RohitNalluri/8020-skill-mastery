'use client';
/*
  Purpose: Dashboard primary surface. V1 focuses on the One Thing flow:
  fetch user's plans, select ACTIVE (or most recent), compute nextOneThing,
  and render a single action card with a completion toggle. Secondary: quick links.
*/
import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OneThingCard, type OneThing } from '@/components/OneThingCard';
import { nextOneThing } from '@/lib/plan-utils';
import type { GeneratedPlan } from '@/lib/gemini';
import { SessionTimer } from '@/components/SessionTimer';
import { JournalModal } from '@/components/JournalModal';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showTimer, setShowTimer] = React.useState(false);
  const [showJournal, setShowJournal] = React.useState(false);
  const [currentOT, setCurrentOT] = React.useState<OneThing | null>(null);
  const [lastElapsedSec, setLastElapsedSec] = React.useState<number | null>(null);

  type Plan = {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    skillToMaster: string;
    tasksCompleted: number;
    planData: unknown;
    taskCompletionStatus: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<{ plans: Plan[] }> => {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      return res.json();
    },
  });

  const activePlan: Plan | undefined = React.useMemo(() => {
    const plans = plansQuery.data?.plans ?? [];
    const active = plans.find((p) => p.status === 'ACTIVE');
    return active ?? plans[0];
  }, [plansQuery.data]);

  const oneThing: OneThing | null = React.useMemo(() => {
    if (!activePlan) return null;
    const plan = activePlan.planData as GeneratedPlan | undefined;
    const completion = (activePlan.taskCompletionStatus ?? {}) as Record<string, boolean | unknown>;
    if (!plan?.weeks) return null;
    return nextOneThing(plan, completion);
  }, [activePlan]);

  const checkMutation = useMutation({
    mutationFn: async ({ key, checked }: { key: string; checked: boolean }) => {
      if (!activePlan) return;
      const res = await fetch(`/api/plans/${activePlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', key, checked }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/plans">View Skill Paths</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </div>

      <OneThingCard
        oneThing={oneThing}
        isChecking={checkMutation.isPending}
        onBegin={(ot) => {
          setCurrentOT(ot);
          setShowTimer(true);
        }}
        onDone={(ot) => {
          checkMutation.mutate({ key: ot.key, checked: true });
        }}
      />

      <SessionTimer
        open={showTimer}
        onClose={() => setShowTimer(false)}
        durationMins={25}
        midPromptAt={10}
        title={oneThing ? oneThing.task.title : 'Session'}
        onFinish={({ elapsedSec }) => {
          // TODO: integrate sessions finish API; for now, just open journal
          setLastElapsedSec(elapsedSec);
          setShowTimer(false);
          setShowJournal(true);
        }}
      />

      <JournalModal
        open={showJournal}
        onClose={() => setShowJournal(false)}
        onSubmit={async (values) => {
          // Persist structured session with journal fields
          try {
            if (!currentOT || !activePlan) return;
            const res = await fetch('/api/sessions/finish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planId: activePlan.id,
                taskKey: currentOT.key,
                durationSec: lastElapsedSec ?? undefined,
                challenge: values.challenge,
                breakthrough: values.breakthrough,
              }),
            });
            if (!res.ok) {
              const json = await res.json().catch(() => ({}));
              throw new Error(json?.error || 'Failed to save session');
            }
          } catch (e) {
            console.error('Failed to persist session', e);
          }
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Skill Paths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Create or continue your Skill Paths.</p>
            <Button size="sm" asChild>
              <Link href="/plans">Go to Skill Paths</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Manage your Gemini API key (BYOK) and preferences.</p>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Track streaks and insights.</p>
            <Button size="sm" variant="outline" disabled>
              Explore
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
