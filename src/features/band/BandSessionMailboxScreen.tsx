import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import {
  useInfiniteChatRoomsQuery,
  useSessionChatRoomListSocket,
} from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type {
  ChatRoomListFilter,
  ChatRoomListItem,
} from "@/types/session/sessionChat";

const formatChatTime = (value: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(11, 16);
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};

const getStatus = (status: string | null): "accepted" | "declined" | null => {
  if (!status) {
    return null;
  }

  const normalized = status.toUpperCase();

  if (status.includes("수락") || normalized === "ACCEPTED") {
    return "accepted";
  }

  if (status.includes("거절") || normalized === "REJECTED") {
    return "declined";
  }

  return null;
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

  const query = useInfiniteChatRoomsQuery(queryParams);
  useSessionChatRoomListSocket();

  const rooms = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data?.pages],
  );

  const loadMore = () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    void query.fetchNextPage();
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader title="쪽지함" style={styles.header} />

      <View style={styles.tabs}>
        <MailboxTab
          label="전체"
          selected={filter === "ALL"}
          onPress={() => setFilter("ALL")}
        />
        <MailboxTab
          label="안읽음"
          selected={filter === "UNREAD"}
          onPress={() => setFilter("UNREAD")}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>쪽지함을 불러오고 있어요</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>쪽지함을 불러오지 못했어요</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>
            {filter === "UNREAD"
              ? "읽지 않은 쪽지가 없어요."
              : "받은 쪽지가 없어요."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.chatRoomId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ChatRoomCard room={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => void query.refetch()}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.footer}>이전 쪽지를 불러오고 있어요</Text>
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}

function MailboxTab({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={styles.tab}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabText,
          selected ? styles.tabTextSelected : styles.tabTextIdle,
        ]}
      >
        {label}
      </Text>
      {selected ? <View style={styles.tabIndicator} /> : null}
    </Pressable>
  );
}

function ChatRoomCard({ room }: { room: ChatRoomListItem }) {
  const status = getStatus(room.applicationStatus);
  const isDeclined = status === "declined";
  const hasUnread = room.unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() =>
        router.push(
          `/band/session/messages/${room.chatRoomId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <ProfileImage imageUrl={room.counterpartProfileImageUrl} size={35} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[styles.name, isDeclined && styles.declinedText]}
            >
              {room.counterpartName}
            </Text>

            {hasUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {room.unreadCount > 99 ? "99+" : room.unreadCount}
                </Text>
              </View>
            ) : null}

            {status ? <MessageStatusBadge status={status} /> : null}
          </View>

          <View style={styles.timeWrap}>
            <Text style={[styles.time, isDeclined && styles.declinedText]}>
              {formatChatTime(room.lastMessageAt)}
            </Text>
            {hasUnread ? <View style={styles.unreadDot} /> : null}
          </View>
        </View>

        <Text
          numberOfLines={2}
          style={[styles.preview, isDeclined && styles.declinedText]}
        >
          {room.lastMessage || "아직 주고받은 쪽지가 없어요."}
        </Text>
      </View>
    </Pressable>
  );
}

function MessageStatusBadge({ status }: { status: "accepted" | "declined" }) {
  const isAccepted = status === "accepted";

  return (
    <View
      style={[
        styles.statusBadge,
        isAccepted ? styles.acceptedBadge : styles.declinedBadge,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isAccepted ? styles.acceptedText : styles.declinedBadgeText,
        ]}
      >
        {isAccepted ? "수락" : "거절"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 15,
  },
  tabs: {
    height: 40,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIndicator: {
    position: "absolute",
    right: 0,
    bottom: -1,
    left: 0,
    height: 2,
    backgroundColor: colors.secondary500,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  tabTextSelected: {
    color: colors.secondary500,
  },
  tabTextIdle: {
    color: colors.neutral400,
  },
  stateWrap: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingHorizontal: 15,
  },
  stateText: {
    ...textStyles.caption1,
    color: colors.neutral500,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    ...textStyles.caption2,
    color: colors.white,
  },
  list: {
    paddingHorizontal: 15,
    paddingTop: 24,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  card: {
    ...shadows.card,
    minHeight: 84,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nameRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    flexShrink: 1,
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 5,
  },
  unreadText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  statusBadge: {
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  acceptedBadge: {
    backgroundColor: colors.secondary100,
  },
  declinedBadge: {
    backgroundColor: colors.neutral300,
  },
  acceptedText: {
    color: colors.secondary500,
  },
  declinedBadgeText: {
    color: colors.neutral600,
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  time: {
    color: colors.neutral500,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary500,
  },
  preview: {
    marginTop: 8,
    color: colors.neutral800,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  declinedText: {
    color: colors.neutral400,
  },
  footer: {
    ...textStyles.caption2,
    color: colors.neutral600,
    paddingVertical: 16,
    textAlign: "center",
  },
});
