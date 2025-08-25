'use client';
/*
  Purpose: Skill Paths grid page. Shows all user's paths as tiles and allows creating a new path.
  Enforces max 3 ACTIVE paths in UI (disabled New Skill Path when >=3), server also enforces.
*/
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { GeneratedPlan } from '@/lib/gemini';
import { countTotalTasks } from '@/lib/plan-utils';

const createSchema = z.object({ skill: z.string().min(2, 'Enter a skill (min 2 chars)') });

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

export default function PlansPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<{ plans: Plan[] }> => {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed to load plans');
      return res.json();
    },
  });

  const activeCount = (data?.plans || []).filter((p) => p.status === 'ACTIVE').length;
  const canCreate = activeCount < 3;

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { skill: '' },
  });

  const createMutation = useMutation({
    mutationFn: async (skill: string) => {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create plan');
      return json as { id: string };
    },
    onSuccess: async (payload) => {
      await qc.invalidateQueries({ queryKey: ['plans'] });
      router.push(`/plans/${payload.id}`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string')
          ? (err as { message: string }).message
          : 'Failed to create plan';
      setErrorMsg(msg);
    },
  });

  function onSubmit(values: z.infer<typeof createSchema>) {
    setErrorMsg(null);
    if (!canCreate) {
      setErrorMsg('You can have at most 3 active Skill Paths. Complete or archive one to add a new path.');
      return;
    }
    createMutation.mutate(values.skill);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Skill Paths</h1>
          <p className="text-sm text-muted-foreground">Create up to 3 active Skill Paths. Finish one before adding more.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New Skill Path card */}
        <Card className={cn('border-dashed', !canCreate && 'opacity-60 pointer-events-none')}>
          <CardHeader>
            <CardTitle>New Skill Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="skill">Skill</Label>
              <Input id="skill" placeholder="e.g., Public Speaking" {...form.register('skill')} />
            </div>
            {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={!canCreate || createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create Skill Path'}
            </Button>
          </CardFooter>
        </Card>

        {/* Existing Skill Paths */}
        {isLoading && (
          <Card className="col-span-full">
            <CardContent className="p-4">Loading…</CardContent>
          </Card>
        )}
        {(data?.plans || []).map((p) => {
          const total = countTotalTasks(p.planData);
          const progress = total > 0 ? Math.round((p.tasksCompleted / total) * 100) : 0;
          return (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{p.skillToMaster}</span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded border',
                    p.status === 'ACTIVE' && 'border-green-600 text-green-600',
                    p.status === 'COMPLETED' && 'border-blue-600 text-blue-600',
                    p.status === 'ARCHIVED' && 'border-muted-foreground text-muted-foreground'
                  )}>{p.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Progress: {progress}%</div>
                <Progress value={progress} />
              </CardContent>
              <CardFooter className="mt-auto">
                <Button variant="secondary" onClick={() => router.push(`/plans/${p.id}`)}>Open</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
