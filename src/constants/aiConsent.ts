/**
 * AI 揭露與同意文案，集中管理以便日後修改與多語系。
 */

export const AI_CONSENT = {
  /** Step 0 標題 */
  step0Title: 'AI 功能說明與使用同意',

  /** Step 0 說明內文（每段一項） */
  step0Body: [
    '本 App 使用 AI（如 Google Gemini）提供食物影像辨識等功能。',
    '辨識結果（食物名稱、熱量、營養素等）由 AI 自動生成，僅供參考，不構成醫療或專業營養建議，請依自身狀況判斷或諮詢專業人員。',
    '您可選擇使用 AI 辨識，或改用手動輸入；未設定 API Key 時不會呼叫 AI。',
  ] as const,

  /** Step 0 按鈕文字 */
  step0ButtonLabel: '我了解，繼續',

  /** Step 4 必選勾選文案 */
  step4CheckboxLabel: '我已了解 AI 生成內容僅供參考並同意使用',

  /** Step 4 查看完整說明按鈕 */
  step4ViewDetailLabel: '查看同意內容',
} as const;
