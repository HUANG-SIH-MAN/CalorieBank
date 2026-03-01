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
  hints: string = "",
): Promise<FoodAnalysisResult> {
  const rawKey = (apiKey || "").trim();
  const finalApiKey = rawKey.replace(/[^\x20-\x7E]/g, "");

  if (!finalApiKey) {
    throw new Error("未偵測到 API Key。");
  }

  const ai = new GoogleGenAI({
    apiKey: finalApiKey,
  });

  const hintLine = hints.trim()
    ? `\n用戶提供的補充資訊：${hints.trim()}。`
    : "";

  const prompt = `
  你是一位專業且直覺敏銳的營養師。請分析這張食物照片並完成以下任務：
    1. 辨識照片中的主要食物與配菜。
    2. 請以「合理、略偏保守」的方式估算熱量與營養素，避免高估。若無法從照片判斷份量，請以一般常見份量為準，不要預設為大份。
    3. 嚴禁回傳 0 kcal 或 未知食物（除非圖片完全與食物無關）。
    4. 以一人份為估算基準，並依食物「類型」調整：
      - **主餐**（如一碗麵、一盤飯、漢堡、便當）：以一份主餐估算。其中「一碗麵」若為一般碗、非特大碗且非明顯高油脂湯頭，請優先落在約 400–650 kcal；僅在照片中明顯為大份量或配料極多時再提高。
      - **小菜、配菜、單點小碟**（如滷味、小菜、單點豆腐/鴨血/豬耳朵等）：請以小份量估算（約半份或單碟份量），不要用「一整份主餐」的熱量。
    5. 若用戶有提供補充說明，請依其內容調整：補充說明中若提到「小菜」「配菜」「小碟」「滷味」等，請以小份量估算；若提到「大碗」「加料」等，則可維持或提高估算。
      
    用戶額外提示：${hintLine}

    請嚴格以 JSON 格式回傳：
    - "calories" 請給整數（大卡）。
    - "protein"、"carbs"、"fat" 可為小數，至小數第一位（例如 12.5）。
    {
      "name": "食物名稱（例如：紅燒獅子頭、番茄牛肉麵）",
      "calories": 大卡_整數,
      "protein": 蛋白質克數,
      "carbs": 碳水化合物克數,  
      "fat": 脂肪克數
    }
    只回傳 JSON。
    `;

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
      },
    });

    const text = response.text || "";
    if (!text) throw new Error("AI 未能產生內容");

    let parsed: any;
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("AI 回傳格式不正確");
    }

    const ONE_DECIMAL_FACTOR = 10;
    const roundToOneDecimal = (n: number) =>
      Math.round((n || 0) * ONE_DECIMAL_FACTOR) / ONE_DECIMAL_FACTOR;
    return {
      name: parsed.name || "未知食物",
      calories: Math.round(parsed.calories || 0),
      protein: roundToOneDecimal(parsed.protein),
      carbs: roundToOneDecimal(parsed.carbs),
      fat: roundToOneDecimal(parsed.fat),
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);

    const errorString = error?.message || "";

    if (
      errorString.includes("503") ||
      errorString.includes("high demand") ||
      errorString.includes("UNAVAILABLE")
    ) {
      throw new Error("AI 目前使用人數過多（已達上限），請稍後再試。");
    }

    if (
      errorString.includes("429") ||
      errorString.includes("RESOURCE_EXHAUSTED")
    ) {
      throw new Error("已達到 API 呼叫頻率限制，請稍候重試。");
    }

    if (
      errorString.includes("API_KEY_INVALID") ||
      errorString.includes("403") ||
      errorString.includes("not found")
    ) {
      throw new Error("API Key 無效或型號名稱錯誤，請至設定檢查。");
    }

    const errorMsg = error?.message || "AI 辨識失敗，請檢查網路或 API Key";
    throw new Error(errorMsg);
  }
}

/**
 * Quickly validate an API key and model.
 */
export async function validateGeminiKey(
  apiKey: string,
  modelName: string,
): Promise<void> {
  const rawKey = (apiKey || "").trim();
  const finalApiKey = rawKey.replace(/[^\x20-\x7E]/g, "");

  if (!finalApiKey) throw new Error("API Key 不能為空");

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  try {
    await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: "Hi" }] }],
    });
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("not found"))
      throw new Error("找不到該型號名稱，請確認輸入是否正確。");
    throw new Error(msg || "API Key 無效");
  }
}

/**
 * List available models for the given API key.
 * Note: Model listing often requires different permissions or might be restricted.
 * We'll attempt to fetch them using the REST API for maximum compatibility.
 */
export async function listAvailableModels(
  apiKey: string,
): Promise<{ id: string; name: string }[]> {
  const rawKey = (apiKey || "").trim();
  const finalApiKey = rawKey.replace(/[^\x20-\x7E]/g, "");

  if (!finalApiKey) throw new Error("API Key 不能為空");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${finalApiKey}`,
    );
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "無法取得模型列表");
    }

    return (data.models || [])
      .filter((m: any) =>
        m.supportedGenerationMethods.includes("generateContent"),
      )
      .map((m: any) => ({
        id: m.name.replace("models/", ""),
        name: m.displayName || m.name,
      }));
  } catch (error: any) {
    console.error("List Models Error:", error);
    throw error;
  }
}
