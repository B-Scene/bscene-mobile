import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    useAudioPlayer,
} from "expo-audio";

import {
    Radio,
    Wifi,
    WifiOff
} from "lucide-react-native";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Alert,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    resolveLiveMediaUrl,
} from "@/api/live/live";

import {
    useAcceptCoHostUpgradeMutation,
    useCloseLiveMutation,
    useEnterLiveMutation,
    useLeaveLiveMutation,
    useRequestCoHostUpgradeMutation,
    useRespondCoHostInvitationMutation,
} from "@/hooks/api/live/useLive";

import {
    useLiveChatSocket,
} from "@/hooks/api/live/useLiveChatSocket";

import {
    startWhepPlayback,
    startWhipBroadcast,
    type LiveRtcHandle,
} from "@/shared/services/liveRtc";

import {
    secureTokenStorage,
} from "@/shared/utils/secureTokenStorage";

import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
    spacing,
} from "@/shared/constants/theme";

import {
    useAuthStore,
} from "@/stores/useAuthStore";

import type {
    EnterLiveResponse,
    LiveChatMessage,
} from "@/types/live/live";

const parseId = (
  value?: string | string[],
) => {
  const raw =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number(raw);

  return Number.isFinite(
    parsed,
  ) && parsed > 0
    ? parsed
    : 0;
};

