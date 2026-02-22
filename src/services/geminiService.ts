import { GoogleGenAI } from "@google/genai";

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Analyze a food photo using the @google/genai SDK.
 * @param base64Image - Base64-encoded image (without data URI prefix)
 * @param mimeType   - e.g. 'image/jpeg'
 * @param apiKey     - User's Gemini API key (required)
 * @param modelName  - Gemini model name (required, e.g. 'gemini-1.5-flash')
 * @param hints      - Optional keywords the user provides
 */
export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string,
  apiKey: string,
  modelName: string,
  hints: string = ''
): Promise<FoodAnalysisResult> {
  const rawKey = (apiKey || '').trim();
  const finalApiKey = rawKey.replace(/[^\x20-\x7E]/g, ''); 

  if (!finalApiKey) {
    throw new Error('未偵測到 API Key。');
  }

  const ai = new GoogleGenAI({
    apiKey: finalApiKey,
  });

  const hintLine = hints.trim()
    ? `\n用戶提供的補充資訊：${hints.trim()}。`
    : '';

  const prompt = `你是一位專業且直覺敏銳的營養師。請分析這張食物照片並完成以下任務：
1. 辨識照片中的主要食物與配菜。
2. 即使照片不完全清晰或你不確定，也請根據常見菜色的平均值給出「最可能的估算」。
3. 嚴禁回傳 0 kcal 或 未知食物（除非圖片完全與食物無關）。
4. 以一人份為估算基準。${hintLine}

請嚴格以 JSON 格式回傳（數字部分請給整數）：
{
  "name": "食物名稱（例如：紅燒獅子頭、番茄牛肉麵）",
  "calories": 大卡,
  "protein": 蛋白質克數,
  "carbs": 碳水化合物克數,
  "fat": 脂肪克數
}
只回傳 JSON。`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        // @ts-ignore
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "";
    if (!text) throw new Error("AI 未能產生內容");

    let parsed: any;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('AI 回傳格式不正確');
    }

    return {
      name: parsed.name || '未知食物',
      calories: Math.round(parsed.calories || 0),
      protein: Math.round(parsed.protein || 0),
      carbs: Math.round(parsed.carbs || 0),
      fat: Math.round(parsed.fat || 0),
    };
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    
    const errorString = error?.message || '';
    
    if (errorString.includes('503') || errorString.includes('high demand') || errorString.includes('UNAVAILABLE')) {
      throw new Error('AI 目前使用人數過多（已達上限），請稍後再試。');
    }
    
    if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('已達到 API 呼叫頻率限制，請稍候重試。');
    }

    if (errorString.includes('API_KEY_INVALID') || errorString.includes('403') || errorString.includes('not found')) {
      throw new Error('API Key 無效或型號名稱錯誤，請至設定檢查。');
    }

    const errorMsg = error?.message || 'AI 辨識失敗，請檢查網路或 API Key';
    throw new Error(errorMsg);
  }
}

/**
 * Quickly validate an API key and model.
 */
export async function validateGeminiKey(apiKey: string, modelName: string): Promise<void> {
  const rawKey = (apiKey || '').trim();
  const finalApiKey = rawKey.replace(/[^\x20-\x7E]/g, '');

  if (!finalApiKey) throw new Error('API Key 不能為空');

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: "Hi" }] }],
    });
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('not found')) throw new Error('找不到該型號名稱，請確認輸入是否正確。');
    throw new Error(msg || 'API Key 無效');
  }
}
