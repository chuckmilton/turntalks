import { NextResponse } from 'next/server';
// This endpoint generates spoken audio from text using OpenAI's TTS.
// You can adjust the model, voice, and instructions as needed.
export async function POST(req: Request) {
  try {
    const { text, voice = 'alloy', instructions = 'Speak in a calm, but cheerful and positive tone.' } = await req.json();

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
  } catch (error) {
    console.error("Error in generate-speech API:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
