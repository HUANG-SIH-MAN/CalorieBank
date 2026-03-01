/**
 * Onboarding 雲端匯入步驟與還原／匯入警示文案。
 */

export const CLOUD_IMPORT = {
  /** 雲端匯入步驟標題 */
  title: '要從 Google Drive 匯入先前的資料嗎？',

  /** 雲端匯入步驟說明 */
  description: '若您曾在其他裝置或先前安裝時備份過，可在此從 Google Drive 還原飲食與體重等資料。點「要匯入」將以 Google 帳號登入並讀取雲端備份。',

  /** 按鈕：要匯入 */
  buttonImport: '要匯入',

  /** 按鈕：不匯入 */
  buttonSkip: '不，全新開始',

  /** Web 提示（雲端匯入僅支援原生） */
  webOnlyMessage: '雲端匯入僅支援 iOS / Android 版，網頁版請直接開始設定。',
} as const;

/** 匯入前警示彈窗（Onboarding「要匯入」） */
export const CLOUD_IMPORT_WARNING = {
  title: '匯入前請知悉',
  message:
    '從 Google Drive 匯入將會以雲端備份的資料取代本機資料，目前裝置上的設定與紀錄將無法保留。若您曾在此裝置備份，請先確認是否要覆蓋。確定要繼續嗎？',
  cancel: '取消',
  confirm: '確定',
} as const;

/** 設定頁「還原數據」確認彈窗 */
export const RESTORE_CONFIRM = {
  title: '還原前請知悉',
  message:
    '本機的個人設定、飲食紀錄、體重、飲水與運動紀錄將被雲端備份完全取代，且無法復原。建議先備份目前資料。確定要繼續嗎？',
  cancel: '取消',
  confirm: '確定還原',
} as const;
