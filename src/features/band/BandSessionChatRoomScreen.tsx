import { router, useLocalSearchParams } from "expo-router";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import {
    useChatRoomDetailQuery,
    useLeaveChatRoomMutation,
} from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import type { ChatMessageItem } from "@/types/session/sessionChat";

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};

export function BandSessionChatRoomScreen() {
  const params = useLocalSearchParams<{ chatRoomId?: string }>();
  const chatRoomId = parseRouteId(params.chatRoomId);

  const query = useChatRoomDetailQuery(chatRoomId, {
    size: 50,
  });

  const leaveMutation = useLeaveChatRoomMutation();
  const room = query.data;

  const leaveRoom = () => {
    if (!room) return;

    Alert.alert(
      "쪽지창 나가기",
      "나가면 이 대화가 쪽지함에서도 삭제될 수 있어요. 나갈까요?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "나가기",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await leaveMutation.mutateAsync(room.chatRoomId);

                router.replace(
                  "/band/session/messages" as Parameters<
                    typeof router.replace
                  >[0],
                );
              } catch {
                Alert.alert(
                  "쪽지창 나가기",
                  "쪽지창을 나가지 못했어요. 다시 시도해 주세요.",
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader
        title={room?.opponentName ?? "쪽지"}
        rightContent={
          room ? (
            <Text style={styles.leaveText} onPress={leaveRoom}>
              나가기
            </Text>
          ) : null
        }
      />

      {query.isLoading ? (
        <AppState loading title="대화를 불러오는 중이에요" />
      ) : query.isError || !room ? (
        <AppState
          title="대화를 불러오지 못했어요"
          description="삭제된 대화이거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <>
          <View style={styles.opponentCard}>
            <Avatar
              imageUrl={room.opponentProfileImageUrl}
              label={room.opponentName}
              size={44}
            />

            <View style={styles.opponentInfo}>
              <Text style={styles.opponentName}>{room.opponentName}</Text>

              <Text style={styles.opponentMeta}>
                {[room.part, room.genre, room.region]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            {!room.canSend ? <Badge label="대화 종료" /> : null}
          </View>

          {room.messages.length === 0 ? (
            <AppState
              title="아직 주고받은 메시지가 없어요"
              description={
                room.canSend
                  ? "실시간 메시지 송수신은 다음 WebSocket 단계에서 연결합니다."
                  : "현재 이 대화에서는 메시지를 보낼 수 없어요."
              }
            />
          ) : (
            <FlatList
              data={[...room.messages].reverse()}
              inverted
              keyExtractor={(item) => String(item.chatMessageId)}
              contentContainerStyle={styles.messages}
              renderItem={({ item }) => <MessageBubble message={item} />}
              ListFooterComponent={
                room.hasNext ? (
                  <Text style={styles.moreText}>
                    더 이전 메시지는 pagination 단계에서 이어서 연결합니다
                  </Text>
                ) : null
              }
            />
          )}

          <View style={styles.composerPlaceholder}>
            <Text style={styles.composerText}>
              {room.canSend
                ? "다음 단계에서 실시간 메시지 입력을 연결합니다."
                : "현재 메시지를 보낼 수 없는 대화입니다."}
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

function MessageBubble({ message }: { message: ChatMessageItem }) {
  return (
    <View
      style={[
        styles.messageRow,
        message.isMine ? styles.mineRow : styles.receivedRow,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isMine ? styles.mineBubble : styles.receivedBubble,
        ]}
      >
        {!message.isMine ? (
          <Text style={styles.senderName}>{message.senderName}</Text>
        ) : null}

        <Text
          style={[
            styles.messageText,
            message.isMine && styles.mineMessageText,
          ]}
        >
          {message.content}
        </Text>

        <View style={styles.messageMeta}>
          {message.isMine ? (
            <Text style={styles.readText}>
              {message.isRead ? "읽음" : "안읽음"}
            </Text>
          ) : null}

          <Text
            style={[
              styles.messageTime,
              message.isMine && styles.mineMessageTime,
            ]}
          >
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },

  leaveText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "800",
  },

  opponentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },

  opponentInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  opponentName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },

  opponentMeta: {
    color: colors.neutral600,
    fontSize: 12,
  },

  messages: {
    paddingVertical: spacing.md,
  },

  messageRow: {
    width: "100%",
    marginBottom: spacing.sm,
  },

  mineRow: {
    alignItems: "flex-end",
  },

  receivedRow: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },

  mineBubble: {
    backgroundColor: colors.primary500,
  },

  receivedBubble: {
    backgroundColor: colors.neutral200,
  },

  senderName: {
    color: colors.neutral700,
    fontSize: 11,
    fontWeight: "800",
  },

  messageText: {
    color: colors.neutral900,
    fontSize: 14,
    lineHeight: 20,
  },

  mineMessageText: {
    color: colors.white,
  },

  messageMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
  },

  readText: {
    color: colors.primary50,
    fontSize: 10,
  },

  messageTime: {
    color: colors.neutral500,
    fontSize: 10,
  },

  mineMessageTime: {
    color: colors.primary50,
  },

  moreText: {
    paddingVertical: spacing.md,
    color: colors.neutral500,
    fontSize: 11,
    textAlign: "center",
  },

  composerPlaceholder: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.neutral100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },

  composerText: {
    color: colors.neutral500,
    fontSize: 12,
    textAlign: "center",
  },
});