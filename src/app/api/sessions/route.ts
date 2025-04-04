// /src/app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt, end_goal, num_questions, pdf_url } = body;
  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        prompt,
        end_goal,
        num_questions,
        pdf_url,
        participants: [],
        time_limit: 0,
        answers: [],
        status: 'created',
      },
    ])
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data[0] });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const body = await req.json();
  const { data, error } = await supabase
    .from('sessions')
    .update(body)
    .eq('id', sessionId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
