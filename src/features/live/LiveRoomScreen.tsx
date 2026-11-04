import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    isAxiosError,
} from "axios";

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
    useCallback,
} from "react";

import {
    Alert,
    BackHandler,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    enterLive,
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
    useCoPublisherPlayback,
} from "@/hooks/api/live/useCoPublisherPlayback";

import {
    useLiveChatSocket,
} from "@/hooks/api/live/useLiveChatSocket";

import {
    useLiveEvents,
} from "@/hooks/api/live/useLiveEvents";

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
    LiveCoHostRequester,
    LiveCoPublisher,
} from "@/types/live/live";

const RTC_RETRY_DELAY_MS =
  3000;

const MAX_RTC_RETRY_ATTEMPTS =
  5;

const CO_HOST_APPROVAL_POLL_MS =
  3000;

const getApiErrorCode = (
  error: unknown,
) =>
  isAxiosError<{
    code?: string;
  }>(error)
    ? error.response?.data
        ?.code
    : undefined;

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
    coPublishers,
    setCoPublishers,
  ] =
    useState<LiveCoPublisher[]>(
      [],
    );

  const [
    viewerCount,
    setViewerCount,
  ] =
    useState<number | null>(
      null,
    );

  const [
    coHostRequests,
    setCoHostRequests,
  ] =
    useState<LiveCoHostRequester[]>(
      [],
    );

  const [
    isDeepLinkRequestHandled,
    setIsDeepLinkRequestHandled,
  ] = useState(false);

  const [
    isAwaitingCoHostApproval,
    setIsAwaitingCoHostApproval,
  ] = useState(false);

  const [
    isInvitePending,
    setIsInvitePending,
  ] = useState(
    params.coHostInvite ===
      "1",
  );

  const isEnteringAsCoHostRef =
    useRef(false);

  const applyLive =
    useCallback(
      (
        result: EnterLiveResponse,
      ) => {
        setLive(result);

        setCoPublishers(
          result.coPublishers ??
            [],
        );
      },
      [],
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

  const [
    isMicMuted,
    setIsMicMuted,
  ] = useState(true);

  const isMicMutedRef =
    useRef(true);

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
      hasEnteredRef.current ||
      isInvitePending
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

        applyLive(result);
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
    applyLive,
    enterMutation,
    isInvitePending,
    liveId,
  ]);

  useEffect(() => {
    if (!live) {
      return;
    }

    let active = true;

    let isFirstConnect = true;

    let retryAttempts = 0;

    let retryTimer:
      | ReturnType<
          typeof setTimeout
        >
      | null = null;

    const scheduleRetry =
      () => {
        if (
          !active ||
          retryTimer
        ) {
          return;
        }

        if (
          retryAttempts >=
          MAX_RTC_RETRY_ATTEMPTS
        ) {
          setMediaError(
            "라이브 오디오 연결에 실패했어요. 나갔다가 다시 입장해 주세요.",
          );

          return;
        }

        retryAttempts += 1;

        setMediaError(
          "오디오 연결이 끊겨 다시 연결하고 있어요.",
        );

        retryTimer =
          setTimeout(() => {
            retryTimer = null;

            void connectMedia();
          }, RTC_RETRY_DELAY_MS);
      };

    const handleConnectionLost =
      () => {
        if (!active) {
          return;
        }

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

        scheduleRetry();
      };

    const connectMedia =
      async () => {
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
              setMediaError("");

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
                {
                  onConnectionLost:
                    handleConnectionLost,
                },
              );

            if (!active) {
              await handle.close();

              return;
            }

            rtcRef.current =
              handle;

            if (isFirstConnect) {
              isMicMutedRef.current =
                true;

              setIsMicMuted(
                true,
              );
            } else {
              handle.setMicEnabled(
                !isMicMutedRef.current,
              );
            }

            isFirstConnect = false;

            retryAttempts = 0;

            setMediaError("");

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
                {
                  onConnectionLost:
                    handleConnectionLost,
                },
              );

            if (!active) {
              await handle.close();

              return;
            }

            rtcRef.current =
              handle;

            isFirstConnect = false;

            retryAttempts = 0;

            setMediaError("");

            setMediaConnected(
              true,
            );
          }
        } catch (error) {
          if (!active) {
            return;
          }

          if (retryAttempts > 0) {
            scheduleRetry();

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

      if (retryTimer) {
        clearTimeout(
          retryTimer,
        );

        retryTimer = null;
      }

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

  const isBroadcastProtocol =
    live?.playback.protocol ===
    "WHIP";

  const canBroadcast =
    isOwner ||
    live?.playback.role ===
      "CO_HOST";

  const otherCoPublishers =
    useMemo(
      () =>
        coPublishers.filter(
          (publisher) =>
            publisher.userId !==
              currentUserId &&
            Boolean(
              publisher.whepUrl?.trim(),
            ),
        ),
      [
        coPublishers,
        currentUserId,
      ],
    );

  const handleCoHostRequested =
    useCallback(
      (
        requester: LiveCoHostRequester | null,
      ) => {
        if (!requester) {
          Alert.alert(
            "공동 진행 요청",
            "공동 진행 요청이 도착했지만 요청자 정보를 확인할 수 없어요. 알림에서 확인해 주세요.",
          );

          return;
        }

        setCoHostRequests(
          (previous) =>
            previous.some(
              (item) =>
                item.userId ===
                requester.userId,
            )
              ? previous
              : [
                  ...previous,
                  requester,
                ],
        );
      },
      [],
    );

  const enterAsCoHost =
    useCallback(async () => {
      if (
        !liveId ||
        isEnteringAsCoHostRef.current
      ) {
        return false;
      }

      isEnteringAsCoHostRef.current =
        true;

      try {
        const result =
          await enterLive(
            liveId,
          );

        if (
          result.playback.role !==
            "CO_HOST" ||
          result.playback.protocol !==
            "WHIP" ||
          !result.playback.playbackUrl
        ) {
          return false;
        }

        setIsAwaitingCoHostApproval(
          false,
        );

        applyLive(result);

        return true;
      } finally {
        isEnteringAsCoHostRef.current =
          false;
      }
    }, [
      applyLive,
      liveId,
    ]);

  useLiveEvents({
    liveId:
      live?.liveId ??
      null,

    enabled:
      Boolean(
        live?.liveId,
      ),

    onViewerCount:
      setViewerCount,

    onCoPublishersChanged:
      setCoPublishers,

    onCoHostUpgradeRequested:
      handleCoHostRequested,

    onCoHostUpgradeAccepted:
      () => {
        if (
          isAwaitingCoHostApproval
        ) {
          void enterAsCoHost().catch(
            () => {},
          );
        }
      },
  });

  useCoPublisherPlayback({
    enabled:
      canBroadcast &&
      mediaConnected,

    publishers:
      otherCoPublishers,
  });

  useEffect(() => {
    if (
      !isAwaitingCoHostApproval
    ) {
      return;
    }

    let cancelled = false;

    let pollTimer:
      | ReturnType<
          typeof setTimeout
        >
      | null = null;

    const checkApproval =
      async () => {
        try {
          if (
            await enterAsCoHost()
          ) {
            return;
          }
        } catch {
          // 방장이 승인하기 전에는 입장 API가 실패할 수 있다.
        }

        if (!cancelled) {
          pollTimer =
            setTimeout(() => {
              void checkApproval();
            }, CO_HOST_APPROVAL_POLL_MS);
        }
      };

    pollTimer =
      setTimeout(() => {
        void checkApproval();
      }, CO_HOST_APPROVAL_POLL_MS);

    return () => {
      cancelled = true;

      if (pollTimer) {
        clearTimeout(
          pollTimer,
        );
      }
    };
  }, [
    enterAsCoHost,
    isAwaitingCoHostApproval,
  ]);

  const currentCoHostRequest:
    | LiveCoHostRequester
    | null =
    !isOwner
      ? null
      : (coHostRequests[0] ??
        (requesterUserId > 0 &&
        !isDeepLinkRequestHandled
          ? {
              userId:
                requesterUserId,
              nickname: null,
            }
          : null));

  const dismissCoHostRequest =
    (userId: number) => {
      setCoHostRequests(
        (previous) =>
          previous.filter(
            (item) =>
              item.userId !==
              userId,
          ),
      );

      if (
        userId ===
        requesterUserId
      ) {
        setIsDeepLinkRequestHandled(
          true,
        );
      }
    };

  const toggleMic = () => {
    const rtc =
      rtcRef.current;

    if (
      !rtc ||
      !mediaConnected
    ) {
      return;
    }

    const nextMuted =
      !isMicMuted;

    rtc.setMicEnabled(
      !nextMuted,
    );

    isMicMutedRef.current =
      nextMuted;

    setIsMicMuted(
      nextMuted,
    );
  };

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
    useCallback(async () => {
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
    }, [
      audioPlayer,
      closeMutation,
      isOwner,
      leaveMutation,
      liveId,
      mode,
    ]);

  const confirmExitLive =
    useCallback(() => {
      if (
        leaveMutation.isPending ||
        closeMutation.isPending
      ) {
        return;
      }

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
    }, [
      closeMutation.isPending,
      exitLive,
      isOwner,
      leaveMutation.isPending,
    ]);

  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (!live) {
            return false;
          }

          confirmExitLive();
          return true;
        },
      );

    return () => {
      subscription.remove();
    };
  }, [
    confirmExitLive,
    live,
  ]);

  const requestCoHost =
    async () => {
      try {
        await requestCoHostMutation.mutateAsync(
          liveId,
        );

        setIsAwaitingCoHostApproval(
          true,
        );

        Alert.alert(
          "공동 진행 요청",
          "방장에게 공동 진행 요청을 보냈어요. 승인되면 자동으로 송출로 전환돼요.",
        );
      } catch (error) {
        if (
          getApiErrorCode(
            error,
          ) === "LIVE409_8"
        ) {
          setIsAwaitingCoHostApproval(
            true,
          );

          Alert.alert(
            "공동 진행 요청",
            "이미 승인을 기다리는 요청이 있어요.",
          );

          return;
        }

        Alert.alert(
          "공동 진행 요청",
          "요청을 보내지 못했어요.",
        );
      }
    };

  const acceptRequester =
    async () => {
      if (
        !currentCoHostRequest
      ) {
        return;
      }

      try {
        await acceptCoHostMutation.mutateAsync(
          {
            liveId,
            userId:
              currentCoHostRequest.userId,
          },
        );

        dismissCoHostRequest(
          currentCoHostRequest.userId,
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
      } catch (error) {
        if (
          getApiErrorCode(
            error,
          ) !== "LIVE409_7"
        ) {
          Alert.alert(
            "공동 진행 초대",
            "초대를 처리하지 못했어요.",
          );

          return;
        }
      }

      if (!accepted) {
        router.back();

        return;
      }

      hasEnteredRef.current =
        true;

      try {
        const result =
          await enterMutation.mutateAsync(
            liveId,
          );

        applyLive(result);

        setIsInvitePending(
          false,
        );
      } catch {
        Alert.alert(
          "공동 진행 초대",
          "초대를 수락했어요. 라이브가 시작되면 입장 버튼으로 참여할 수 있어요.",
          [
            {
              text: "확인",

              onPress: () =>
                router.back(),
            },
          ],
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

  if (isInvitePending) {
    return (
      <Screen
        contentStyle={
          styles.container
        }
      >
        <AppHeader title="라이브" />

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

          <Text
            style={
              styles.description
            }
          >
            이 라이브의 공동 진행자로
            초대받았어요.
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
              loading={
                respondInviteMutation.isPending ||
                enterMutation.isPending
              }
              onPress={() =>
                void respondInvite(
                  true,
                )
              }
            />
          </View>
        </AppCard>
      </Screen>
    );
  }

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
          {viewerCount ??
            live.viewerCount ??
            live.viewCount ??
            0}
          명 시청 중 ·{" "}
          {live.playback.role} ·{" "}
          {
            live.playback
              .protocol
          }
        </Text>

        {otherCoPublishers.length >
        0 ? (
          <Text
            style={styles.meta}
          >
            공동 진행{" "}
            {
              otherCoPublishers.length
            }
            명 참여 중
          </Text>
        ) : null}

        {mediaError ? (
          <Text
            style={
              styles.error
            }
          >
            {mediaError}
          </Text>
        ) : null}

        {isBroadcastProtocol ? (
          <View
            style={
              styles.micControl
            }
          >
            <AppButton
              label={
                mediaConnected
                  ? isMicMuted
                    ? "마이크 켜기"
                    : "마이크 끄기"
                  : "마이크 연결 중"
              }
              variant={
                isMicMuted
                  ? "primary"
                  : "secondary"
              }
              disabled={
                !mediaConnected
              }
              onPress={
                toggleMic
              }
            />

            {mediaConnected &&
            isMicMuted ? (
              <Text
                style={
                  styles.micHint
                }
              >
                마이크가 음소거됐어요.
                다시 누르면 송출돼요.
              </Text>
            ) : null}
          </View>
        ) : null}
      </AppCard>

      {currentCoHostRequest ? (
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
            {currentCoHostRequest.nickname
              ? `${currentCoHostRequest.nickname}님의 `
              : ""}
            공동 진행 요청이
            도착했어요.
          </Text>

          <View
            style={
              styles.row
            }
          >
            <AppButton
              label="닫기"
              variant="secondary"
              style={
                styles.rowButton
              }
              onPress={() =>
                dismissCoHostRequest(
                  currentCoHostRequest.userId,
                )
              }
            />

            <AppButton
              label="공동 진행 수락"
              style={
                styles.rowButton
              }
              loading={
                acceptCoHostMutation.isPending
              }
              onPress={() =>
                void acceptRequester()
              }
            />
          </View>
        </AppCard>
      ) : null}

      {canRequestCoHost ? (
        <AppButton
          label={
            isAwaitingCoHostApproval
              ? "공동 진행 승인 대기 중"
              : "공동 진행 요청"
          }
          variant="secondary"
          disabled={
            isAwaitingCoHostApproval
          }
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
        onPress={confirmExitLive}
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

    micControl: {
      width: "100%",
      gap: spacing.xs,
    },

    micHint: {
      color:
        colors.neutral500,
      fontSize: 11,
      textAlign: "center",
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
