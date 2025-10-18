
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this environment, we assume the key is always present.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export async function getHint(problemDescription: string, userCode: string): Promise<string> {
  if (!API_KEY) {
    return "API Key is not configured. Please set the API_KEY environment variable.";
  }
  try {
    const prompt = `
      You are an expert programming tutor. A student is working on a coding problem and has asked for a hint.
      
      **Problem Description:**
      ${problemDescription}
      
      **Student's Current Code:**
      \`\`\`
      ${userCode}
      \`\`\`
      
      Your task is to provide a concise, helpful hint to guide them towards the solution.
      
      **Rules for the hint:**
      1.  **Do not** provide the full solution or large chunks of code.
      2.  Focus on the next logical step, a key concept they might be missing, or a potential edge case to consider.
      3.  Keep the hint to 1-2 sentences.
      4.  Be encouraging and supportive.
      
      Provide the hint now.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching hint from Gemini API:", error);
    throw new Error("Failed to generate a hint. The AI service may be unavailable.");
  }
}
