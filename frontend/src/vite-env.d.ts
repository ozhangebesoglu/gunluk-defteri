/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string;
  version: string;
  
  db: {
    healthCheck: () => Promise<{
      status: string;
      timestamp?: Date;
      version?: string;
      error?: string;
    }>;
  };
  
  diary: {
    getEntries: (filters?: any) => Promise<any[]>;
    getEntry: (id: string) => Promise<any>;
    createEntry: (entryData: any) => Promise<any>;
    updateEntry: (id: string, entryData: any) => Promise<any>;
    deleteEntry: (id: string) => Promise<any>;
    getTags: () => Promise<any[]>;
    getStatistics: () => Promise<any>;
    search: (query: string, filters?: any) => Promise<any[]>;
  };
  
  backup: {
    create: () => Promise<any>;
    restore: (backupData: any) => Promise<boolean>;
    autoCreate: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  };

  // 📱 Settings Management
  settings: {
    get: () => Promise<{
      notifications: boolean;
      autoBackup: boolean;
      passwordProtection: boolean;
      reminderTime: string;
      dailyReminder: boolean;
      weekendReminder: boolean;
    }>;
    update: (newSettings: any) => Promise<any>;
  };

  // 🔔 Notification Management
  notification: {
    show: (title: string, body: string, options?: any) => Promise<any>;
    scheduleReminder: () => Promise<boolean>;
    test: () => Promise<boolean>;
  };

  // 🔐 Password Protection
  password: {
    set: (password: string) => Promise<{ success: boolean; error?: string }>;
    remove: () => Promise<{ success: boolean; error?: string }>;
    check: (password: string) => Promise<{ success: boolean; error?: string }>;
  };

  // Şifreleme işlemleri
  encryption: {
    encrypt: (data: any, password: string) => Promise<string>;
    decrypt: (encryptedData: string, password: string) => Promise<any>;
  };

  // Sentiment Analysis
  sentiment: {
    analyze: (text: string) => Promise<any>;
  };

  // App Controls
  app: {
    showWindow: () => Promise<boolean>;
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
  };
  
  window: {
    minimize: () => Promise<boolean>;
    maximize: () => Promise<boolean>;
    close: () => Promise<boolean>;
  };
  
  on: {
    navigateToNewEntry: (callback: () => void) => () => void;
    notificationClick: (callback: (data: any) => void) => () => void;
    updateProgress: (callback: (value: number) => void) => () => void;
  };
  
  log: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electronDev?: {
      isDev: boolean;
      nodeVersion: string;
      chromeVersion: string;
      electronVersion: string;
    };
    securityInfo?: {
      contextIsolation: boolean;
      nodeIntegration: boolean;
      webSecurity: boolean;
    };
  }
}

export {};
