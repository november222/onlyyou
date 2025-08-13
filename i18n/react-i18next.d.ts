import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        common: {
          ok: string;
          cancel: string;
          skip: string;
          next: string;
          getStarted: string;
          back: string;
          close: string;
          delete: string;
          confirm: string;
          loading: string;
          error: string;
          success: string;
          save: string;
          edit: string;
          done: string;
          continue: string;
        };
        auth: {
          title: string;
          subtitle: string;
          signInWithGoogle: string;
          signInWithApple: string;
          signOut: string;
          signOutConfirm: string;
          signOutDescription: string;
          termsText: string;
          signInFailed: string;
          signOutFailed: string;
        };
        settings: {
          title: string;
          account: string;
          language: string;
          selectLanguage: string;
          languageChanged: string;
          languageChangedDesc: string;
          notifications: string;
          pushNotifications: string;
          pushNotificationsDesc: string;
          appearance: string;
          darkMode: string;
          darkModeDesc: string;
          privacy: string;
          readReceipts: string;
          readReceiptsDesc: string;
          dataStorage: string;
          autoBackup: string;
          autoBackupDesc: string;
          exportMessages: string;
          exportMessagesDesc: string;
          createBackup: string;
          createBackupDesc: string;
          clearAllMessages: string;
          clearAllMessagesDesc: string;
          accountManagement: string;
          deleteAccount: string;
          deleteAccountDesc: string;
          about: string;
          aboutApp: string;
          aboutAppDesc: string;
          footerText: string;
        };
        history: {
          title: string;
          totalSessions: string;
          totalTime: string;
          buzzCalls: string;
          sessionDetail: string;
          deleteSession: string;
          deleteSessionDesc: string;
          activeSession: string;
          activeSessionDesc: string;
          connected: string;
          disconnected: string;
          connectionTime: string;
          started: string;
          ended: string;
          exactDuration: string;
          sessionStats: string;
          messages: string;
          calls: string;
          videoCalls: string;
          reactions: string;
          inDevelopment: string;
        };
        onboarding: {
          madeForTwo: string;
          madeForTwoDesc: string;
          encrypted: string;
          encryptedDesc: string;
          messaging: string;
          messagingDesc: string;
          calls: string;
          callsDesc: string;
          private: string;
          privateDesc: string;
        };
      };
    };
  }
}