import { router } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useMarkNotificationAsRead,
  useNotificationsInfiniteQuery,
} from "@/hooks/api/notification/useNotification";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationItem } from "@/types/notification";

const formatNotificationTime = (createdAt: string) => {
  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "";
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdDate.getTime()) / 60_000),
  );

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return `${createdDate.getFullYear()}.${createdDate.getMonth() + 1}.${createdDate.getDate()}.`;
};

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
    <Screen contentStyle={styles.container}>
      <AppHeader title="알림" />

      {query.isLoading ? (
        <AppState loading title="알림을 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="알림을 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : notifications.length === 0 ? (
        <AppState title="밴드 알림이 없어요" description="새로운 소식이 오면 여기에 표시돼요." />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.notificationId}
              notification={notification}
              onPress={() => openNotification(notification)}
            />
          ))}

          {query.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              disabled={query.isFetchingNextPage}
              style={styles.moreButton}
              onPress={() => void query.fetchNextPage()}
            >
              <Text style={styles.moreButtonText}>
                {query.isFetchingNextPage ? "불러오는 중" : "더보기"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: NotificationItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.notificationCard,
        !notification.isRead ? styles.notificationCardUnread : null,
        pressed ? styles.pressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.notificationHeader}>
        <Text numberOfLines={1} style={styles.notificationTitle}>
          {notification.title}
        </Text>
        {!notification.isRead ? <View style={styles.unreadDot} /> : null}
      </View>
      {notification.body ? (
        <Text numberOfLines={2} style={styles.notificationBody}>
          {notification.body}
        </Text>
      ) : null}
      <Text style={styles.notificationTime}>
        {formatNotificationTime(notification.createdAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.white,
  },
  list: {
    gap: 12,
    marginTop: 20,
  },
  notificationCard: {
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 16,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: colors.primary0,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary400,
  },
  notificationBody: {
    color: colors.neutral700,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginTop: 8,
  },
  notificationTime: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 10,
  },
  moreButton: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary400,
    marginTop: 4,
  },
  moreButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.76,
  },
});
