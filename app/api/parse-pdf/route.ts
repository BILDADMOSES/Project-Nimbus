"use server"

import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/parse-pdf');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF and count pages
    const data = await pdfParse(buffer);
    const pageCount = data.numpages;

    console.log('PDF parsed successfully. Page count:', pageCount);

    return NextResponse.json({ message: 'File processed successfully', fileName: file.name, pageCount });
  } catch (error) {
    console.error('Error in /api/parse-pdf:', error);
    return NextResponse.json({ error: 'Error processing PDF' }, { status: 500 });
  }
}