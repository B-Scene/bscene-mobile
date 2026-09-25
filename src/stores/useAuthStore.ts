import { create } from "zustand";

import {
  setUnauthorizedHandler,
} from "@/api/axiosInstance";

import {
  secureTokenStorage,
} from "@/shared/utils/secureTokenStorage";

import {
  useModeStore,
} from "@/stores/useModeStore";

import type {
  AuthUser,
  LoginResponse,
} from "@/types/auth/auth";

type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "guest";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;

  setSession: (
    session: LoginResponse,
  ) => Promise<void>;

  clearSession: () => Promise<void>;

  restoreSession: () => Promise<void>;
};

export const useAuthStore =
  create<AuthState>((set) => {
    const clearSession =
      async () => {
        await secureTokenStorage.clearTokens();

        set({
          status: "guest",
          user: null,
        });
      };

    setUnauthorizedHandler(() => {
      void clearSession();
    });

    return {
      status: "idle",

      user: null,

      async setSession(
        session,
      ) {
        await Promise.all([
          secureTokenStorage.setTokens(
            {
              accessToken:
                session.accessToken,

              refreshToken:
                session.refreshToken,
            },
          ),

          secureTokenStorage.setUser(
            session.user,
          ),
        ]);

        useModeStore
          .getState()
          .setModeFromUserMode(
            session.user
              .currentMode,
          );

        set({
          status:
            "authenticated",

          user:
            session.user,
        });
      },

      clearSession,

      async restoreSession() {
        set({
          status: "loading",
        });

        const [
          accessToken,
          user,
        ] =
          await Promise.all([
            secureTokenStorage.getAccessToken(),
            secureTokenStorage.getUser(),
          ]);

        if (
          !accessToken ||
          !user
        ) {
          await secureTokenStorage.clearTokens();

          set({
            status: "guest",
            user: null,
          });

          return;
        }

        useModeStore
          .getState()
          .setModeFromUserMode(
            user.currentMode,
          );

        set({
          status:
            "authenticated",

          user,
        });
      },
    };
  });