/*
  Purpose: Gemini client helper. Provides a function to generate a 30-day plan JSON
  using BYOK (user setting) if available, else falls back to server env key.
*/
import { GoogleGenerativeAI } from '@google/generative-ai';

export type GeneratedPlan = {
  weeks: Array<{
    title: string;
    days: Array<{
      day: number;
      tasks: Array<{
        title: string;
        description: string;
        resource?: string;
      }>;
    }>;
  }>;
};

export async function generatePlanWithGemini(opts: {
  skill: string;
  apiKey: string;
}): Promise<GeneratedPlan> {
  const { skill, apiKey } = opts;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const system = `You are an expert learning designer. Create a laser-focused 30-day plan
that applies the 80/20 principle and Tim Ferriss' deconstruction method for mastering a single skill.
Return STRICT JSON only. No prose. The JSON schema is:
{
  "weeks": [
    {
      "title": string,
      "days": [
        {
          "day": number, // 1..30
          "tasks": [
            {
              "title": string,
              "description": string,
              "resource": string // REQUIRED http(s) URL for learn/consume tasks. For produce/execution tasks (keywords: deconstruct, write, draft, outline, practice, record), set to an empty string.
            }
          ]
        }
      ]
    }
  ]
}
Rules:
- Ensure exactly 30 days total.
- For learn/consume tasks, always include a reputable resource URL (YouTube, docs, Wikipedia, high-quality blog).
- For produce/execution tasks (deconstruct, write, draft, outline, practice, record), set resource to an empty string.
- Keep tasks actionable and minimal.`;

  const prompt = `${system}\nSkill: ${skill}`;
  const resp = await model.generateContent(prompt);
  const text = resp.response.text();

  // Attempt to extract JSON block if fenced
  const jsonText = extractJson(text);
  const parsed = JSON.parse(jsonText) as GeneratedPlan;
  return parsed;
}

function extractJson(text: string): string {
  const fence = /```json[\s\S]*?```/i;
  const match = text.match(fence);
  if (match) {
    return match[0].replace(/```json|```/g, '').trim();
  }
  // Fallback: assume whole text is JSON
  return text.trim();
}
