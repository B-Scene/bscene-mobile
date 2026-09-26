import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useChatRoomsQuery,
  useSessionChatRoomListSocket,
} from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
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

  const query = useChatRoomsQuery(queryParams);
  useSessionChatRoomListSocket();

  const rooms = query.data?.content ?? [];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="쪽지함" />

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
        <AppState
          title={filter === "UNREAD" ? "읽지 않은 쪽지가 없어요" : "주고받은 쪽지가 없어요"}
          description="세션 모집 또는 지원 과정에서 대화를 시작하면 여기에 표시돼요."
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.chatRoomId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ChatRoomCard room={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
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
      style={[styles.tab, selected && styles.tabSelected]}
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
    </Pressable>
  );
}

function ChatRoomCard({
  room,
}: {
  room: ChatRoomListItem;
}) {
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
      <Avatar
        imageUrl={room.counterpartProfileImageUrl}
        label={room.counterpartName}
        size={35}
      />

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

        {!room.canSend ? (
          <Text style={styles.disabledText}>현재 메시지를 보낼 수 없는 대화입니다.</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function MessageStatusBadge({
  status,
}: {
  status: "accepted" | "declined";
}) {
  const isAccepted = status === "accepted";

  return (
    <Text
      style={[
        styles.statusBadge,
        isAccepted ? styles.acceptedBadge : styles.declinedBadge,
      ]}
    >
      {isAccepted ? "수락" : "거절"}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    backgroundColor: colors.white,
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
  tabSelected: {
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary500,
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
    paddingHorizontal: 24,
  },
  stateText: {
    color: colors.neutral500,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
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
    minHeight: 84,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
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
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary500,
    paddingHorizontal: 5,
  },
  unreadText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 10,
  },
  statusBadge: {
    height: 22,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  acceptedBadge: {
    backgroundColor: colors.secondary100,
    color: colors.secondary500,
  },
  declinedBadge: {
    backgroundColor: colors.neutral300,
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
    color: colors.neutral800,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  declinedText: {
    color: colors.neutral400,
  },
  disabledText: {
    color: colors.neutral500,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    marginTop: 6,
  },
  footer: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 16,
    textAlign: "center",
  },
});
