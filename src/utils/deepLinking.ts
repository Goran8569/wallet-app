import * as Linking from "expo-linking";

export interface DeepLinkParams {
  screen?: string;
  id?: string;
}

export const parseDeepLink = (url: string): DeepLinkParams | null => {
  try {
    const parsed = Linking.parse(url);

    if (parsed.hostname === "tx" && parsed.path) {
      const id = parsed.path.replace(/^\//, "");
      if (id) {
        return { screen: "TransactionDetails", id };
      }
    }

    const path = parsed.path || "";
    const txMatch = path.match(/\/?tx\/([^\/]+)/);
    if (txMatch && txMatch[1]) {
      return { screen: "TransactionDetails", id: txMatch[1] };
    }

    const pathSegments = (parsed as any).pathSegments;
    if (pathSegments && Array.isArray(pathSegments) && pathSegments.length >= 2) {
      const txIndex = pathSegments.indexOf("tx");
      if (txIndex >= 0 && txIndex < pathSegments.length - 1) {
        const id = pathSegments[txIndex + 1];
        return { screen: "TransactionDetails", id };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const createDeepLink = (screen: string, id?: string): string => {
  if (screen === "TransactionDetails" && id) {
    return `native-teams-wallet://tx/${id}`;
  }
  return `native-teams-wallet://${screen}`;
};
