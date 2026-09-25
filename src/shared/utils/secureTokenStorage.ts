import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "bscene.accessToken";
const REFRESH_TOKEN_KEY = "bscene.refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const getWebStorage = () => {
  if (Platform.OS !== "web") {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const secureTokenStorage = {
  async getAccessToken() {
    if (Platform.OS === "web") {
      return getWebStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
    }

    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    if (Platform.OS === "web") {
      return getWebStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
    }

    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(tokens: AuthTokens) {
    if (Platform.OS === "web") {
      const storage = getWebStorage();

      storage?.setItem(
        ACCESS_TOKEN_KEY,
        tokens.accessToken,
      );

      storage?.setItem(
        REFRESH_TOKEN_KEY,
        tokens.refreshToken,
      );

      return;
    }

    await Promise.all([
      SecureStore.setItemAsync(
        ACCESS_TOKEN_KEY,
        tokens.accessToken,
      ),

      SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        tokens.refreshToken,
      ),
    ]);
  },

  async clearTokens() {
    if (Platform.OS === "web") {
      const storage = getWebStorage();

      storage?.removeItem(ACCESS_TOKEN_KEY);
      storage?.removeItem(REFRESH_TOKEN_KEY);

      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(
        ACCESS_TOKEN_KEY,
      ),

      SecureStore.deleteItemAsync(
        REFRESH_TOKEN_KEY,
      ),
    ]);
  },
};