import { GoogleGenAI, Type } from "@google/genai";

export type OptimizationDirection = "Simple" | "Rich";

export interface Suggestion {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  category: "Declutter" | "Organize" | "Style";
}

export interface OptimizationPlan {
  title: string;
  direction: OptimizationDirection;
  summary: string;
  actions: string[];
}

export interface AnalysisResult {
  overview: string;
  suggestions: Suggestion[];
  optimizationPlans: OptimizationPlan[];
  colorPalette: string[];
}

export async function analyzeRoom(
  base64Image: string,
  direction: OptimizationDirection,
): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Please configure it in your environment before analyzing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const styleGuide =
    direction === "Simple"
      ? "The user prefers SIMPLE results: emphasize quick wins, lower budget, and easy maintenance."
      : "The user prefers RICH results: emphasize layered styling, detail improvements, and refined atmosphere.";

  const prompt = `
    Analyze this photo of a room and provide professional decluttering and organization suggestions.
    Be specific, practical, and encouraging.

    ${styleGuide}

    You must provide TWO optimization plans in optimizationPlans:
    1) One plan for "Simple" direction.
    2) One plan for "Rich" direction.

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
      "optimizationPlans": [
        {
          "title": "Plan name",
          "direction": "Simple or Rich",
          "summary": "What this plan aims to achieve",
          "actions": ["step 1", "step 2", "step 3"]
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
          optimizationPlans: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                direction: { type: Type.STRING },
                summary: { type: Type.STRING },
                actions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["title", "direction", "summary", "actions"],
            },
          },
          colorPalette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["overview", "suggestions", "optimizationPlans", "colorPalette"],
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
