/*
  Purpose: Start a session for a given plan/task. Optional; finish can also create.
  POST body: { planId: string, taskKey: string, startedAt?: string | number }
  Returns: { id: string }
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const planId = (body?.planId || '').toString();
    const taskKey = (body?.taskKey || '').toString();
    const startedAtRaw = body?.startedAt;
    if (!planId || !taskKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const plan = await prisma.plan.findFirst({ where: { id: planId, userId }, select: { id: true } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date();

    const session = await prisma.session.create({
      data: { userId, planId, taskKey, startedAt },
      select: { id: true },
    });

    return NextResponse.json({ id: session.id });
  } catch (err) {
    console.error('[POST /api/sessions/start] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
