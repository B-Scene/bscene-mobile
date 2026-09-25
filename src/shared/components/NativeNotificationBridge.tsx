import {
    router,
} from "expo-router";

import * as Notifications from "expo-notifications";

import {
    useEffect,
    useRef,
} from "react";

import {
    Platform,
} from "react-native";

import {
    getNotificationDeepLink,
} from "@/shared/utils/notificationDeepLink";

import {
    useModeStore,
} from "@/stores/useModeStore";

Notifications.setNotificationHandler(
  {
    handleNotification:
      async () => ({
        shouldShowBanner:
          true,

        shouldShowList:
          true,

        shouldPlaySound:
          true,

        shouldSetBadge:
          false,
      }),
  },
);

export function NativeNotificationBridge() {
  const mode =
    useModeStore(
      (state) =>
        state.mode,
    );

  const handledRef =
    useRef<
      string | null
    >(null);

  useEffect(() => {
    if (
      Platform.OS ===
      "web"
    ) {
      return;
    }

    void Notifications.requestPermissionsAsync();

    const handleResponse = (
      response:
        Notifications.NotificationResponse,
    ) => {
      const identifier =
        response.notification
          .request
          .identifier;

      if (
        handledRef.current ===
        identifier
      ) {
        return;
      }

      handledRef.current =
        identifier;

      const data =
        response.notification
          .request.content
          .data;

      const path =
        getNotificationDeepLink(
          data,
          mode,
        );

      if (!path) {
        return;
      }

      router.push(
        path as Parameters<
          typeof router.push
        >[0],
      );
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        handleResponse,
      );

    void Notifications.getLastNotificationResponseAsync().then(
      (response) => {
        if (response) {
          handleResponse(
            response,
          );
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [mode]);

  return null;
}