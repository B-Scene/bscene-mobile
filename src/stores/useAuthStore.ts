import { create } from "zustand";

import {
  setUnauthorizedHandler,
} from "@/api/axiosInstance";

import {
  getOnboardingStatus,
} from "@/api/onboarding/onboarding";

import {
  getFanMyPage,
} from "@/api/user/myPage";

import {
  secureTokenStorage,
} from "@/shared/utils/secureTokenStorage";

import {
  useModeStore,
} from "@/stores/useModeStore";

import type {
  AuthUser,
  LoginResponse,
  UserMode,
} from "@/types/auth/auth";

const getRecordValue = (
  record: Record<string, unknown>,
  keys: string[],
) => {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
};

const toNumber = (
  value: unknown,
) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
};

const toText = (
  value: unknown,
  fallback: string,
) => {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
};

const hydrateStoredUser = async (): Promise<AuthUser | null> => {
  try {
    const [
      myPage,
      onboardingStatus,
    ] = await Promise.all([
      getFanMyPage(),
      getOnboardingStatus(),
    ]);

    const rawMyPage =
      myPage as unknown as Record<string, unknown>;

    const userId =
      toNumber(
        getRecordValue(rawMyPage, [
          "userId",
          "id",
          "memberId",
        ]),
      ) ?? 0;

    const currentMode =
      onboardingStatus.currentMode ??
      myPage.currentMode ??
      null;

    return {
      userId,
      name: toText(
        getRecordValue(rawMyPage, [
          "name",
          "nickname",
          "userName",
        ]),
        "B:Scene",
      ),
      currentMode:
        currentMode as UserMode | null,
      onboardingCompleted:
        onboardingStatus.completed,
    };
  } catch {
    return null;
  }
};

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
          !accessToken
        ) {
          await secureTokenStorage.clearTokens();

          set({
            status: "guest",
            user: null,
          });

          return;
        }

        const restoredUser =
          user ??
          (await hydrateStoredUser());

        if (!restoredUser) {
          await secureTokenStorage.clearTokens();

          set({
            status: "guest",
            user: null,
          });

          return;
        }

        if (!user) {
          await secureTokenStorage.setUser(
            restoredUser,
          );
        }

        useModeStore
          .getState()
          .setModeFromUserMode(
            restoredUser.currentMode,
          );

        set({
          status:
            "authenticated",

          user:
            restoredUser,
        });
      },
    };
  });
