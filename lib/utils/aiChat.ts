// geminiAIUtils.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.API_KEY || "";

// GoogleGenerativeAI required config
const configuration = new GoogleGenerativeAI(API_KEY);

// Model initialization
const modelId = 'gemini-pro';
const model = configuration.getGenerativeModel({ model: modelId });

// These arrays are to maintain the history of the conversation
const conversationContext: [string, string][] = [];
const currentMessages: { role: string; parts: string }[] = [];

export async function generateResponse(prompt: string): Promise<string> {
  try {
    // Restore the previous context
    for (const [inputText, responseText] of conversationContext) {
      currentMessages.push({ role: 'user', parts: inputText });
      currentMessages.push({ role: 'model', parts: responseText });
    }

    const chat = model.startChat({
      history: currentMessages,
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Stores the conversation
    conversationContext.push([prompt, responseText]);

    return responseText;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}

export async function practiceLanguage(): Promise<void> {
  console.log('Welcome to Language Practice!');
  console.log("Type 'exit' to end the session.");

  while (true) {
    try {
      const userInput = prompt('You: ');

      if (userInput?.toLowerCase() === 'exit') {
        console.log('Ending the session. Goodbye!');
        break;
      }

      const response = await generateResponse(userInput || '');
      console.log(`AI: ${response}`);
    } catch (error) {
      console.error('Error during interaction:', error);
    }
  }
}