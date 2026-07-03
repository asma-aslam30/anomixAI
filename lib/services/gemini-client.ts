import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let model: GenerativeModel | null = null;
let cachedKey: string | undefined = undefined;

function getModel(): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  // Reinitialise if key changed (e.g. env reload in dev)
  if (!model || cachedKey !== apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    cachedKey = apiKey;
  }
  return model;
}

export function isAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  const m = getModel();
  if (!m) return null;

  try {
    const result = await m.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const text = result.response.text();

    // Attempt direct parse
    try {
      return JSON.parse(text) as T;
    } catch {}

    // Fallback: regex extraction
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {}
    }

    console.error("[GeminiClient] Failed to parse response:", text.slice(0, 200));
    return null;
  } catch (err) {
    console.error("[GeminiClient] API error:", err);
    return null;
  }
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const m = getModel();
  if (!m) return null;

  try {
    const result = await m.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    });
    return result.response.text();
  } catch (err) {
    console.error("[GeminiClient] Text generation error:", err);
    return null;
  }
}
