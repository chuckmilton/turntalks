// /src/app/api/generate-summary/route.ts
import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/openaiClient';

export async function POST(req: Request) {
  try {
    const { sessionData, fileInput } = await req.json();
    const summary = await generateSummary(sessionData, fileInput);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error in API generate-summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
