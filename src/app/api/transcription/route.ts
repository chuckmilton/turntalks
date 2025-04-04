// /src/app/api/transcription/route.ts
import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import formidable from 'formidable';
import fs from 'fs';

export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: Request): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export async function POST(req: Request) {
  try {
    const { files } = await parseForm(req);
    const audioFile = files.audio;
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'gpt-4o-transcribe',
      response_format: 'json',
    });
    return NextResponse.json({ transcription: transcriptionResponse.data.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
