/*
  Purpose: CRUD-lite for task-specific notes tied to a plan.
  Query params:
    - GET: ?planId=...&taskKey=...  -> returns { note?: { id, content } }
  Body:
    - POST: { planId, taskKey, content } -> upsert and return { ok: true }
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const planId = url.searchParams.get('planId') || '';
    const taskKey = url.searchParams.get('taskKey') || '';
    if (!planId || !taskKey) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // Ensure plan belongs to user
    const plan = await prisma.plan.findFirst({ where: { id: planId, userId }, select: { id: true } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const note = await prisma.note.findUnique({ where: { planId_taskKey: { planId, taskKey } }, select: { id: true, content: true } });
    return NextResponse.json({ note: note || null });
  } catch (err) {
    console.error('[GET /api/notes] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const planId = (body?.planId || '').toString();
    const taskKey = (body?.taskKey || '').toString();
    const content = (body?.content || '').toString();
    if (!planId || !taskKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const plan = await prisma.plan.findFirst({ where: { id: planId, userId }, select: { id: true } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.note.upsert({
      where: { planId_taskKey: { planId, taskKey } },
      update: { content },
      create: { userId, planId, taskKey, content },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/notes] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
