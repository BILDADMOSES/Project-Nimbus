import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export interface TranslationRequest {
    text: string;
    source_language: string;
}

export interface TranslationResponse {
    translated_text: string; 
}

const TRANSLATION_API_URL = 'https://aboge-demo.hf.space/translate'; 

export async function POST(request: NextRequest) {
  
    try {
        const requestBody = await request.json();
        const res = await axios.post(TRANSLATION_API_URL, requestBody, {
          headers: {
              'Content-Type': 'application/json',
          },
      });
        if (!res) {
            throw new Error(`Error: ${res}`);
        }
        const data = await res.data;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ "Error": error }, { status: 500 });
    }
}
