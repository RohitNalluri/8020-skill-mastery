/*
  Purpose: Suggest a single high-quality resource URL for a given task.
  Body: { skill: string, title: string, description: string }
  Returns: { url?: string }
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { skill, title, description } = await req.json().catch(() => ({}));
    if (!skill || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Resolve API key (BYOK or env)
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Recommend ONE best resource URL for the following skill task. Output ONLY the URL, nothing else.\nSkill: ${skill}\nTask: ${title}\nDetails: ${description || ''}`;
    const resp = await model.generateContent(prompt);
    const text = resp.response.text();

    const urlMatch = text.match(/https?:\/\/\S+/);
    const url = urlMatch ? urlMatch[0].trim().replace(/[)\]]+$/, '') : undefined;

    return NextResponse.json({ url });
  } catch (err) {
    console.error('[POST /api/suggest-resource] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
