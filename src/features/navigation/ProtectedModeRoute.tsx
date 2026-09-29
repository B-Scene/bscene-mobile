import { router } from "expo-router";
import { useEffect, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { useOnboardingStatus } from "@/hooks/api/onboarding/useOnboarding";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getHomePathForMode,
  type AppMode,
} from "@/stores/useModeStore";
import type { ModeCode } from "@/types/onboarding/onboarding";

type ProtectedModeRouteProps =
  PropsWithChildren<{
    mode: AppMode;
  }>;

const MODE_CODE_BY_APP_MODE: Record<AppMode, ModeCode> = {
  fan: "FAN",
  band: "BAND",
};

export function ProtectedModeRoute({
  children,
  mode,
}: ProtectedModeRouteProps) {
  const status =
    useAuthStore(
      (state) =>
        state.status,
    );

  const user =
    useAuthStore(
      (state) =>
        state.user,
    );

  const restoreSession =
    useAuthStore(
      (state) =>
        state.restoreSession,
    );

  const onboardingStatus =
    useOnboardingStatus({
      enabled:
        status ===
        "authenticated",
    });

  useEffect(() => {
    if (
      status === "idle"
    ) {
      void restoreSession();
    }
  }, [
    restoreSession,
    status,
  ]);

  useEffect(() => {
    if (
      status === "idle" ||
      status === "loading"
    ) {
      return;
    }

    if (
      status === "guest"
    ) {
      router.replace("/login");
      return;
    }

    if (
      user?.onboardingCompleted ===
        false ||
      onboardingStatus.data?.completed ===
        false
    ) {
      router.replace(
        "/onboarding/agreement",
      );
      return;
    }

    const requiredMode =
      MODE_CODE_BY_APP_MODE[
        mode
      ];

    const availableModes =
      onboardingStatus.data
        ?.availableModes;

    if (
      availableModes &&
      !availableModes.includes(
        requiredMode,
      )
    ) {
      const currentMode =
        onboardingStatus.data
          ?.currentMode ??
        user?.currentMode ??
        null;

      router.replace(
        getHomePathForMode(
          currentMode,
        ) as Parameters<
          typeof router.replace
        >[0],
      );
    }
  }, [
    mode,
    onboardingStatus.data,
    status,
    user,
  ]);

  const isRestoring =
    status === "idle" ||
    status === "loading";

  const isCheckingModes =
    status ===
      "authenticated" &&
    onboardingStatus.isLoading;

  const requiredMode =
    MODE_CODE_BY_APP_MODE[
      mode
    ];

  const isModeBlocked =
    Boolean(
      onboardingStatus.data
        ?.availableModes,
    ) &&
    !onboardingStatus.data?.availableModes.includes(
      requiredMode,
    );

  if (
    isRestoring ||
    isCheckingModes ||
    status !==
      "authenticated" ||
    user?.onboardingCompleted ===
      false ||
    onboardingStatus.data
      ?.completed === false ||
    isModeBlocked
  ) {
    return (
      <View
        style={
          styles.container
        }
      >
        <ActivityIndicator
          color={
            colors.primary400
          }
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.white,
    },
  });
