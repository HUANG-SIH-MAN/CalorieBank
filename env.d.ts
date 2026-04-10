declare module "@env" {
  // Google Drive sync (used in googleDriveService)
  export const GOOGLE_IOS_CLIENT_ID: string;
  export const GOOGLE_ANDROID_CLIENT_ID: string;
  export const GOOGLE_WEB_CLIENT_ID: string;
  // Feature: 僅 'true' 時開啟雲端備份／還原；未設定時預設關閉
  export const ENABLE_GOOGLE_DRIVE_SYNC: string | undefined;
}
