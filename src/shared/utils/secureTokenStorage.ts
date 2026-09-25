import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthUser } from "@/types/auth/auth";

const ACCESS_TOKEN_KEY =
  "bscene.accessToken";

const REFRESH_TOKEN_KEY =
  "bscene.refreshToken";

const AUTH_USER_KEY =
  "bscene.authUser";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const getWebStorage = () => {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined"
  ) {
    return null;
  }

  return window.localStorage;
};

const getItem = async (
  key: string,
) => {
  if (Platform.OS === "web") {
    return (
      getWebStorage()?.getItem(
        key,
      ) ?? null
    );
  }

  return SecureStore.getItemAsync(
    key,
  );
};

const setItem = async (
  key: string,
  value: string,
) => {
  if (Platform.OS === "web") {
    getWebStorage()?.setItem(
      key,
      value,
    );

    return;
  }

  await SecureStore.setItemAsync(
    key,
    value,
  );
};

const removeItem = async (
  key: string,
) => {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(
      key,
    );

    return;
  }

  await SecureStore.deleteItemAsync(
    key,
  );
};

export const secureTokenStorage = {
  async getAccessToken() {
    return getItem(
      ACCESS_TOKEN_KEY,
    );
  },

  async getRefreshToken() {
    return getItem(
      REFRESH_TOKEN_KEY,
    );
  },

  async setTokens(
    tokens: AuthTokens,
  ) {
    await Promise.all([
      setItem(
        ACCESS_TOKEN_KEY,
        tokens.accessToken,
      ),

      setItem(
        REFRESH_TOKEN_KEY,
        tokens.refreshToken,
      ),
    ]);
  },

  async getUser(): Promise<AuthUser | null> {
    const raw =
      await getItem(
        AUTH_USER_KEY,
      );

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(
        raw,
      ) as AuthUser;
    } catch {
      return null;
    }
  },

  async setUser(
    user: AuthUser,
  ) {
    await setItem(
      AUTH_USER_KEY,
      JSON.stringify(user),
    );
  },

  async clearTokens() {
    await Promise.all([
      removeItem(
        ACCESS_TOKEN_KEY,
      ),

      removeItem(
        REFRESH_TOKEN_KEY,
      ),

      removeItem(
        AUTH_USER_KEY,
      ),
    ]);
  },
};