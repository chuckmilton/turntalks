// /src/app/api/generate-question/route.ts
import { NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/openaiClient';

export async function POST(req: Request) {
  try {
    const { prompt, context, fileInput } = await req.json();
    const question = await generateQuestion(prompt, context, fileInput);
    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error in API generate-question:", error);
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 });
  }
}
