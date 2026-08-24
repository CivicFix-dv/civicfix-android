import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pk.civicfix.app',
  appName: 'CivicFix Pakistan',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0B6E4F',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
