/*
  Purpose: Get a single plan and update it (status or checklist toggles).
  PATCH body supports two shapes:
    { action: 'status', status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' }
    { action: 'check', key: string, checked: boolean }
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { setTaskResource } from '@/lib/plan-utils';
import type { Prisma } from '@prisma/client';

function countTrue(obj: Record<string, unknown>): number {
  return (Object.values(obj) as unknown[]).reduce<number>((acc, v) => acc + (v === true ? 1 : 0), 0);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = await prisma.plan.findFirst({ where: { id: params.id, userId } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ plan });
  } catch (err) {
    console.error('[GET /api/plans/:id] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = await prisma.plan.findFirst({ where: { id: params.id, userId } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action as 'status' | 'check' | 'resource' | undefined;

    if (action === 'status') {
      const status = body?.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | undefined;
      if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 });
      await prisma.plan.update({ where: { id: plan.id }, data: { status } });
      return NextResponse.json({ ok: true });
    }

    if (action === 'check') {
      const key = (body?.key ?? '').toString();
      const checked = Boolean(body?.checked);
      if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
      const current = (plan.taskCompletionStatus as unknown as Record<string, unknown>) || {};
      const updated = { ...current, [key]: checked };
      const tasksCompleted = countTrue(updated);
      await prisma.plan.update({
        where: { id: plan.id },
        data: { taskCompletionStatus: updated as unknown as Prisma.InputJsonValue, tasksCompleted },
      });
      return NextResponse.json({ ok: true, tasksCompleted });
    }

    if (action === 'resource') {
      const key = (body?.key ?? '').toString();
      const url = (body?.url ?? '').toString();
      if (!key || !url) return NextResponse.json({ error: 'key and url required' }, { status: 400 });
      const nextPlanData = setTaskResource(
        plan.planData as unknown as import('@/lib/gemini').GeneratedPlan,
        key,
        url
      );
      await prisma.plan.update({ where: { id: plan.id }, data: { planData: nextPlanData as unknown as Prisma.InputJsonValue } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/plans/:id] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
