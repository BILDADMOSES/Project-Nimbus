import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const APP_ID = process.env.STT_APP_ID;
const APP_KEY = process.env.STT_APP_KEY;
const BASE_URL = process.env.STT_URL;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('Received request to /api/service');
  
  const endpoint = req.nextUrl.searchParams.get('endpoint');
  console.log('Endpoint:', endpoint);

  if (!endpoint || (endpoint !== 'stt' && endpoint !== 'tts' && endpoint !== 'translate')) {
    console.log('Invalid endpoint');
    return NextResponse.json({ message: 'Invalid endpoint' }, { status: 400 });
  }

  const url = `${BASE_URL}/${endpoint}`;
  console.log('Target URL:', url);

  try {
    let data;
    let headers: Record<string, string> = {
      'X-App-ID': APP_ID!,
      'X-App-Key': APP_KEY!,
    };

    if (endpoint === 'translate') {
      // For translation, JSON handling
      const json = await req.json();
      data = json;
      headers['Content-Type'] = 'application/json';
    } else if (endpoint === 'stt') {
      // For STT, raw audio data
      data = await req.arrayBuffer();
      headers['Content-Type'] = 'audio/wav';
      console.log('Received file size:', data.byteLength);
    } else if (endpoint === 'tts') {
      // For TTS, JSON handling
      const json = await req.json();
      data = json;
      headers['Content-Type'] = 'application/json';
    }

    console.log('Sending request to STT/TTS service');
    const response = await axios.post(url, data, {
      headers: headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000, // 30 seconds timeout
      responseType: endpoint === 'tts' ? 'arraybuffer' : 'json',
    });

    console.log('Received response from STT/TTS service');

    if (endpoint === 'tts') {
      console.log('TTS Response Status:', response.status);
      console.log('TTS Response Headers:', response.headers);
      
      console.log('TTS Response Content-Type:', response.headers['content-type']);
      
      let audioData;
      if (Buffer.isBuffer(response.data)) {
        // If response.data is a Buffer, convert to a string
        audioData = response.data.toString('utf-8');
      } else if (typeof response.data === 'string') {
        audioData = response.data;
      } else if (typeof response.data === 'object' && response.data.audio) {
        audioData = response.data.audio;
      } else {
        throw new Error('Unexpected response format from TTS service');
      }
    
      // Try parse the audio data as JSON
      try {
        const parsedData = JSON.parse(audioData);
        if (parsedData && parsedData.audio) {
          audioData = parsedData.audio;
        }
      } catch (e) {
        // If parsing fails, assume audioData is in correct format
      }
    
      console.log('First 50 characters of audio data:', audioData.slice(0, 50));
      
      return new NextResponse(
        JSON.stringify({ audio: audioData }),
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-ID, X-App-Key',
          }
        }
      );
    } else {
      return new NextResponse(
        JSON.stringify(response.data),
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-ID, X-App-Key',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Proxy error:', error.message);
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;

    if (error.response) {
      console.error('Error response:', error.response.data);
      errorMessage = error.response.data.message || `Error from ${endpoint.toUpperCase()} service`;
      statusCode = error.response.status;
    } else if (error.request) {
      console.error('No response received:', error.request);
      errorMessage = `No response received from ${endpoint.toUpperCase()} service`;
    } else {
      console.error('Error setting up request:', error.message);
      errorMessage = `Error setting up request to ${endpoint.toUpperCase()} service`;
    }

    return new NextResponse(
      JSON.stringify({ message: errorMessage }),
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-ID, X-App-Key',
        }
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-ID, X-App-Key',
    },
  });
}