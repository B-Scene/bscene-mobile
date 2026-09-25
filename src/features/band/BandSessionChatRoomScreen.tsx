import { useQueryClient } from "@tanstack/react-query";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  Send,
  Wifi,
  WifiOff,
} from "lucide-react-native";
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

import {
  sessionChatKeys,
  useChatRoomDetailQuery,
  useLeaveChatRoomMutation,
  useSessionDirectMessageSocket,
} from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  radius,
  spacing,
} from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  ChatMessageItem,
  DirectMessageData,
  DirectMessageErrorFrame,
  DirectMessageReadData,
} from "@/types/session/sessionChat";

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

        const pendingMessages =
          previousMessages.filter(
            (message) =>
              message.pending &&
              !serverIds.has(
                message.chatMessageId,
              ),
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

  const leaveRoom = () => {
    if (!room) {
      return;
    }

    Alert.alert(
      "쪽지창 나가기",
      "나가기를 하면 대화 내용이 쪽지함에서도 삭제될 수 있어요. 나갈까요?",
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
                socket.close();

                await leaveMutation.mutateAsync(
                  room.chatRoomId,
                );

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

  if (chatRoomId <= 0) {
    return (
      <Screen
        scroll={false}
        contentStyle={
          styles.container
        }
      >
        <AppHeader title="쪽지" />

        <AppState
          title="쪽지방 정보를 찾을 수 없어요"
          description="쪽지함으로 돌아가 다시 선택해 주세요."
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader
        title={
          room?.opponentName ?? "쪽지"
        }
        rightContent={
          room ? (
            <Pressable
              hitSlop={12}
              onPress={leaveRoom}
            >
              <Text
                style={
                  styles.leaveText
                }
              >
                나가기
              </Text>
            </Pressable>
          ) : null
        }
      />

      {query.isLoading ? (
        <AppState
          loading
          title="대화를 불러오는 중이에요"
        />
      ) : query.isError || !room ? (
        <AppState
          title="대화를 불러오지 못했어요"
          description="삭제된 대화이거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : (
        <>
          <View
            style={
              styles.opponentCard
            }
          >
            <Avatar
              imageUrl={
                room.opponentProfileImageUrl
              }
              label={
                room.opponentName
              }
              size={42}
            />

            <View
              style={
                styles.opponentInfo
              }
            >
              <Text
                style={
                  styles.opponentName
                }
              >
                {room.opponentName}
              </Text>

              <Text
                style={
                  styles.opponentMeta
                }
              >
                {[
                  room.part,
                  room.genre,
                  room.region,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            {!room.canSend ? (
              <Badge label="대화 종료" />
            ) : null}
          </View>

          <View
            style={
              styles.connectionRow
            }
          >
            {socket.isConnected ? (
              <Wifi
                size={14}
                color={
                  colors.primary500
                }
              />
            ) : (
              <WifiOff
                size={14}
                color={
                  colors.neutral500
                }
              />
            )}

            <Text
              style={[
                styles.connectionText,

                socket.isConnected &&
                  styles.connectedText,
              ]}
            >
              {socket.isConnected
                ? "실시간 연결됨"
                : socket.lastErrorMessage ||
                  "실시간 연결 중..."}
            </Text>

            {!socket.isConnected ? (
              <Pressable
                onPress={() =>
                  void socket.reconnect()
                }
              >
                <Text
                  style={
                    styles.reconnectText
                  }
                >
                  재연결
                </Text>
              </Pressable>
            ) : null}
          </View>

          {messages.length === 0 ? (
            <View
              style={
                styles.emptyMessages
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                아직 주고받은
                쪽지가 없어요
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                첫 메시지를
                보내보세요.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              style={styles.messageList}
              contentContainerStyle={
                styles.messages
              }
              keyExtractor={(
                item,
              ) =>
                item.clientMsgId ??
                String(
                  item.chatMessageId,
                )
              }
              renderItem={({
                item,
                index,
              }) => {
                const previous =
                  messages[index - 1];

                const showDate =
                  index === 0 ||
                  getDateKey(
                    previous.createdAt,
                  ) !==
                    getDateKey(
                      item.createdAt,
                    );

                return (
                  <>
                    {showDate ? (
                      <DateDivider
                        value={
                          item.createdAt
                        }
                      />
                    ) : null}

                    <MessageBubble
                      message={item}
                    />
                  </>
                );
              }}
            />
          )}

          <View
            style={
              styles.composer
            }
          >
            <TextInput
              value={messageInput}
              onChangeText={
                setMessageInput
              }
              placeholder={
                room.canSend
                  ? socket.isConnected
                    ? "메시지 입력하기"
                    : "서버 연결 중..."
                  : "현재 메시지를 보낼 수 없어요"
              }
              placeholderTextColor={
                colors.neutral500
              }
              editable={
                room.canSend
              }
              maxLength={2000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={
                sendMessage
              }
              style={
                styles.input
              }
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="쪽지 보내기"
              disabled={
                !room.canSend ||
                !socket.isConnected ||
                !messageInput.trim()
              }
              onPress={sendMessage}
              style={({
                pressed,
              }) => [
                styles.sendButton,

                (!room.canSend ||
                  !socket.isConnected ||
                  !messageInput.trim()) &&
                  styles.sendButtonDisabled,

                pressed &&
                  styles.sendButtonPressed,
              ]}
            >
              <Send
                size={19}
                color={colors.white}
              />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

function DateDivider({
  value,
}: {
  value: string;
}) {
  const label =
    formatMessageDate(value);

  if (!label) {
    return null;
  }

  return (
    <View
      style={
        styles.dateDivider
      }
    >
      <Text
        style={
          styles.dateText
        }
      >
        {label}
      </Text>
    </View>
  );
}

function MessageBubble({
  message,
}: {
  message: LocalChatMessage;
}) {
  return (
    <View
      style={[
        styles.messageRow,

        message.isMine
          ? styles.mineRow
          : styles.receivedRow,
      ]}
    >
      <View
        style={[
          styles.messageBubble,

          message.isMine
            ? styles.mineBubble
            : styles.receivedBubble,
        ]}
      >
        {!message.isMine ? (
          <Text
            style={
              styles.senderName
            }
          >
            {message.senderName}
          </Text>
        ) : null}

        <Text
          style={[
            styles.messageText,

            message.isMine &&
              styles.mineMessageText,
          ]}
        >
          {message.content}
        </Text>

        <View
          style={
            styles.messageMeta
          }
        >
          {message.isMine ? (
            <Text
              style={
                styles.mineMetaText
              }
            >
              {message.pending
                ? "전송 중"
                : message.isRead
                  ? "읽음"
                  : "안읽음"}
            </Text>
          ) : null}

          <Text
            style={[
              styles.messageTime,

              message.isMine &&
                styles.mineMetaText,
            ]}
          >
            {formatMessageTime(
              message.createdAt,
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.sm,
      paddingBottom: 0,
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
      paddingVertical:
        spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.neutral300,
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

    connectionRow: {
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },

    connectionText: {
      color: colors.neutral500,
      fontSize: 11,
    },

    connectedText: {
      color: colors.primary600,
    },

    reconnectText: {
      color: colors.primary600,
      fontSize: 11,
      fontWeight: "800",
      marginLeft: spacing.xs,
    },

    messageList: {
      flex: 1,
    },

    messages: {
      flexGrow: 1,
      paddingVertical:
        spacing.md,
    },

    emptyMessages: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },

    emptyTitle: {
      color: colors.neutral900,
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
    },

    emptyDescription: {
      color: colors.neutral600,
      fontSize: 13,
    },

    dateDivider: {
      alignItems: "center",
      marginVertical:
        spacing.md,
    },

    dateText: {
      color: colors.neutral500,
      fontSize: 11,
      backgroundColor:
        colors.neutral100,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.xs,
      borderRadius: radius.pill,
    },

    messageRow: {
      width: "100%",
      marginBottom:
        spacing.sm,
    },

    mineRow: {
      alignItems: "flex-end",
    },

    receivedRow: {
      alignItems: "flex-start",
    },

    messageBubble: {
      maxWidth: "82%",
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.sm,
      borderRadius: radius.md,
      gap: spacing.xs,
    },

    mineBubble: {
      backgroundColor:
        colors.primary500,
    },

    receivedBubble: {
      backgroundColor:
        colors.neutral200,
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

    messageTime: {
      color: colors.neutral500,
      fontSize: 10,
    },

    mineMetaText: {
      color: colors.primary50,
      fontSize: 10,
    },

    composer: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor:
        colors.neutral300,
      backgroundColor:
        colors.white,
      paddingVertical:
        spacing.sm,
    },

    input: {
      flex: 1,
      minHeight: 44,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.neutral100,
      color: colors.neutral900,
      fontSize: 14,
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.sm,
    },

    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.primary500,
    },

    sendButtonDisabled: {
      backgroundColor:
        colors.neutral400,
    },

    sendButtonPressed: {
      opacity: 0.8,
    },
  });