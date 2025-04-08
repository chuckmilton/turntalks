// /src/app/api/transcription/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: Request): Promise<{ fields: Fields; files: Files }> {
  // Read the request body into a buffer
  const buffer = await req.arrayBuffer();
  // Create a Node Readable stream from the buffer
  const readable = new Readable();
  readable._read = () => {}; // no-op
  readable.push(Buffer.from(buffer));
  readable.push(null);

  // Attach headers from the Request (converted into a plain object)
  // This is needed by formidable to properly parse the content-type, etc.
  (readable as any).headers = Object.fromEntries(req.headers.entries());

  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    // Cast the stream to IncomingMessage (for formidable compatibility)
    form.parse(readable as unknown as IncomingMessage, (err: any, fields: Fields, files: Files) => {
      if (err) {
        return reject(err);
      }
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

    // In case audioFile is an array (which should not occur since multiples: false),
    // select the first element. Then cast to any to access the .filepath property.
    const fileData = Array.isArray(audioFile) ? audioFile[0] : audioFile;
    const filePath = (fileData as any).filepath;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'gpt-4o-transcribe',
      response_format: 'json',
    });

    // Access transcription text based on the response shape from the API client.
    // (Assuming transcriptionResponse.text holds the response text.)
    return NextResponse.json({ transcription: transcriptionResponse.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
