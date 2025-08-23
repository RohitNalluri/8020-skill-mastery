/*
  Purpose: Generate a new plan using Gemini and store it in SQLite via Prisma.
  Enforces max 3 ACTIVE plans per user. Returns the created plan id.
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { generatePlanWithGemini } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const skill = (body?.skill ?? '').trim();
    if (!skill) return NextResponse.json({ error: 'Skill is required' }, { status: 400 });

    const activeCount = await prisma.plan.count({ where: { userId, status: 'ACTIVE' } });
    if (activeCount >= 3) {
      return NextResponse.json({ error: 'You can have at most 3 active plans' }, { status: 400 });
    }

    // Determine API key (BYOK if available, else server env)
    const userSetting = await prisma.userSetting.findUnique({ where: { userId } });
    let apiKey: string | undefined;
    if (userSetting?.geminiApiKeyEncrypted) {
      const secret = process.env.ENCRYPTION_SECRET;
      if (!secret) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
      apiKey = decrypt(userSetting.geminiApiKeyEncrypted, secret);
    } else {
      apiKey = process.env.GEMINI_API_KEY;
    }
    if (!apiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });

    const planData = await generatePlanWithGemini({ skill, apiKey });

    const created = await prisma.plan.create({
      data: {
        userId,
        skillToMaster: skill,
        planData: planData as unknown as any,
        taskCompletionStatus: {},
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/generate-plan] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
