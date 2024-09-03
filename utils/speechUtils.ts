import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const speechToText = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await axios.post(`${API_BASE_URL}/api/service?endpoint=stt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.text) {
      return response.data.text;
    } else {
      throw new Error('Invalid response format: text data is missing or in unexpected format');
    }
  } catch (error: any) {
    console.error('Error in speech-to-text conversion:', error.message);
    throw error;
  }
};

export const textToSpeech = async (text: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/service?endpoint=tts`, { text });
    
    if (response.data && response.data.audio) {
      return response.data.audio; // base64 encoded audio string
    } else {
      throw new Error('Invalid response format: audio data is missing or in unexpected format');
    }
  } catch (error: any) {
    console.error('Error in text-to-speech conversion:', error.message);
    throw error;
  }
};

export const playAudio = (base64Audio: string): void => {
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  audio.play().catch(e => {
    console.error('Audio playback error:', e.message);
  });
};