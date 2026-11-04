import { router } from "expo-router";
import { Alert } from "react-native";

import {
  isBandNotification,
  NotificationList,
} from "@/features/notification/NotificationList";
import {
  useMarkNotificationAsRead,
  useNotificationsInfiniteQuery,
} from "@/hooks/api/notification/useNotification";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationItem } from "@/types/notification";

export function BandNotificationListScreen() {
  const query = useNotificationsInfiniteQuery();
  const markAsReadMutation = useMarkNotificationAsRead();
  const notifications =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter(isBandNotification) ?? [];

  const openNotification = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.notificationId);
    }

    const targetPath = getNotificationDeepLink({ ...notification }, "band");

    if (!targetPath) return;

    if (/^https?:\/\//i.test(targetPath)) {
      Alert.alert("알림", "앱에서 열 수 없는 외부 링크예요.");
      return;
    }

    router.push(targetPath as Parameters<typeof router.push>[0]);
  };

  return (
    <NotificationList
      tone="band"
      query={query}
      notifications={notifications}
      onPressItem={openNotification}
    />
  );
}
