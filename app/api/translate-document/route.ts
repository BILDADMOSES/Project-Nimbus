import { NextRequest, NextResponse } from 'next/server';
import { TranslationServiceClient } from '@google-cloud/translate';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebaseClient';

const credentialsString = process.env.NEXT_PUBLIC_DOC_TRANS_CREDENTIALS || '';
let credentials;
try {
  const cleanedCredentialsString = credentialsString.replace(/^\{|\}$/g, '').replace(/'/g, '"');
  credentials = JSON.parse(`{${cleanedCredentialsString}}`);
} catch (error) {
  console.error('Error parsing credentials:', error);
  credentials = {};
}

const projectId = credentials.project_id;

async function translateDocument(fileBlob: Blob, mimeType: string, targetLanguage: string): Promise<Blob> {
  const client = new TranslationServiceClient({ credentials });

  const documentContent = await fileBlob.arrayBuffer();

  const request = {
    parent: `projects/${projectId}/locations/global`,
    documentInputConfig: {
      content: new Uint8Array(documentContent),
      mimeType: mimeType,
    },
    targetLanguageCode: targetLanguage,
  };

  const [response] = await client.translateDocument(request);

  const translatedContent = response.documentTranslation?.byteStreamOutputs?.[0];
  if (!translatedContent) {
    throw new Error('Translated content is null or undefined');
  }

  return new Blob([translatedContent], { type: mimeType });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const targetLanguage = formData.get('targetLanguage') as string;
  const chatId = formData.get('chatId') as string;

  if (!file || !targetLanguage || !chatId) {
    return NextResponse.json({ error: 'Missing file, target language, or chat ID' }, { status: 400 });
  }

  try {
    // Upload original file to Firebase Storage
    const originalFileRef = ref(storage, `chats/${chatId}/original_${file.name}`);
    await uploadBytes(originalFileRef, file);
    const originalFileUrl = await getDownloadURL(originalFileRef);

    // Translate the document
    const translatedBlob = await translateDocument(file, file.type, targetLanguage);

    // Upload translated file to Firebase Storage
    const translatedFileRef = ref(storage, `chats/${chatId}/translated_${file.name}`);
    await uploadBytes(translatedFileRef, translatedBlob);
    const translatedFileUrl = await getDownloadURL(translatedFileRef);

    return NextResponse.json({
      originalFileUrl,
      translatedFileUrl,
      originalFileName: file.name,
      translatedFileName: `translated_${file.name}`,
    }, { status: 200 });
  } catch (error: any) {
    console.error(`Error translating document: ${error.message}`);
    return NextResponse.json({ error: 'Error translating document' }, { status: 500 });
  }
}