import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useChatRoomsQuery } from "@/hooks/api/session/useSessionChat";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type {
    ChatRoomListFilter,
    ChatRoomListItem,
} from "@/types/session/sessionChat";

const formatChatTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();

  if (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  ) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const getStatusLabel = (status: string | null) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  if (normalized.includes("ACCEPT")) return "수락";
  if (normalized.includes("REJECT")) return "거절";
  if (normalized.includes("PENDING")) return "대기";

  return status;
};

export function BandSessionMailboxScreen() {
  const [filter, setFilter] = useState<ChatRoomListFilter>("ALL");

  const queryParams = useMemo(
    () => ({
      filter,
      size: 20,
    }),
    [filter],
  );

  const query = useChatRoomsQuery(queryParams);
  const rooms = query.data?.content ?? [];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="쪽지함" />

      <View style={styles.filters}>
        <Chip
          label="전체"
          selected={filter === "ALL"}
          onPress={() => setFilter("ALL")}
        />

        <Chip
          label="안읽음"
          selected={filter === "UNREAD"}
          onPress={() => setFilter("UNREAD")}
        />
      </View>

      {query.isLoading ? (
        <AppState loading title="쪽지함을 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="쪽지함을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : rooms.length === 0 ? (
        <AppState
          title={
            filter === "UNREAD"
              ? "읽지 않은 쪽지가 없어요"
              : "주고받은 쪽지가 없어요"
          }
          description="세션 모집 또는 지원 과정에서 대화를 시작하면 여기에 표시돼요."
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.chatRoomId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ChatRoomCard room={item} />}
          ListFooterComponent={
            query.data?.hasNext ? (
              <Text style={styles.footer}>
                더 이전 쪽지는 pagination 단계에서 이어서 연결합니다
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function ChatRoomCard({ room }: { room: ChatRoomListItem }) {
  const statusLabel = getStatusLabel(room.applicationStatus);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push(
          `/band/session/messages/${room.chatRoomId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <AppCard style={styles.card}>
        <Avatar
          imageUrl={room.counterpartProfileImageUrl}
          label={room.counterpartName}
          size={50}
        />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.name}>
                {room.counterpartName}
              </Text>

              {room.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                  </Text>
                </View>
              ) : null}

              {statusLabel ? (
                <Badge
                  label={statusLabel}
                  tone={
                    statusLabel === "수락"
                      ? "yellow"
                      : statusLabel === "거절"
                        ? "neutral"
                        : "pink"
                  }
                />
              ) : null}
            </View>

            <Text style={styles.time}>
              {formatChatTime(room.lastMessageAt)}
            </Text>
          </View>

          <Text numberOfLines={2} style={styles.preview}>
            {room.lastMessage || "아직 주고받은 메시지가 없어요."}
          </Text>

          {!room.canSend ? (
            <Text style={styles.disabledText}>
              현재 메시지를 보낼 수 없는 대화입니다.
            </Text>
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },

  filters: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  list: {
    paddingBottom: spacing.xxl,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  content: {
    flex: 1,
    gap: spacing.sm,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  nameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },

  name: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "900",
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary500,
  },

  unreadText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  time: {
    color: colors.neutral500,
    fontSize: 11,
  },

  preview: {
    color: colors.neutral700,
    fontSize: 13,
    lineHeight: 19,
  },

  disabledText: {
    color: colors.neutral500,
    fontSize: 11,
  },

  footer: {
    paddingVertical: spacing.md,
    color: colors.neutral600,
    fontSize: 12,
    textAlign: "center",
  },
});