export function LiveRoomScreen({
  mode,
}: {
  mode: "fan" | "band";
}) {
  const params =
    useLocalSearchParams<{
      liveId?: string;

      requesterUserId?: string;

      coHostInvite?: string;
    }>();

  const liveId =
    parseId(
      params.liveId,
    );

  const requesterUserId =
    parseId(
      params.requesterUserId,
    );

  const enterMutation =
    useEnterLiveMutation();

  const leaveMutation =
    useLeaveLiveMutation();

  const closeMutation =
    useCloseLiveMutation();

  const requestCoHostMutation =
    useRequestCoHostUpgradeMutation();

  const acceptCoHostMutation =
    useAcceptCoHostUpgradeMutation();

  const respondInviteMutation =
    useRespondCoHostInvitationMutation();

  const currentUserId =
    useAuthStore(
      (state) =>
        state.user?.userId ??
        null,
    );

  const [live, setLive] =
    useState<EnterLiveResponse | null>(
      null,
    );

  const [
    messages,
    setMessages,
  ] =
    useState<LiveChatMessage[]>(
      [],
    );

  const [
    messageText,
    setMessageText,
  ] = useState("");

  const [
    mediaError,
    setMediaError,
  ] = useState("");

  const [
    mediaConnected,
    setMediaConnected,
  ] = useState(false);

  const rtcRef =
    useRef<LiveRtcHandle | null>(
      null,
    );

  const audioPlayer =
    useAudioPlayer(null);

  const hasEnteredRef =
    useRef(false);

  useEffect(() => {
    if (
      !liveId ||
      hasEnteredRef.current
    ) {
      return;
    }

    hasEnteredRef.current =
      true;

    void (async () => {
      try {
        const result =
          await enterMutation.mutateAsync(
            liveId,
          );

        setLive(result);
      } catch {
        Alert.alert(
          "라이브",
          "라이브에 입장하지 못했어요.",
          [
            {
              text: "확인",

              onPress: () =>
                router.back(),
            },
          ],
        );
      }
    })();
  }, [
    enterMutation,
    liveId,
  ]);

  useEffect(() => {
    if (!live) {
      return;
    }

    let active = true;

    const connectMedia =
      async () => {
        setMediaError("");

        try {
          const playback =
            live.playback;

          if (
            playback.protocol ===
            "HLS"
          ) {
            const token =
              await secureTokenStorage.getAccessToken();

            if (!token) {
              throw new Error(
                "로그인이 필요합니다.",
              );
            }

            audioPlayer.replace({
              uri:
                resolveLiveMediaUrl(
                  playback.playbackUrl,
                ),

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            });

            audioPlayer.play();

            if (active) {
              setMediaConnected(
                true,
              );
            }

            return;
          }

          if (
            playback.protocol ===
            "WHIP"
          ) {
            const handle =
              await startWhipBroadcast(
                playback.playbackUrl,
              );

            if (!active) {
              await handle.close();

              return;
            }

            rtcRef.current =
              handle;

            setMediaConnected(
              true,
            );

            return;
          }

          if (
            playback.protocol ===
            "WHEP"
          ) {
            const handle =
              await startWhepPlayback(
                playback.playbackUrl,
              );

            if (!active) {
              await handle.close();

              return;
            }

            rtcRef.current =
              handle;

            setMediaConnected(
              true,
            );
          }
        } catch (error) {
          if (!active) {
            return;
          }

          setMediaError(
            error instanceof Error
              ? error.message
              : "라이브 오디오 연결에 실패했어요.",
          );
        }
      };

    void connectMedia();

    return () => {
      active = false;

      audioPlayer.pause();

      const rtc =
        rtcRef.current;

      rtcRef.current =
        null;

      if (rtc) {
        void rtc.close();
      }

      setMediaConnected(
        false,
      );
    };
  }, [
    audioPlayer,
    live,
  ]);

  const chat =
    useLiveChatSocket({
      liveId:
        live?.liveId ??
        null,

      enabled:
        Boolean(
          live?.liveId,
        ),

      onMessage: (
        message,
      ) => {
        setMessages(
          (previous) => {
            if (
              previous.some(
                (item) =>
                  item.messageId ===
                  message.messageId,
              )
            ) {
              return previous;
            }

            return [
              ...previous,
              message,
            ].slice(-100);
          },
        );
      },

      onEnded: () => {
        Alert.alert(
          "라이브 종료",
          "라이브가 종료되었어요.",
          [
            {
              text: "확인",
              onPress: () =>
                router.replace(
                  `/${mode}/live` as Parameters<
                    typeof router.replace
                  >[0],
                ),
            },
          ],
        );
      },
    });

  const isOwner =
    live?.isBroadcaster ===
      true ||
    live?.playback.role ===
      "BROADCASTER";

  const canRequestCoHost =
    mode === "band" &&
    live?.playback.role ===
      "LISTENER";

  const sendMessage =
    () => {
      if (
        chat.sendMessage(
          messageText,
        )
      ) {
        setMessageText("");
      }
    };

  const exitLive =
    async () => {
      if (!liveId) {
        router.back();

        return;
      }

      try {
        if (isOwner) {
          await closeMutation.mutateAsync(
            liveId,
          );
        } else {
          await leaveMutation.mutateAsync(
            liveId,
          );
        }
      } catch {
        // 서버 종료 실패 시에도 사용자 이동은 허용
      }

      const rtc =
        rtcRef.current;

      rtcRef.current =
        null;

      if (rtc) {
        await rtc.close();
      }

      audioPlayer.pause();

      router.replace(
        `/${mode}/live` as Parameters<
          typeof router.replace
        >[0],
      );
    };

  const requestCoHost =
    async () => {
      try {
        await requestCoHostMutation.mutateAsync(
          liveId,
        );

        Alert.alert(
          "공동 진행 요청",
          "방장에게 공동 진행 요청을 보냈어요.",
        );
      } catch {
        Alert.alert(
          "공동 진행 요청",
          "요청을 보내지 못했어요.",
        );
      }
    };

  const acceptRequester =
    async () => {
      if (
        !requesterUserId
      ) {
        return;
      }

      try {
        await acceptCoHostMutation.mutateAsync(
          {
            liveId,
            userId:
              requesterUserId,
          },
        );

        Alert.alert(
          "공동 진행",
          "공동 진행 요청을 수락했어요.",
        );
      } catch {
        Alert.alert(
          "공동 진행",
          "공동 진행 요청을 처리하지 못했어요.",
        );
      }
    };

  const respondInvite =
    async (
      accepted: boolean,
    ) => {
      try {
        await respondInviteMutation.mutateAsync(
          {
            liveId,
            isAccepted:
              accepted,
          },
        );

        if (accepted) {
          const result =
            await enterMutation.mutateAsync(
              liveId,
            );

          setLive(result);
        }
      } catch {
        Alert.alert(
          "공동 진행 초대",
          "초대를 처리하지 못했어요.",
        );
      }
    };

  const sortedMessages =
    useMemo(
      () =>
        [...messages].sort(
          (a, b) =>
            new Date(
              a.sentAt,
            ).getTime() -
            new Date(
              b.sentAt,
            ).getTime(),
        ),
      [messages],
    );

  if (
    enterMutation.isPending &&
    !live
  ) {
    return (
      <Screen>
        <AppHeader title="라이브" />

        <AppState
          loading
          title="라이브에 입장하는 중이에요"
        />
      </Screen>
    );
  }

  if (!live) {
    return (
      <Screen>
        <AppHeader title="라이브" />

        <AppState
          title="라이브 정보를 불러오지 못했어요"
        />
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title="라이브"
      />

      <AppCard
        style={
          styles.hero
        }
      >
        <View
          style={
            styles.liveHeader
          }
        >
          <Badge
            label="LIVE"
            tone="pink"
          />

          <View
            style={
              styles.connection
            }
          >
            {mediaConnected ? (
              <Wifi
                size={16}
                color={
                  colors.primary600
                }
              />
            ) : (
              <WifiOff
                size={16}
                color={
                  colors.error
                }
              />
            )}

            <Text
              style={styles.meta}
            >
              {mediaConnected
                ? "오디오 연결됨"
                : "오디오 연결 중"}
            </Text>
          </View>
        </View>

        <Avatar
          imageUrl={
            live.bandProfileImageUrl
          }
          label={
            live.bandName
          }
          size={72}
        />

        <Text
          style={styles.title}
        >
          {live.title}
        </Text>

        <Text
          style={styles.bandName}
        >
          {live.bandName}
        </Text>

        {live.description ? (
          <Text
            style={
              styles.description
            }
          >
            {
              live.description
            }
          </Text>
        ) : null}

        <Text
          style={styles.meta}
        >
          {live.viewerCount ??
            live.viewCount ??
            0}
          명 시청 중 ·{" "}
          {live.playback.role} ·{" "}
          {
            live.playback
              .protocol
          }
        </Text>

        {mediaError ? (
          <Text
            style={
              styles.error
            }
          >
            {mediaError}
          </Text>
        ) : null}
      </AppCard>

      {requesterUserId >
      0 ? (
        <AppCard
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            공동 진행 요청
          </Text>

          <Text
            style={
              styles.description
            }
          >
            공동 진행 요청이
            도착했어요.
          </Text>

          <AppButton
            label="공동 진행 수락"
            loading={
              acceptCoHostMutation.isPending
            }
            onPress={() =>
              void acceptRequester()
            }
          />
        </AppCard>
      ) : null}

      {params.coHostInvite ===
      "1" ? (
        <AppCard
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            공동 진행 초대
          </Text>

          <View
            style={
              styles.row
            }
          >
            <AppButton
              label="거절"
              variant="secondary"
              style={
                styles.rowButton
              }
              onPress={() =>
                void respondInvite(
                  false,
                )
              }
            />

            <AppButton
              label="수락"
              style={
                styles.rowButton
              }
              onPress={() =>
                void respondInvite(
                  true,
                )
              }
            />
          </View>
        </AppCard>
      ) : null}

      {canRequestCoHost ? (
        <AppButton
          label="공동 진행 요청"
          variant="secondary"
          loading={
            requestCoHostMutation.isPending
          }
          onPress={() =>
            void requestCoHost()
          }
        />
      ) : null}

      <AppCard
        style={
          styles.section
        }
      >
        <View
          style={
            styles.chatHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            실시간 채팅
          </Text>

          <View
            style={
              styles.connection
            }
          >
            {chat.isConnected ? (
              <Radio
                size={15}
                color={
                  colors.primary600
                }
              />
            ) : null}

            <Text
              style={styles.meta}
            >
              {chat.isConnected
                ? "연결됨"
                : "연결 중"}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.messages
          }
        >
          {sortedMessages.length ===
          0 ? (
            <Text
              style={styles.meta}
            >
              아직 채팅이 없어요.
            </Text>
          ) : (
            sortedMessages.map(
              (message) => {
                const isMine =
                  currentUserId !=
                    null &&
                  message.senderId ===
                    currentUserId;

                return (
                  <View
                    key={
                      message.messageId
                    }
                    style={[
                      styles.message,

                      isMine &&
                        styles.myMessage,
                    ]}
                  >
                    <Text
                      style={
                        styles.messageName
                      }
                    >
                      {
                        message.senderName
                      }
                    </Text>

                    <Text
                      style={
                        styles.messageBody
                      }
                    >
                      {
                        message.content
                      }
                    </Text>
                  </View>
                );
              },
            )
          )}
        </View>

        <AppTextInput
          label="채팅"
          value={
            messageText
          }
          maxLength={500}
          placeholder="메시지를 입력하세요"
          onChangeText={
            setMessageText
          }
          onSubmitEditing={
            sendMessage
          }
        />

        <AppButton
          label="전송"
          onPress={
            sendMessage
          }
        />

        {chat.lastError ? (
          <Text
            style={
              styles.error
            }
          >
            {chat.lastError}
          </Text>
        ) : null}
      </AppCard>

      <AppButton
        label={
          isOwner
            ? "라이브 종료"
            : "나가기"
        }
        variant="secondary"
        loading={
          leaveMutation.isPending ||
          closeMutation.isPending
        }
        onPress={() => {
          Alert.alert(
            isOwner
              ? "라이브 종료"
              : "라이브 나가기",

            isOwner
              ? "라이브를 종료할까요?"
              : "라이브에서 나갈까요?",

            [
              {
                text: "취소",
                style: "cancel",
              },

              {
                text:
                  isOwner
                    ? "종료"
                    : "나가기",

                style:
                  "destructive",

                onPress: () =>
                  void exitLive(),
              },
            ],
          );
        }}
      />
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
      paddingBottom:
        spacing.xxl,
    },

    hero: {
      alignItems: "center",
      gap: spacing.md,
    },

    liveHeader: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    connection: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },

    title: {
      color:
        colors.neutral900,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center",
    },

    bandName: {
      color:
        colors.neutral800,
      fontSize: 15,
      fontWeight: "800",
    },

    description: {
      color:
        colors.neutral700,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },

    meta: {
      color:
        colors.neutral500,
      fontSize: 11,
    },

    error: {
      color:
        colors.error,
      fontSize: 12,
      lineHeight: 18,
    },

    section: {
      gap: spacing.md,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 17,
      fontWeight: "900",
    },

    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },

    rowButton: {
      flex: 1,
    },

    chatHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
    },

    messages: {
      gap: spacing.sm,
    },

    message: {
      alignSelf:
        "flex-start",
      maxWidth: "85%",
      gap: spacing.xs,
      padding:
        spacing.md,
      borderRadius: 12,
      backgroundColor:
        colors.neutral200,
    },

    myMessage: {
      alignSelf:
        "flex-end",
      backgroundColor:
        colors.primary100,
    },

    messageName: {
      color:
        colors.neutral600,
      fontSize: 11,
      fontWeight: "800",
    },

    messageBody: {
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 19,
    },
  });