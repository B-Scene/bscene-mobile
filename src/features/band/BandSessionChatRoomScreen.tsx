import { useQueryClient } from "@tanstack/react-query";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  Send,
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
          <View style={styles.opponentCard}>
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
              <Text style={styles.closedBadge}>대화 종료</Text>
            ) : null}
          </View>

          <View
            style={
              styles.connectionRow
            }
          >
            <View
              style={[
                styles.connectionDot,
                socket.isConnected
                  ? styles.connectionDotOn
                  : styles.connectionDotOff,
              ]}
            />

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
  if (message.isMine) {
    return (
      <View style={[styles.messageRow, styles.mineRow]}>
        <View style={styles.mineMessageWrap}>
          <View style={styles.mineSideMeta}>
            {!message.isRead ? (
              <Text style={styles.unreadMarker}>1</Text>
            ) : null}
            <Text style={styles.messageTime}>
              {formatMessageTime(message.createdAt)}
            </Text>
            {message.pending ? (
              <Text style={styles.pendingText}>전송 중</Text>
            ) : null}
          </View>

          <View style={[styles.messageBubble, styles.mineBubble]}>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageRow,
        styles.receivedRow,
      ]}
    >
      <Avatar
        imageUrl={null}
        label={message.senderName}
        size={35}
      />

      <View style={styles.receivedContent}>
        <Text style={styles.senderName}>{message.senderName}</Text>
        <View style={styles.receivedBubbleRow}>
          <View style={[styles.messageBubble, styles.receivedBubble]}>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
          <Text style={styles.messageTime}>
            {formatMessageTime(message.createdAt)}
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
      gap: 0,
      paddingBottom: 0,
      paddingHorizontal: 0,
      backgroundColor: colors.white,
    },

    leaveText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: "800",
    },

    opponentCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 17,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.neutral300,
    },

    opponentInfo: {
      flex: 1,
      gap: 2,
    },

    opponentName: {
      color: colors.neutral900,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },

    opponentMeta: {
      color: colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    closedBadge: {
      height: 22,
      borderRadius: 999,
      backgroundColor: colors.neutral300,
      color: colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 22,
      paddingHorizontal: 12,
    },

    connectionRow: {
      minHeight: 30,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },

    connectionText: {
      color: colors.neutral500,
      fontSize: 11,
      fontWeight: "500",
    },

    connectionDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    connectionDotOn: {
      backgroundColor: colors.secondary500,
    },

    connectionDotOff: {
      backgroundColor: colors.neutral400,
    },

    connectedText: {
      color: colors.secondary600,
    },

    reconnectText: {
      color: colors.secondary600,
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
        12,
      paddingHorizontal: 17,
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
      marginVertical: 4,
    },

    dateText: {
      color: colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    messageRow: {
      width: "100%",
      marginBottom:
        12,
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
      minWidth: 0,
      flex: 1,
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
      color: colors.neutral900,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },

    messageText: {
      color: colors.neutral900,
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 18,
    },

    messageTime: {
      color: colors.neutral500,
      fontSize: 8,
      fontWeight: "500",
      lineHeight: 10,
    },

    unreadMarker: {
      color: colors.secondary500,
      fontSize: 9,
      fontWeight: "500",
      lineHeight: 10,
    },

    pendingText: {
      color: colors.neutral500,
      fontSize: 8,
      fontWeight: "500",
      lineHeight: 10,
    },

    composer: {
      minHeight: 65,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor:
        colors.white,
      paddingHorizontal: 17,
      paddingTop: 12,
      paddingBottom: 17,
    },

    input: {
      flex: 1,
      height: 36,
      borderWidth: 1,
      borderColor: colors.neutral400,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.white,
      color: colors.neutral900,
      fontSize: 12,
      lineHeight: 18,
      paddingHorizontal: 18,
      paddingVertical: 0,
    },

    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        colors.secondary500,
    },

    sendButtonDisabled: {
      backgroundColor:
        colors.neutral400,
    },

    sendButtonPressed: {
      opacity: 0.8,
    },
  });
