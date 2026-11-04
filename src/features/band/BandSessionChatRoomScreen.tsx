import { useQueryClient } from "@tanstack/react-query";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

import {
  sessionChatKeys,
  useChatRoomDetailQuery,
  useLeaveChatRoomMutation,
  useSessionDirectMessageSocket,
} from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  textStyles,
} from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  ChatMessageItem,
  DirectMessageData,
  DirectMessageErrorFrame,
  DirectMessageReadData,
} from "@/types/session/sessionChat";

const LEAVE_ICON_XML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12C4 12.2652 4.10536 12.5196 4.29289 12.7071C4.48043 12.8946 4.73478 13 5 13H12.59L10.29 15.29C10.1963 15.383 10.1219 15.4936 10.0711 15.6154C10.0203 15.7373 9.9942 15.868 9.9942 16C9.9942 16.132 10.0203 16.2627 10.0711 16.3846C10.1219 16.5064 10.1963 16.617 10.29 16.71C10.383 16.8037 10.4936 16.8781 10.6154 16.9289C10.7373 16.9797 10.868 17.0058 11 17.0058C11.132 17.0058 11.2627 16.9797 11.3846 16.9289C11.5064 16.8781 11.617 16.8037 11.71 16.71L15.71 12.71C15.801 12.6149 15.8724 12.5028 15.92 12.38C16.02 12.1365 16.02 11.8635 15.92 11.62C15.8724 11.4972 15.801 11.3851 15.71 11.29L11.71 7.29C11.6168 7.19676 11.5061 7.1228 11.3842 7.07234C11.2624 7.02188 11.1319 6.99591 11 6.99591C10.8681 6.99591 10.7376 7.02188 10.6158 7.07234C10.4939 7.1228 10.3832 7.19676 10.29 7.29C10.1968 7.38324 10.1228 7.49393 10.0723 7.61575C10.0219 7.73757 9.99591 7.86814 9.99591 8C9.99591 8.13186 10.0219 8.26243 10.0723 8.38425C10.1228 8.50607 10.1968 8.61676 10.29 8.71L12.59 11H5C4.73478 11 4.48043 11.1054 4.29289 11.2929C4.10536 11.4804 4 11.7348 4 12ZM17 2H7C6.20435 2 5.44129 2.31607 4.87868 2.87868C4.31607 3.44129 4 4.20435 4 5V8C4 8.26522 4.10536 8.51957 4.29289 8.70711C4.48043 8.89464 4.73478 9 5 9C5.26522 9 5.51957 8.89464 5.70711 8.70711C5.89464 8.51957 6 8.26522 6 8V5C6 4.73478 6.10536 4.48043 6.29289 4.29289C6.48043 4.10536 6.73478 4 7 4H17C17.2652 4 17.5196 4.10536 17.7071 4.29289C17.8946 4.48043 18 4.73478 18 5V19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 19.8946 17.2652 20 17 20H7C6.73478 20 6.48043 19.8946 6.29289 19.7071C6.10536 19.5196 6 19.2652 6 19V16C6 15.7348 5.89464 15.4804 5.70711 15.2929C5.51957 15.1054 5.26522 15 5 15C4.73478 15 4.48043 15.1054 4.29289 15.2929C4.10536 15.4804 4 15.7348 4 16V19C4 19.7956 4.31607 20.5587 4.87868 21.1213C5.44129 21.6839 6.20435 22 7 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V5C20 4.20435 19.6839 3.44129 19.1213 2.87868C18.5587 2.31607 17.7956 2 17 2Z" fill="#141414"/></svg>`;

interface LocalChatMessage
  extends ChatMessageItem {
  clientMsgId?: string;
  pending?: boolean;
}

const parseRouteId = (
  value?: string | string[],
) => {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  const parsed = Number(rawValue);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 0;
};

const normalizeDateValue = (
  value: string,
) => {
  return value.includes("T")
    ? value
    : value.replace(" ", "T");
};

