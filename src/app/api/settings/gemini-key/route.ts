/*
  Purpose: Manage BYOK Gemini API key per user. Stores encrypted key in UserSetting.
  Methods:
    - GET: returns { hasKey: boolean }
    - POST: body { apiKey: string } -> encrypts and upserts
    - DELETE: removes stored key
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const setting = await prisma.userSetting.findUnique({ where: { userId } });
    return NextResponse.json({ hasKey: Boolean(setting?.geminiApiKeyEncrypted) });
  } catch (err) {
    console.error('[GET /api/settings/gemini-key] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const apiKey = (body?.apiKey ?? '').toString().trim();
    if (!apiKey) return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });

    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

    const enc = encrypt(apiKey, secret);
    await prisma.userSetting.upsert({
      where: { userId },
      update: { geminiApiKeyEncrypted: enc },
      create: { userId, geminiApiKeyEncrypted: enc },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/settings/gemini-key] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.userSetting.update({
      where: { userId },
      data: { geminiApiKeyEncrypted: null },
    }).catch(async () => {
      // If row does not exist, create it with null
      await prisma.userSetting.create({ data: { userId, geminiApiKeyEncrypted: null } });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/settings/gemini-key] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
