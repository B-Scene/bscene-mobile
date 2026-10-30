import { useQueryClient } from "@tanstack/react-query";
import { router, usePathname, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

import { notificationKeys } from "@/hooks/api/notification/useNotification";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import { useAuthStore } from "@/stores/useAuthStore";
import { useModeStore } from "@/stores/useModeStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function NativeNotificationBridge() {
  const queryClient = useQueryClient();
  const mode = useModeStore((state) => state.mode);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const navigationState = useRootNavigationState();
  const response = Notifications.useLastNotificationResponse();
  const handledRef = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    void Notifications.requestPermissionsAsync().catch((error: unknown) => {
      console.warn("알림 권한을 확인하지 못했어요.", error);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || status !== "authenticated") {
      return;
    }

    const refreshNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    refreshNotifications();
    const received = Notifications.addNotificationReceivedListener(refreshNotifications);
    const appState = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") refreshNotifications();
    });

    return () => {
      received.remove();
      appState.remove();
    };
  }, [queryClient, status]);

  useEffect(() => {
    if (
      Platform.OS === "web" ||
      !response ||
      !navigationState?.key ||
      status !== "authenticated" ||
      !user ||
      user.onboardingCompleted === false ||
      (!pathname.startsWith("/fan/") && !pathname.startsWith("/band/"))
    ) {
      return;
    }

    const identifier = response.notification.request.identifier;

    if (handledRef.current.has(identifier)) {
      return;
    }

    const path = getNotificationDeepLink(
      response.notification.request.content.data,
      mode,
    );

    if (!path) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    router.push(path as Parameters<typeof router.push>[0]);
    handledRef.current.add(identifier);
    Notifications.clearLastNotificationResponse();
  }, [mode, navigationState?.key, pathname, queryClient, response, status, user]);

  return null;
}
