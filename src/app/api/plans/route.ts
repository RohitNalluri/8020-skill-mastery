/*
  Purpose: List current user's plans for the Plans grid. Enforces auth via Clerk.
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plans = await prisma.plan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ plans });
  } catch (err) {
    console.error('[GET /api/plans] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
