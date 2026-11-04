import type { ReactElement, ReactNode } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/shared/components/AppHeader";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type { NotificationItem } from "@/types/notification";

type NotificationTone = "fan" | "band";

const TONES = {
  fan: {
    accent: colors.primary400,
    background: colors.primary0,
  },
  band: {
    accent: colors.secondary500,
    background: colors.secondary0,
  },
} as const;

export const isBandNotification = (notification: NotificationItem) => {
  const type = notification.type.toUpperCase();
  const isPostRegistration =
    type.includes("POST") || type.includes("CONTENT") || type.includes("NEWS");

  return (
    !isPostRegistration &&
    (notification.mode == null || notification.mode === "BAND")
  );
};

export const formatNotificationTime = (createdAt: string) => {
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

function NotificationCard({
  tone,
  notification,
  onPress,
}: {
  tone: NotificationTone;
  notification: NotificationItem;
  onPress: () => void;
}) {
  const time = formatNotificationTime(notification.createdAt);

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.card, notification.isRead && styles.cardRead]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <ProfileImage size={45} variant="band" />
      </View>

      <View style={styles.cardText}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>
            {notification.title}
          </Text>
          {!notification.isRead ? (
            <View
              accessibilityLabel="읽지 않은 알림"
              style={[styles.unreadDot, { backgroundColor: TONES[tone].accent }]}
            />
          ) : null}
        </View>
        {notification.body ? (
          <Text numberOfLines={2} style={styles.body}>
            {notification.body}
          </Text>
        ) : null}
        {time ? <Text style={styles.time}>{time}</Text> : null}
      </View>
    </Pressable>
  );
}

export function NotificationList({
  tone,
  query,
  notifications,
  onPressItem,
  renderCard,
  children,
}: {
  tone: NotificationTone;
  query: {
    isLoading: boolean;
    isError: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => unknown;
    refetch: () => unknown;
  };
  notifications: NotificationItem[];
  onPressItem: (notification: NotificationItem) => void;
  renderCard?: (notification: NotificationItem) => ReactElement | null;
  children?: ReactNode;
}) {
  const { accent, background } = TONES[tone];

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={{ ...styles.container, backgroundColor: background }}
    >
      <AppHeader title="알림" style={styles.header} />

      {query.isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.loadingCard} />
          ))}
        </View>
      ) : query.isError ? (
        <View style={styles.errorState}>
          <Text style={styles.stateTitle}>알림을 불러오지 못했어요</Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.retryButton, { backgroundColor: accent }]}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.stateTitle}>밴드 알림이 없어요</Text>
          <Text style={styles.emptyDescription}>
            {"팔로우한 밴드가 없거나,\n밴드의 새로운 소식이 없어요"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notificationId)}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.footerText}>더 불러오는 중이에요</Text>
            ) : undefined
          }
          renderItem={({ item }) =>
            renderCard?.(item) ?? (
              <NotificationCard
                tone={tone}
                notification={item}
                onPress={() => onPressItem(item)}
              />
            )
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
        />
      )}

      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: 15,
  },
  list: {
    gap: 12,
    paddingLeft: 23,
    paddingRight: 22,
    paddingTop: 24,
    paddingBottom: 24,
  },
  card: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardRead: {
    opacity: 0.8,
  },
  avatar: {
    width: 45,
    height: 45,
    overflow: "hidden",
    borderRadius: 22.5,
    backgroundColor: colors.neutral400,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    ...textStyles.body1,
    flex: 1,
    color: colors.neutral900,
  },
  unreadDot: {
    width: 8,
    height: 8,
    marginTop: 4,
    borderRadius: 4,
  },
  body: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral700,
  },
  time: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  loadingCard: {
    ...shadows.card,
    height: 93,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 274,
  },
  stateTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  emptyDescription: {
    ...textStyles.caption1,
    marginTop: 12,
    color: colors.neutral600,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  footerText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
});
