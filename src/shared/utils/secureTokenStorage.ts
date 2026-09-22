import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "bscene.accessToken";
const REFRESH_TOKEN_KEY = "bscene.refreshToken";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const secureTokenStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(tokens: AuthTokens) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },

  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
