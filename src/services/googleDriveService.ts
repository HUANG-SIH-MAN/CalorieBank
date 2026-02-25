import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Google Drive Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata', // Storage for app data only
  'https://www.googleapis.com/auth/drive.file',    // Access files created/opened by this app
];

// IDs from .env (should be injected via your build system/Constants)
// Note: In development, make sure these are correctly set in your environment
const CLIENT_ID = Platform.select({
  ios: process.env.GOOGLE_IOS_CLIENT_ID,
  android: process.env.GOOGLE_ANDROID_CLIENT_ID,
  default: process.env.GOOGLE_WEB_CLIENT_ID,
});

const REDIRECT_URI = AuthSession.makeRedirectUri();

export interface DriveSyncResult {
  success: boolean;
  message: string;
}

/**
 * Handle Google Login and Token management
 */
export const googleLogin = async () => {
  if (!CLIENT_ID || CLIENT_ID.includes('你的')) {
    throw new Error('請先在 .env 中設定正確的 Google Client ID');
  }

  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
  
  const authRequest = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
  });

  const result = await authRequest.promptAsync(discovery);

  if (result.type === 'success') {
    return result.authentication?.accessToken;
  } else {
    throw new Error('Google 登入失敗');
  }
};

/**
 * Upload the SQLite database file to Google Drive (AppData folder)
 */
export const backupToDrive = async (accessToken: string): Promise<DriveSyncResult> => {
  try {
    const dbUri = `${FileSystem.documentDirectory}SQLite/caloriebank.db`;
    const info = await FileSystem.getInfoAsync(dbUri);
    
    if (!info.exists) {
      return { success: false, message: '找不到本地資料庫檔案' };
    }

    const fileContent = await FileSystem.readAsStringAsync(dbUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 1. Search for existing backup in AppData folder
    const searchResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="caloriebank_bak.db"',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const searchData = await searchResponse.json();
    const existingFile = searchData.files && searchData.files[0];

    // 2. Upload (Update if exists, Create if not)
    const metadata = {
      name: 'caloriebank_bak.db',
      parents: ['appDataFolder'],
    };

    const boundary = 'foo_bar_baz';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) + `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n` +
      fileContent + `\r\n` +
      `--${boundary}--`;

    const url = existingFile 
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
    const method = existingFile ? 'PATCH' : 'POST';

    const uploadResponse = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (uploadResponse.ok) {
      return { success: true, message: '備份成功！' };
    } else {
      const err = await uploadResponse.json();
      throw new Error(err.error?.message || '上傳失敗');
    }
  } catch (error: any) {
    console.error('Backup Error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Restore the SQLite database file from Google Drive
 */
export const restoreFromDrive = async (accessToken: string): Promise<DriveSyncResult> => {
  try {
    // 1. Find the file
    const searchResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="caloriebank_bak.db"',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const searchData = await searchResponse.json();
    const driveFile = searchData.files && searchData.files[0];

    if (!driveFile) {
      return { success: false, message: '雲端找不到備份檔案' };
    }

    // 2. Download the file
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!downloadResponse.ok) throw new Error('下載備份失敗');

    const blob = await downloadResponse.blob();
    const reader = new FileReader();

    const fileContentBase64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });

    // 3. Save to local SQLite folder (MUST BE CAREFUL: This overrides everything)
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const dbUri = `${dbDir}caloriebank.db`;

    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    
    // Write the file
    await FileSystem.writeAsStringAsync(dbUri, fileContentBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { success: true, message: '還原成功！請重啟 App 以載入資料。' };
  } catch (error: any) {
    console.error('Restore Error:', error);
    return { success: false, message: error.message };
  }
};
