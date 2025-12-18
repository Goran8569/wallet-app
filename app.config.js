try {
  require("dotenv").config();
} catch (e) {}

export default {
  expo: {
    name: "Native Teams Wallet",
    slug: "native-teams-wallet",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nativeteams.wallet",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
      },
      package: "com.nativeteams.wallet",
    },
    scheme: "native-teams-wallet",
    plugins: ["expo-secure-store"],
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000",
      apiBaseUrlDevice: process.env.EXPO_PUBLIC_API_BASE_URL_DEVICE || "http://192.168.100.76:3000",
      apiKey: process.env.EXPO_PUBLIC_API_KEY || "demo-key-here",
    },
  },
};
