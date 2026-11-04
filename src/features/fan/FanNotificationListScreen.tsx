import { router } from "expo-router";
import { Alert } from "react-native";

import {
  useMarkNotificationAsRead,
  useNotificationsInfiniteQuery,
} from "@/hooks/api/notification/useNotification";
import { NotificationList } from "@/features/notification/NotificationList";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationItem } from "@/types/notification";

const getFallbackTargetPath = (notification: NotificationItem) => {
  if (notification.referenceId == null) return null;

  const type = notification.type.toUpperCase();
  const referenceId = String(notification.referenceId);

  if (type.includes("PERFORMANCE") || type.includes("CONCERT")) {
    return `/fan/home/concerts/${referenceId}`;
  }

  if (type.includes("POST") || type.includes("CONTENT") || type.includes("NEWS")) {
    return `/fan/explore/contents/${referenceId}`;
  }

  if (type.includes("BAND")) {
    return `/fan/bands/${referenceId}`;
  }

  if (type.includes("LIVE")) {
    return `/fan/live/room/${referenceId}`;
  }

  return null;
};

const isFanNotification = (notification: NotificationItem) => {
  if (notification.mode == null) return true;
  return notification.mode === "FAN";
};

export function FanNotificationListScreen() {
  const query = useNotificationsInfiniteQuery();
  const markAsReadMutation = useMarkNotificationAsRead();
  const notifications =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter(isFanNotification) ?? [];

  const openNotification = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.notificationId);
    }

    const targetPath =
      getNotificationDeepLink({ ...notification }, "fan") ??
      getFallbackTargetPath(notification);

    if (!targetPath) {
      return;
    }

    if (/^https?:\/\//i.test(targetPath)) {
      Alert.alert("알림", "앱에서 열 수 없는 외부 링크예요.");
      return;
    }

    router.push(targetPath as Parameters<typeof router.push>[0]);
  };

  return (
    <NotificationList
      tone="fan"
      query={query}
      notifications={notifications}
      onPressItem={openNotification}
    />
  );
}
