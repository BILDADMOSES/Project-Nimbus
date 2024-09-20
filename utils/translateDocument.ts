import { NextRequest, NextResponse } from 'next/server';
import { TranslationServiceClient } from '@google-cloud/translate';
import formidable from 'formidable';
import fs from 'fs/promises';

const credentialsString = process.env.NEXT_PUBLIC_DOC_TRANS_CREDENTIALS || '';
const credentials = JSON.parse(credentialsString);
const projectId = credentials.project_id;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function translateDocument(file: formidable.File, targetLanguage: string): Promise<Buffer> {
  const client = new TranslationServiceClient({ credentials });

  const documentContent = await fs.readFile(file.filepath);

  const request = {
    parent: `projects/${projectId}/locations/global`,
    documentInputConfig: {
      content: documentContent,
      mimeType: file.mimetype,
    },
    targetLanguageCode: targetLanguage,
  };

  const [response] = await client.translateDocument(request);

  const translatedContent = response.documentTranslation?.byteStreamOutputs?.[0];
  if (!translatedContent) {
    throw new Error('Translated content is null or undefined');
  }

  return Buffer.from(translatedContent);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const targetLanguage = formData.get('targetLanguage') as string;

  if (!file || !targetLanguage) {
    return NextResponse.json({ error: 'Missing file or target language' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempFilePath = `/tmp/${file.name}`;
    await fs.writeFile(tempFilePath, buffer);

    const tempFile: formidable.File = {
      filepath: tempFilePath,
      originalFilename: file.name,
      newFilename: file.name,
      mimetype: file.type,
      size: buffer.length,
      hash: '',
      lastModifiedDate: new Date(),
      _writeStream: null as any,
      toJSON: () => ({}),
    };

    const translatedBuffer = await translateDocument(tempFile, targetLanguage);

    // Clean up the temporary file
    await fs.unlink(tempFilePath);

    return new NextResponse(translatedBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="translated_${file.name}"`,
      },
    });
  } catch (error: any) {
    console.error(`Error translating document: ${error.message}`);
    return NextResponse.json({ error: 'Error translating document' }, { status: 500 });
  }
}