const formatMessageTime = (
  value: string,
) => {
  const date = new Date(
    normalizeDateValue(value),
  );

  if (Number.isNaN(date.getTime())) {
    return value.slice(11, 16) || value;
  }

  return `${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};

const formatMessageDate = (
  value: string,
) => {
  const date = new Date(
    normalizeDateValue(value),
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const weekDays = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  return `${
    date.getMonth() + 1
  }월 ${date.getDate()}일 (${
    weekDays[date.getDay()]
  })`;
};

const getDateKey = (
  value: string,
) => {
  const date = new Date(
    normalizeDateValue(value),
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
};

export function BandSessionChatRoomScreen() {
  const params =
    useLocalSearchParams<{
      chatRoomId?: string;
    }>();

  const chatRoomId = parseRouteId(
    params.chatRoomId,
  );

  const queryClient =
    useQueryClient();

  const user = useAuthStore(
    (state) => state.user,
  );

  const currentUserId =
    user?.userId ?? null;

  const query =
    useChatRoomDetailQuery(
      chatRoomId,
      {
        size: 50,
      },
    );

  const leaveMutation =
    useLeaveChatRoomMutation();

  const room = query.data;

  const [messages, setMessages] =
    useState<LocalChatMessage[]>(
      [],
    );

  const [
    messageInput,
    setMessageInput,
  ] = useState("");

  const [
    isLeaveModalOpen,
    setIsLeaveModalOpen,
  ] = useState(false);

  const [
    isInputFocused,
    setIsInputFocused,
  ] = useState(false);

  const listRef =
    useRef<
      FlatList<LocalChatMessage>
    >(null);

  const lastReadMessageIdRef =
    useRef(0);

  const sendReadRef =
    useRef<
      (messageId: number) => boolean
    >(() => false);

  const hasConnectedRef =
    useRef(false);

  const handleSocketMessage =
    useCallback(
      (
        message: DirectMessageData,
        frame: {
          clientMsgId: string | null;
        },
      ) => {
        const isMine =
          Boolean(frame.clientMsgId) ||
          (currentUserId !== null &&
            message.senderId ===
              currentUserId);

        setMessages(
          (previousMessages) => {
            const serverIndex =
              previousMessages.findIndex(
                (previousMessage) =>
                  previousMessage.chatMessageId ===
                  message.chatMessageId,
              );

            const optimisticIndex =
              frame.clientMsgId
                ? previousMessages.findIndex(
                    (
                      previousMessage,
                    ) =>
                      previousMessage.clientMsgId ===
                      frame.clientMsgId,
                  )
                : -1;

            const nextMessage: LocalChatMessage =
              {
                chatMessageId:
                  message.chatMessageId,

                senderUserId:
                  message.senderId,

                senderName:
                  message.senderName,

                content:
                  message.content,

                isMine,

                isRead:
                  isMine
                    ? Boolean(
                        message.readAt,
                      )
                    : true,

                createdAt:
                  message.createdAt,

                clientMsgId:
                  frame.clientMsgId ??
                  undefined,

                pending: false,
              };

            if (
              optimisticIndex >= 0
            ) {
              return previousMessages
                .filter(
                  (
                    _previousMessage,
                    index,
                  ) =>
                    index !==
                      serverIndex ||
                    serverIndex ===
                      optimisticIndex,
                )
                .map(
                  (
                    previousMessage,
                    index,
                  ) =>
                    index ===
                    optimisticIndex
                      ? nextMessage
                      : previousMessage,
                );
            }

            if (serverIndex >= 0) {
              return previousMessages.map(
                (
                  previousMessage,
                  index,
                ) =>
                  index === serverIndex
                    ? nextMessage
                    : previousMessage,
              );
            }

            return [
              ...previousMessages,
              nextMessage,
            ];
          },
        );

        if (!isMine) {
          sendReadRef.current(
            message.chatMessageId,
          );
        }

        queryClient.invalidateQueries({
          queryKey:
            sessionChatKeys.rooms(),
        });
      },
      [
        currentUserId,
        queryClient,
      ],
    );

  const handleSocketRead =
    useCallback(
      (
        readData: DirectMessageReadData,
      ) => {
        if (
          currentUserId !== null &&
          readData.readerId ===
            currentUserId
        ) {
          return;
        }

        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (message) => {
                if (
                  !message.isMine ||
                  message.chatMessageId <=
                    0 ||
                  message.chatMessageId >
                    readData.lastReadMessageId
                ) {
                  return message;
                }

                return {
                  ...message,
                  isRead: true,
                };
              },
            ),
        );
      },
      [currentUserId],
    );

  const handleSocketError =
    useCallback(
      (
        frame: DirectMessageErrorFrame,
      ) => {
        const errorMessage =
          frame.data.message ||
          "쪽지 처리 중 오류가 발생했어요.";

        Alert.alert(
          "쪽지",
          errorMessage,
        );

        if (!frame.clientMsgId) {
          return;
        }

        setMessages(
          (previousMessages) =>
            previousMessages.filter(
              (message) =>
                message.clientMsgId !==
                frame.clientMsgId,
            ),
        );
      },
      [],
    );

  const socket =
  
    useSessionDirectMessageSocket({
      chatRoomId,

      enabled:
        chatRoomId > 0,

      onMessage:
        handleSocketMessage,

      onRead:
        handleSocketRead,

      onError:
        handleSocketError,

      onConnected: () => {
        queryClient.invalidateQueries({
          queryKey:
            sessionChatKeys.rooms(),
        });

        if (
          hasConnectedRef.current
        ) {
          queryClient.invalidateQueries({
            queryKey: [
              ...sessionChatKeys.details(),
              chatRoomId,
            ],
          });
        }

        hasConnectedRef.current =
          true;
      },
    });
    const socketIsConnected =
    socket.isConnected;

    const socketSendRead =
    socket.sendRead;

    useEffect(() => {
      sendReadRef.current =
        socketSendRead;
    }, [socketSendRead]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!room) {
      return;
    }

    const serverMessages: LocalChatMessage[] =
      room.messages.map(
        (message) => ({
          ...message,
          pending: false,
        }),
      );

    setMessages(
      (previousMessages) => {
        const serverIds =
          new Set(
            serverMessages.map(
              (message) =>
                message.chatMessageId,
            ),
          );

        const unmatchedServerMine =
          serverMessages.filter(
            (message) =>
              message.isMine &&
              !previousMessages.some(
                (previousMessage) =>
                  previousMessage.chatMessageId ===
                  message.chatMessageId,
              ),
          );

        const pendingMessages =
          previousMessages.filter(
            (message) => {
              if (
                !message.pending ||
                serverIds.has(
                  message.chatMessageId,
                )
              ) {
                return false;
              }

              const matchedIndex =
                unmatchedServerMine.findIndex(
                  (serverMessage) =>
                    serverMessage.content ===
                    message.content,
                );

              if (matchedIndex < 0) {
                return true;
              }

              unmatchedServerMine.splice(
                matchedIndex,
                1,
              );

              return false;
            },
          );

        return [
          ...serverMessages,
          ...pendingMessages,
        ];
      },
    );
  }, [room]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!socketIsConnected) {
    return;
  }

    const latestReceivedId =
      messages.reduce(
        (
          latestMessageId,
          message,
        ) => {
          if (
            message.isMine ||
            message.chatMessageId <= 0
          ) {
            return latestMessageId;
          }

          return Math.max(
            latestMessageId,
            message.chatMessageId,
          );
        },
        0,
      );

    if (
      latestReceivedId <= 0 ||
      lastReadMessageIdRef.current >=
        latestReceivedId
    ) {
      return;
    }

    const sent =
    socketSendRead(
      latestReceivedId,
    );

    if (sent) {
      lastReadMessageIdRef.current =
        latestReceivedId;

      queryClient.invalidateQueries({
        queryKey:
          sessionChatKeys.rooms(),
      });
    }
  }, [
  messages,
  queryClient,
  socketIsConnected,
  socketSendRead,
]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const animationFrame =
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({
          animated: true,
        });
      });

    return () => {
      cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [messages]);

  const sendMessage = () => {
    const trimmedMessage =
      messageInput.trim();

    if (!trimmedMessage) {
      return;
    }

    if (!room?.canSend) {
      Alert.alert(
        "쪽지",
        "현재 이 쪽지방에서는 메시지를 보낼 수 없어요.",
      );

      return;
    }

    if (!socket.isConnected) {
      Alert.alert(
        "쪽지 연결",
        socket.lastErrorMessage ||
          "쪽지 서버에 연결 중이에요. 잠시 후 다시 시도해 주세요.",
      );

      return;
    }

    if (
      trimmedMessage.length > 2000
    ) {
      Alert.alert(
        "쪽지",
        "쪽지는 최대 2,000자까지 입력할 수 있어요.",
      );

      return;
    }

    const clientMsgId =
      socket.sendMessage(
        trimmedMessage,
      );

    if (!clientMsgId) {
      Alert.alert(
        "쪽지",
        socket.lastErrorMessage ||
          "쪽지를 전송하지 못했어요.",
      );

      return;
    }

    const optimisticMessage: LocalChatMessage =
      {
        chatMessageId:
          -Date.now(),

        senderUserId:
          currentUserId ?? 0,

        senderName:
          user?.name ?? "나",

        content:
          trimmedMessage,

        isMine: true,

        isRead: false,

        createdAt:
          new Date().toISOString(),

        clientMsgId,

        pending: true,
      };

    setMessages(
      (previousMessages) => [
        ...previousMessages,
        optimisticMessage,
      ],
    );

    setMessageInput("");
  };

  const leaveRoom = async () => {
    if (!room) {
      return;
    }

    try {
      socket.close();

      await leaveMutation.mutateAsync(
        room.chatRoomId,
      );

      setIsLeaveModalOpen(false);

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
  };

  if (chatRoomId <= 0) {
    return (
      <Screen
        edges={["top", "left", "right"]}
        scroll={false}
        contentStyle={styles.container}
      >
        <AppHeader title="쪽지" style={styles.header} />

        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>
            쪽지방 정보를 찾을 수 없어요.
          </Text>
        </View>
      </Screen>
    );
  }

  const canSubmit =
    Boolean(room?.canSend) &&
    socket.isConnected &&
    messageInput.trim().length > 0;

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader
        title={room?.opponentName ?? "쪽지"}
        style={styles.header}
        rightContent={
          room ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="쪽지창 나가기"
              hitSlop={8}
              onPress={() => setIsLeaveModalOpen(true)}
            >
              <SvgXml xml={LEAVE_ICON_XML} width={24} height={24} />
            </Pressable>
          ) : null
        }
      />

      {query.isLoading ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>쪽지를 불러오고 있어요</Text>
        </View>
      ) : query.isError || !room ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>쪽지 내용을 불러오지 못했어요</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {!socket.isConnected ? (
            <View style={styles.connectionRow}>
              <Text style={styles.connectionText}>
                {socket.lastErrorMessage || "실시간 연결 중..."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void socket.reconnect()}
              >
                <Text style={styles.reconnectText}>재연결</Text>
              </Pressable>
            </View>
          ) : null}

          {messages.length === 0 ? (
            <View style={styles.stateWrap}>
              <Text style={styles.stateText}>
                아직 주고받은 쪽지가 없어요
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              style={styles.messageList}
              contentContainerStyle={styles.messages}
              keyExtractor={(item) =>
                item.clientMsgId ?? String(item.chatMessageId)
              }
              renderItem={({ item, index }) => {
                const previous = messages[index - 1];
                const next = messages[index + 1];
                const dateKey = getDateKey(item.createdAt);
                const showDate =
                  Boolean(dateKey) &&
                  (index === 0 ||
                    getDateKey(previous.createdAt) !== dateKey);
                const showTime =
                  !next ||
                  next.isMine !== item.isMine ||
                  formatMessageTime(next.createdAt) !==
                    formatMessageTime(item.createdAt) ||
                  getDateKey(next.createdAt) !== dateKey;

                return (
                  <View style={index > 0 && styles.messageGap}>
                    {showDate ? (
                      <View
                        style={
                          index === 0
                            ? styles.firstDate
                            : styles.dateSpacing
                        }
                      >
                        <DateDivider value={item.createdAt} />
                      </View>
                    ) : null}

                    <View style={showDate && styles.afterDate}>
                      <MessageBubble
                        message={item}
                        senderName={room.opponentName}
                        profileImageUrl={room.opponentProfileImageUrl}
                        showTime={showTime}
                      />
                    </View>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.composer}>
            <TextInput
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder={
                room.canSend
                  ? socket.isConnected
                    ? "메시지 입력하기"
                    : "서버 연결 중..."
                  : "현재 메시지를 보낼 수 없어요"
              }
              placeholderTextColor={colors.neutral400}
              editable={room.canSend}
              maxLength={2000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              style={[
                styles.input,
                isInputFocused && styles.inputFocused,
                !room.canSend && styles.inputDisabled,
              ]}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="쪽지 보내기"
              disabled={!canSubmit}
              onPress={sendMessage}
              style={[
                styles.sendButton,
                !canSubmit && styles.sendButtonDisabled,
              ]}
            >
              <View style={styles.sendBackground}>
                <AppIcon name="sendButton" size={36} />
              </View>
              <AppIcon name="airplane" size={32} />
            </Pressable>
          </View>
        </>
      )}

      <ConfirmModal
        open={isLeaveModalOpen}
        tone="orange"
        title="쪽지창을 나갈까요?"
        description={
          "나가기를 하면 대화 내용이 모두\n쪽지함 목록에서도 삭제돼요."
        }
        confirmLabel={
          leaveMutation.isPending ? "나가는 중..." : "나가기"
        }
        confirmDisabled={leaveMutation.isPending}
        onCancel={() => setIsLeaveModalOpen(false)}
        onConfirm={() => void leaveRoom()}
      />
    </Screen>
  );
}

function DateDivider({
  value,
}: {
  value: string;
}) {
  const label = formatMessageDate(value);

  if (!label) {
    return null;
  }

  return (
    <View style={styles.dateDivider}>
      <Text style={styles.dateText}>{label}</Text>
    </View>
  );
}

function MessageBubble({
  message,
  senderName,
  profileImageUrl,
  showTime,
}: {
  message: LocalChatMessage;
  senderName: string;
  profileImageUrl?: string | null;
  showTime: boolean;
}) {
  if (message.isMine) {
    return (
      <View style={styles.mineRow}>
        <View style={styles.mineMessageWrap}>
          {!message.isRead || showTime || message.pending ? (
            <View style={styles.mineSideMeta}>
              {!message.isRead ? (
                <Text
                  accessibilityLabel="상대방이 읽지 않음"
                  style={styles.unreadMarker}
                >
                  1
                </Text>
              ) : null}
              {showTime ? (
                <Text style={styles.messageTime}>
                  {formatMessageTime(message.createdAt)}
                </Text>
              ) : null}
              {message.pending ? (
                <Text style={styles.messageTime}>전송 중</Text>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.messageBubble, styles.mineBubble]}>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.receivedRow}>
      <ProfileImage imageUrl={profileImageUrl} size={35} variant="band" />

      <View style={styles.receivedContent}>
        <Text style={styles.senderName}>{senderName}</Text>
        <View style={styles.receivedBubbleRow}>
          <View style={[styles.messageBubble, styles.receivedBubble]}>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
          {showTime ? (
            <Text style={[styles.messageTime, styles.receivedTime]}>
              {formatMessageTime(message.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 15,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  retryText: {
    ...textStyles.caption2,
    color: colors.white,
  },
  connectionRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 15,
  },
  connectionText: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.neutral500,
  },
  reconnectText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  messageList: {
    flex: 1,
  },
  messages: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 24,
  },
  messageGap: {
    marginTop: 22,
  },
  firstDate: {
    paddingTop: 4,
  },
  dateSpacing: {
    marginBottom: 22,
  },
  afterDate: {
    marginTop: 20,
  },
  dateDivider: {
    alignItems: "center",
    paddingTop: 4,
  },
  dateText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  mineRow: {
    alignItems: "flex-end",
  },
  receivedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  mineMessageWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
  },
  mineSideMeta: {
    alignItems: "flex-end",
    marginBottom: 1,
  },
  receivedContent: {
    flex: 1,
    minWidth: 0,
  },
  receivedBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: 208,
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 16,
  },
  mineBubble: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    backgroundColor: colors.secondary100,
  },
  receivedBubble: {
    borderWidth: 1,
    borderColor: colors.neutral500,
    backgroundColor: colors.white,
  },
  senderName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  messageText: {
    ...textStyles.body3,
    color: colors.neutral900,
  },
  messageTime: {
    ...textStyles.caption4,
    color: colors.neutral500,
  },
  receivedTime: {
    marginBottom: 1,
  },
  unreadMarker: {
    color: colors.secondary500,
    fontSize: 9,
    fontWeight: "500",
    lineHeight: 10,
  },
  composer: {
    height: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  input: {
    height: 36,
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 999,
    backgroundColor: colors.white,
    color: colors.neutral900,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingHorizontal: 24,
    paddingVertical: 0,
  },
  inputFocused: {
    borderColor: colors.secondary500,
  },
  inputDisabled: {
    backgroundColor: colors.neutral100,
    color: colors.neutral400,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBackground: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
