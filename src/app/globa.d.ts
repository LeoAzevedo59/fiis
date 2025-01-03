interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }