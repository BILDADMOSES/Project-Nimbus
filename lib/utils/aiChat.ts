import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.API_KEY || ""; // Ensure API key is set as an environment variable

// Content and Part interfaces for type safety
interface Content {
  role: string;
  parts: Part[];
}

interface Part {
  text: string;
}

// Error handling and informative messages
function handleError(error: Error): string {
  console.error('Error generating response:', error);
  return 'An error occurred. Please try again later.';
}

// GoogleGenerativeAI required config
const configuration = new GoogleGenerativeAI(API_KEY);

// Model initialization
const modelId = 'gemini-pro';
const model = configuration.getGenerativeModel({ model: modelId });

// Conversation history with language tracking
const conversationHistory: { text: string; role: string }[] = [];

export async function generateResponse(prompt: string, language: string = 'en'): Promise<string> {
  try {
    // Restore previous context
    const currentMessages: Content[] = conversationHistory.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.text }],
    }));

    const chat = model.startChat({
      history: currentMessages,
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // Store conversation
    conversationHistory.push({ text: prompt, role: 'user' });
    conversationHistory.push({ text: responseText, role: 'model' });

    return responseText;
  } catch (error: any) {
    return handleError(error);
  }
}

export async function practiceLanguage(): Promise<void> {
  console.log('Welcome to Language Practice!');
  console.log("Type 'exit' to end the session or specify a language (e.g., 'French: Bonjour').");

  while (true) {
    try {
      const userInput = prompt('You: ');

      if (!userInput) {
        console.log('Please enter a prompt or "exit" to quit.');
        continue;
      }

      if (userInput.toLowerCase() === 'exit') {
        console.log('Ending the session. Goodbye!');
        break;
      }

      // Extract language preference (optional)
      const languageMatch = userInput.match(/^([a-zA-Z]+):\s*(.*)$/);
      let promptText = userInput;
      let language = 'en';

      if (languageMatch) {
        language = languageMatch[1];
        promptText = languageMatch[2];
      }

      const response = await generateResponse(promptText, language);
      console.log(`AI: ${response}`);
    } catch (error) {
      console.error('Error during interaction:', error);
    }
  }
}