import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Suggestion {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  category: "Declutter" | "Organize" | "Style";
}

export interface AnalysisResult {
  overview: string;
  suggestions: Suggestion[];
  colorPalette: string[];
}

export async function analyzeRoom(base64Image: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this photo of a room and provide professional decluttering and organization suggestions.
    Be specific, practical, and encouraging.
    
    Return the analysis in the following JSON format:
    {
      "overview": "A brief summary of the room's current state and potential.",
      "suggestions": [
        {
          "title": "Short title of the suggestion",
          "description": "Detailed explanation of what to do and why.",
          "priority": "High/Medium/Low",
          "category": "Declutter/Organize/Style"
        }
      ],
      "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"]
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING },
                category: { type: Type.STRING },
              },
              required: ["title", "description", "priority", "category"],
            },
          },
          colorPalette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["overview", "suggestions", "colorPalette"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to analyze the image. Please try again.");
  }
}
