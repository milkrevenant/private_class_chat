import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, ModelType } from '../types';

const getClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please ask your teacher to configure the API Key in the settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const sendMessageToGemini = async (
  history: Message[],
  currentMessage: string,
  systemInstruction: string,
  apiKey: string,
  model: string = ModelType.GEMINI_PRO
): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    
    // Construct the chat with the provided system instructions
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: currentMessage
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return a user-friendly error string if the key is invalid
    if (error instanceof Error && error.message.includes("API Key")) {
        throw error;
    }
    throw new Error("Failed to communicate with AI service.");
  }
};

export const generateImage = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    
    // Using gemini-2.5-flash-image for generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      }
    });

    // Iterate through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data; // Return base64 string
        }
      }
    }
    
    throw new Error("No image data returned from the model.");
  } catch (error) {
    console.error("Gemini Image API Error:", error);
    throw error;
  }
};