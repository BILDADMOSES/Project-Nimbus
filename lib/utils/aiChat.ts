import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || "";

// if (!API_KEY) {
//   throw new Error("GEMINI_API_KEY is not set in the environment variables.");
// }

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(API_KEY);

// Model configuration
const modelConfig = {
  model: "gemini-pro",  // Changed back to gemini-pro as it seems to be the correct model
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  },
};

let model: GenerativeModel;
let chatSession: ChatSession;

// Error handling
function handleError(error: any): string {
  console.error('Error generating response:', error);
  
  if (error.status === 403) {
    return 'Authentication error. Please check your API key and ensure it has the necessary permissions.';
  } else if (error.message.includes("API Key")) {
    return 'Invalid or missing API key. Please check your API key configuration.';
  } else {
    return 'An unexpected error occurred. Please try again later.';
  }
}

export async function initializeChat(): Promise<void> {
  try {
    model = genAI.getGenerativeModel(modelConfig);
    chatSession = model.startChat({
      generationConfig: modelConfig.generationConfig,
      history: [],
    });
  } catch (error) {
    console.error('Error initializing chat:', error);
    throw new Error('Failed to initialize chat. Please check your configuration and try again.');
  }
}

export async function generateResponse(prompt: string, language: string = 'en'): Promise<string> {
  try {
    if (!chatSession) {
      await initializeChat();
    }

    // Prepare the prompt with language instruction
    const languagePrompt = `Respond in ${language}:\n${prompt}`;

    const result = await chatSession.sendMessage(languagePrompt);
    const responseText = result.response.text();

    return responseText;
  } catch (error: any) {
    return handleError(error);
  }
}

export async function practiceLanguage(): Promise<void> {
  console.log('Welcome to Language Practice!');
  console.log("Type 'exit' to end the session or specify a language (e.g., 'French: Bonjour').");

  try {
    await initializeChat();
  } catch (error) {
    console.error('Failed to start language practice:', error);
    return;
  }

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
      console.log('An error occurred. Please try again or type "exit" to quit.');
    }
  }
}

// Function to verify API key
export async function verifyAPIKey(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    await model.generateContent("Test");
    return true;
  } catch (error: any) {
    console.error('API Key verification failed:', error);
    return false;
  }
}