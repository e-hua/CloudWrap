import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { AppConfig, AppSecrets } from '@shared/onboarding.type';

const CONFIG_PATH = path.join(app.getPath('userData'), 'cloudwrap-config.json');

class ConfigManager {
  // We're using normal JSON files to store the config files + the encrypted secrets
  static saveConfig(data: AppConfig | AppSecrets) {
    try {
      const current = ConfigManager.getConfig();
      const newConfig = { ...current, ...data };
      fs.writeJsonSync(CONFIG_PATH, newConfig, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save config:', error);
      throw new Error('Could not save configuration');
    }
  }

  static getConfig(): AppConfig & Partial<AppSecrets> {
    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig: AppConfig = { isOnboarded: false };
        
        fs.ensureDirSync(path.dirname(CONFIG_PATH));
        fs.writeJsonSync(CONFIG_PATH, defaultConfig, { spaces: 2 });
      }

      return fs.readJsonSync(CONFIG_PATH);
    } catch (error) {
      console.error('Failed to read config:', error);
      return { isOnboarded: false };
    }
  }

  static saveSecrets(awsAccessKeyId: string, awsSecretAccessKey: string) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("OS-provided cryptography system is not available.");
    }
    
    const encId = safeStorage.encryptString(awsAccessKeyId).toString('hex');
    const encSecret = safeStorage.encryptString(awsSecretAccessKey).toString('hex');

    ConfigManager.saveConfig({
      awsAccessKeyId: encId,
      awsSecretAccessKey: encSecret
    });
  }

  static getCredentials() {
    const config = ConfigManager.getConfig();

    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error("Encrypted AWS credentials not found.");
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("OS-provided cryptography system is not available.");
    }

    try {
      const accessKey = safeStorage.decryptString(Buffer.from(config.awsAccessKeyId, 'hex'));
      const secretKey = safeStorage.decryptString(Buffer.from(config.awsSecretAccessKey, 'hex'));

      return {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      };
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error
    }
  }

  static async clear() {
    await fs.rm(CONFIG_PATH);
  }
}

export {ConfigManager}