import { MIN_FOOD_TEXT_DESCRIPTION_LENGTH } from "../constants/foodText";
import { FoodAnalysisResult } from "./geminiService";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const NUTRITION_DECIMAL_FACTOR = 10;

function roundMacrosFromParsed(parsed: {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  name?: string;
}): FoodAnalysisResult {
  const roundToOneDecimal = (n: number) =>
    Math.round((n || 0) * NUTRITION_DECIMAL_FACTOR) / NUTRITION_DECIMAL_FACTOR;
  return {
    name: parsed.name || "未知食物",
    calories: Math.round(parsed.calories || 0),
    protein: roundToOneDecimal(parsed.protein ?? 0),
    carbs: roundToOneDecimal(parsed.carbs ?? 0),
    fat: roundToOneDecimal(parsed.fat ?? 0),
  };
}

function parseFoodAnalysisJson(text: string): FoodAnalysisResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return roundMacrosFromParsed({
    name: parsed.name as string | undefined,
    calories: parsed.calories as number | undefined,
    protein: parsed.protein as number | undefined,
    carbs: parsed.carbs as number | undefined,
    fat: parsed.fat as number | undefined,
  });
}

function mapGroqError(error: unknown): Error {
  const msg = (error as { message?: string })?.message || "";
  if (msg.includes("rate_limit") || msg.includes("429")) {
    return new Error("備用 AI（Groq）也已達到速率限制，請稍後再試。");
  }
  if (msg.includes("401") || msg.includes("invalid_api_key")) {
    return new Error("備用 AI Key 無效，請至設定重新輸入 Groq API Key。");
  }
  return new Error(`備用 AI 分析失敗：${msg || "請稍後再試"}`);
}

async function callGroq(
  messages: object[],
  apiKey: string,
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  return (data as any).choices?.[0]?.message?.content || "";
}

const IMAGE_PROMPT = `你是一位專業的營養師。請分析這張食物照片並估算熱量與營養素。
1. 辨識照片中的主要食物與配菜。
2. 以「合理、略偏保守」的方式估算，避免高估。若無法從照片判斷份量，請以一般常見份量為準。
3. 嚴禁回傳 0 kcal。
4. 以一人份為基準估算。主餐約 400–650 kcal；小菜以小份量估算。

請嚴格只回傳 JSON，格式如下（不要加任何說明）：
{"name":"食物名稱","calories":整數,"protein":小數,"carbs":小數,"fat":小數}`;

const TEXT_PROMPT = `你是一位專業的營養師。請依「文字描述」估算一餐的熱量與營養素。
1. 綜合描述中的主餐、配菜、份量、烹調方式等線索。
2. 以「合理、略偏保守」的方式估算，避免高估。若份量未寫明，以一般常見一人份為準。
3. 嚴禁回傳 0 kcal。
4. 主餐約 400–650 kcal；小菜以小份量估算。

請嚴格只回傳 JSON，格式如下（不要加任何說明）：
{"name":"食物名稱","calories":整數,"protein":小數,"carbs":小數,"fat":小數}`;

/**
 * Analyze a food photo using Groq Vision API (fallback).
 */
export async function analyzeGroqFoodImage(
  base64Image: string,
  mimeType: string,
  apiKey: string,
  hints: string = "",
): Promise<FoodAnalysisResult> {
  if (!apiKey?.trim()) throw new Error("未偵測到備用 AI Key。");

  const hintText = hints.trim() ? `\n用戶補充說明：${hints.trim()}` : "";
  const userPrompt = IMAGE_PROMPT + hintText;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Image}` },
        },
        { type: "text", text: userPrompt },
      ],
    },
  ];

  try {
    const text = await callGroq(messages, apiKey.trim());
    if (!text) throw new Error("AI 未能產生內容");
    try {
      return parseFoodAnalysisJson(text);
    } catch {
      throw new Error("AI 回傳格式不正確");
    }
  } catch (error: unknown) {
    console.error("Groq Image Analysis Error:", error);
    throw mapGroqError(error);
  }
}

/**
 * Analyze food from text description using Groq (fallback).
 */
export async function analyzeGroqFoodText(
  description: string,
  apiKey: string,
): Promise<FoodAnalysisResult> {
  const trimmed = description.trim();
  if (trimmed.length < MIN_FOOD_TEXT_DESCRIPTION_LENGTH) {
    throw new Error(
      `描述請至少 ${MIN_FOOD_TEXT_DESCRIPTION_LENGTH} 個字。`,
    );
  }
  if (!apiKey?.trim()) throw new Error("未偵測到備用 AI Key。");

  const messages = [
    {
      role: "user",
      content: `${TEXT_PROMPT}\n\n用戶描述：\n"""${trimmed}"""`,
    },
  ];

  try {
    const text = await callGroq(messages, apiKey.trim());
    if (!text) throw new Error("AI 未能產生內容");
    try {
      return parseFoodAnalysisJson(text);
    } catch {
      throw new Error("AI 回傳格式不正確");
    }
  } catch (error: unknown) {
    console.error("Groq Text Analysis Error:", error);
    throw mapGroqError(error);
  }
}

/**
 * Validate a Groq API key.
 */
export async function validateGroqKey(apiKey: string): Promise<void> {
  if (!apiKey?.trim()) throw new Error("API Key 不能為空");
  const messages = [{ role: "user", content: "Hi" }];
  try {
    await callGroq(messages, apiKey.trim());
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("401") || msg.includes("invalid_api_key")) {
      throw new Error("Groq API Key 無效，請確認是否正確。");
    }
    throw new Error(msg || "Groq API Key 驗證失敗");
  }
}
