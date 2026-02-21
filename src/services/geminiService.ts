import { API_KEY as ENV_API_KEY, MODEL_NAME as ENV_MODEL_NAME } from '@env';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Analyze a food photo using Gemini Vision API.
 * @param base64Image - Base64-encoded image (without data URI prefix)
 * @param mimeType   - e.g. 'image/jpeg'
 * @param apiKey     - User's Gemini API key
 * @param hints      - Optional keywords the user provides (e.g. '牛肉麵, 大碗')
 */
export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string,
  apiKey: string,
  hints: string = ''
): Promise<FoodAnalysisResult> {
  const hintLine = hints.trim()
    ? `\n用戶補充說明：${hints.trim()}，請根據此資訊調整估算。`
    : '';

  const prompt = `你是一位專業的營養師，請分析這張食物照片。
請估算圖中所有食物（以一人份為單位）的營養成分。${hintLine}
請以 JSON 格式回傳，格式如下：
{
  "name": "食物名稱（繁體中文）",
  "calories": 數字（大卡，整數）,
  "protein": 數字（克，整數）,
  "carbs": 數字（克，整數）,
  "fat": 數字（克，整數）
}
只回傳 JSON，不要有其他文字或 markdown 格式。`;

  const model = ENV_MODEL_NAME || 'gemini-1.5-flash';
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey || ENV_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip possible markdown code fences
  const cleaned = text.replace(/```json|```/g, '').trim();

  let parsed: FoodAnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI 回傳格式不正確，請重新辨識');
  }

  // Validate required fields
  if (
    typeof parsed.name !== 'string' ||
    typeof parsed.calories !== 'number'
  ) {
    throw new Error('AI 無法辨識此食物，請補充關鍵字後重試');
  }

  return {
    name: parsed.name,
    calories: Math.round(parsed.calories || 0),
    protein: Math.round(parsed.protein || 0),
    carbs: Math.round(parsed.carbs || 0),
    fat: Math.round(parsed.fat || 0),
  };
}

/**
 * Quickly validate an API key by sending a simple text request.
 */
export async function validateGeminiKey(apiKey: string): Promise<void> {
  const model = ENV_MODEL_NAME || 'gemini-1.5-flash';
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey || ENV_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: '回覆 OK' }] }],
      generationConfig: { maxOutputTokens: 5 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message || 'API Key 無效';
    throw new Error(msg);
  }
}
