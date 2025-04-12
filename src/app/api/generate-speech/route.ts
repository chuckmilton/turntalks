import { NextResponse } from 'next/server';

// This endpoint generates spoken audio from text using OpenAI's TTS.
// You can adjust the model, voice, and instructions as needed.
export async function POST(req: Request) {
  const { text, voice = 'nova', instructions = 'Tone: The voice should be refined, formal, and delightfully theatrical, reminiscent of a charming radio announcer from the early 20th century. Pacing: The speech should flow smoothly at a steady cadence, neither rushed nor sluggish, allowing for clarity and a touch of grandeur. Pronunciation: Words should be enunciated crisply and elegantly, with an emphasis on vintage expressions and a slight flourish on key phrases. Emotion: The delivery should feel warm, enthusiastic, and welcoming, as if addressing a distinguished audience with utmost politeness. Inflection: Gentle rises and falls in pitch should be used to maintain engagement, adding a playful yet dignified flair to each sentence. Word Choice: The script should incorporate vintage expressions like splendid, marvelous, posthaste, and ta-ta for now, avoiding modern slang.' } = await req.json();

  // Call OpenAI's audio speech endpoint.
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",  // adjust to your model
      voice,
      input: text,
      instructions,
      response_format: "mp3"
    })
  });

  const arrayBuffer = await response.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}
