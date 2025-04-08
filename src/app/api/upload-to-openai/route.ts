// /app/api/upload-to-openai/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
// Import File from the correct submodule for Node.
import { File } from 'fetch-blob/file.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    // Parse multipart form data.
    const form = await request.formData();
    const fileEntry = form.get("file");
    if (!fileEntry || !(fileEntry instanceof Blob)) {
      return NextResponse.json(
        { error: 'File is required and must be a Blob.' },
        { status: 400 }
      );
    }

    // Read additional fields.
    // We cast purpose to FilePurpose when calling OpenAI to satisfy the type.
    const purpose = form.get("purpose")?.toString() || 'assistants';
    const fileSizeStr = form.get("file_size")?.toString() || '0';
    const file_size = parseInt(fileSizeStr, 10);
    const maxBytes = 50 * 1024 * 1024;
    if (file_size > maxBytes) {
      return NextResponse.json(
        { error: 'File size exceeds the allowed limit of 50 MB.' },
        { status: 413 }
      );
    }

    // Derive filename from the uploaded file if possible.
    let filename = (fileEntry instanceof File && fileEntry.name)
      ? fileEntry.name
      : `file_${Date.now()}.pdf`;

    // Ensure we have a proper File. If fileEntry is already a File, use it; otherwise, create one.
    const fileObj = fileEntry instanceof File 
      ? fileEntry
      : new File([fileEntry], filename, { type: 'application/pdf' });

    // Upload the file to OpenAI’s Files API.
    // Notice the cast on purpose to match the expected type.
    const fileResponse = await openai.files.create({
      file: fileObj,
      purpose: (purpose as OpenAI.Files.FilePurpose),
    });

    return NextResponse.json({ file_id: fileResponse.id });
  } catch (error: any) {
    console.error('Error in /api/upload-to-openai:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
