/**
 * Feature flags. 未設定時預設為關閉。
 * ENABLE_GOOGLE_DRIVE_SYNC: 僅當 .env 內為 'true' 時開啟雲端備份／還原與 Onboarding 匯入步驟。
 */
import { ENABLE_GOOGLE_DRIVE_SYNC as ENV_GOOGLE_DRIVE } from '@env';

export const ENABLE_GOOGLE_DRIVE_SYNC = ENV_GOOGLE_DRIVE === 'true';
