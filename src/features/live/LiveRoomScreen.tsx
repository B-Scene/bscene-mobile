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
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";

import {
    Alert,
    BackHandler,
    Pressable,
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

import {
    LiveRoomActionBar,
    LiveRoomBanner,
    LiveRoomChatList,
    LiveRoomComposer,
    LiveRoomHeader,
    LiveRoomMemberSheet,
    LiveRoomMicButton,
    LiveRoomPill,
    LiveRoomSoundIndicator,
    LiveRoomStage,
} from "@/features/live/LiveRoomParts";

import { AppHeader } from "@/shared/components/AppHeader";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
    shadows,
    textStyles,
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

  const [
    isExitConfirmOpen,
    setIsExitConfirmOpen,
  ] = useState(false);

  const [
    isCoHostModalOpen,
    setIsCoHostModalOpen,
  ] = useState(false);

  const [
    isComposerOpen,
    setIsComposerOpen,
  ] = useState(false);

  const [
    isMemberSheetOpen,
    setIsMemberSheetOpen,
  ] = useState(false);

  const confirmExitLive =
    useCallback(() => {
      if (
        leaveMutation.isPending ||
        closeMutation.isPending
      ) {
        return;
      }

      setIsExitConfirmOpen(
        true,
      );
    }, [
      closeMutation.isPending,
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
          styles.stateContainer
        }
      >
        <AppHeader
          title="라이브"
          style={styles.stateHeader}
        />

        <View style={styles.inviteCard}>
          <Text style={styles.inviteTitle}>
            공동 진행 초대
          </Text>

          <Text style={styles.inviteDescription}>
            이 라이브의 공동 진행자로
            초대받았어요.
          </Text>

          <View style={styles.inviteActions}>
            <Pressable
              accessibilityRole="button"
              style={[
                styles.inviteButton,
                styles.inviteReject,
              ]}
              onPress={() =>
                void respondInvite(
                  false,
                )
              }
            >
              <Text style={styles.inviteRejectText}>
                거절
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={
                respondInviteMutation.isPending ||
                enterMutation.isPending
              }
              style={[
                styles.inviteButton,
                styles.inviteAccept,
              ]}
              onPress={() =>
                void respondInvite(
                  true,
                )
              }
            >
              <Text style={styles.inviteAcceptText}>
                수락
              </Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  if (
    enterMutation.isPending &&
    !live
  ) {
    return (
      <Screen
        contentStyle={
          styles.stateContainer
        }
      >
        <AppHeader
          title="라이브"
          style={styles.stateHeader}
        />

        <Text style={styles.stateText}>
          라이브 방에 입장하는 중이에요.
        </Text>
      </Screen>
    );
  }

  if (!live) {
    return (
      <Screen
        contentStyle={
          styles.stateContainer
        }
      >
        <AppHeader
          title="라이브"
          style={styles.stateHeader}
        />

        <Text style={styles.stateText}>
          라이브 정보를 불러오지 못했어요.
        </Text>
      </Screen>
    );
  }

  const tone =
    mode;

  const isExitPending =
    leaveMutation.isPending ||
    closeMutation.isPending;

  const isAudioActive =
    isBroadcastProtocol
      ? mediaConnected &&
        !isMicMuted
      : mediaConnected;

  const coHostNickname =
    currentCoHostRequest?.nickname ??
    null;

  return (
    <Screen
      scroll={false}
      contentStyle={
        styles.container
      }
    >
      <LiveRoomHeader
        tone={tone}
        startedAt={live.startedAt}
        viewerCount={
          viewerCount ??
          live.viewerCount ??
          live.viewCount ??
          0
        }
        exitLabel={
          isOwner
            ? "라이브 종료"
            : "나가기"
        }
        exitDisabled={isExitPending}
        onExit={confirmExitLive}
      />

      {mediaError ? (
        <LiveRoomBanner
          message={mediaError}
          backgroundColor={
            tone === "band"
              ? colors.error
              : colors.primary400
          }
        />
      ) : null}

      {isBroadcastProtocol &&
      mediaConnected &&
      isMicMuted ? (
        <LiveRoomBanner
          message="마이크가 음소거됐어요. 다시 누르면 송출돼요."
          backgroundColor={
            colors.secondary500
          }
        />
      ) : null}

      {currentCoHostRequest ? (
        <LiveRoomPill
          label={
            coHostRequests.length > 1
              ? `공동 진행 요청 ${coHostRequests.length}건 확인`
              : coHostNickname
                ? `${coHostNickname}님의 요청 확인`
                : "공동 진행 요청 확인"
          }
          onPress={() =>
            setIsCoHostModalOpen(
              true,
            )
          }
        />
      ) : null}

      {canRequestCoHost ? (
        <LiveRoomPill
          label={
            isAwaitingCoHostApproval
              ? "공동 진행 승인 대기 중"
              : "공동 진행 요청"
          }
          disabled={
            isAwaitingCoHostApproval ||
            requestCoHostMutation.isPending
          }
          onPress={() =>
            void requestCoHost()
          }
        />
      ) : null}

      <LiveRoomStage
        tone={tone}
        isAudioActive={
          isAudioActive
        }
        imageUrl={
          live.bandProfileImageUrl
        }
        bandName={live.bandName}
        title={live.title}
        description={
          live.description
        }
      />

      <LiveRoomChatList
        tone={tone}
        messages={
          sortedMessages
        }
        composerOpen={
          isComposerOpen
        }
        isHighlighted={(message) =>
          message.senderName ===
            live.bandName ||
          (Boolean(
            live.bandProfileImageUrl,
          ) &&
            message.senderProfileImageUrl ===
              live.bandProfileImageUrl)
        }
      />

      {isComposerOpen ? (
        <LiveRoomComposer
          tone={tone}
          value={messageText}
          errorMessage={
            chat.lastError
          }
          onChangeText={
            setMessageText
          }
          onSend={sendMessage}
        />
      ) : null}

      <LiveRoomActionBar
        tone={tone}
        center={
          isBroadcastProtocol ? (
            <LiveRoomMicButton
              label={
                mediaConnected
                  ? isMicMuted
                    ? "마이크 켜기"
                    : "마이크 끄기"
                  : "마이크 연결 중"
              }
              isLive={
                mediaConnected &&
                !isMicMuted
              }
              isMuted={isMicMuted}
              disabled={
                !mediaConnected
              }
              onPress={toggleMic}
            />
          ) : (
            <LiveRoomSoundIndicator
              tone={tone}
            />
          )
        }
        onOpenMembers={() =>
          setIsMemberSheetOpen(
            true,
          )
        }
        onToggleChat={() =>
          setIsComposerOpen(
            (current) =>
              !current,
          )
        }
      />

      <LiveRoomMemberSheet
        tone={tone}
        liveId={live.liveId}
        open={isMemberSheetOpen}
        onClose={() =>
          setIsMemberSheetOpen(
            false,
          )
        }
      />

      <ConfirmModal
        open={isExitConfirmOpen}
        tone={
          tone === "band"
            ? "orange"
            : "pink"
        }
        title={
          isOwner
            ? "라이브를 종료할까요?"
            : "라이브를 나갈까요?"
        }
        description={
          isOwner
            ? "라이브를 종료하면 청취자들도\n자동으로 나가게 돼요."
            : "진행 중인 라이브에서 나가게 돼요.\n언제든 다시 입장할 수 있어요."
        }
        confirmLabel={
          isOwner
            ? "종료"
            : "나가기"
        }
        onCancel={() =>
          setIsExitConfirmOpen(
            false,
          )
        }
        onConfirm={() => {
          setIsExitConfirmOpen(
            false,
          );

          void exitLive();
        }}
      />

      <ConfirmModal
        open={
          isCoHostModalOpen &&
          Boolean(
            currentCoHostRequest,
          )
        }
        tone="orange"
        title={
          coHostNickname
            ? `${coHostNickname}님의 공동 송출 요청을 승인할까요?`
            : "공동 송출 요청을 승인할까요?"
        }
        description={
          coHostNickname
            ? `승인하면 ${coHostNickname}님이\n공동 진행자로 라이브에 참여해요.`
            : "승인하면 공동 진행자로\n라이브에 참여해요."
        }
        cancelLabel="닫기"
        confirmLabel={
          acceptCoHostMutation.isPending
            ? "승인 중"
            : "승인하기"
        }
        confirmDisabled={
          acceptCoHostMutation.isPending
        }
        onBackdropPress={() =>
          setIsCoHostModalOpen(
            false,
          )
        }
        onCancel={() => {
          setIsCoHostModalOpen(
            false,
          );

          if (
            currentCoHostRequest
          ) {
            dismissCoHostRequest(
              currentCoHostRequest.userId,
            );
          }
        }}
        onConfirm={() => {
          setIsCoHostModalOpen(
            false,
          );

          void acceptRequester();
        }}
      />
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor:
        colors.white,
    },

    stateContainer: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor:
        colors.white,
    },

    stateHeader: {
      paddingHorizontal: 15,
    },

    stateText: {
      ...textStyles.caption2,
      color:
        colors.neutral500,
      paddingVertical: 40,
      textAlign: "center",
    },

    inviteCard: {
      ...shadows.card,
      gap: 12,
      borderRadius: 12,
      backgroundColor:
        colors.white,
      marginHorizontal: 20,
      marginTop: 16,
      padding: 20,
    },

    inviteTitle: {
      ...textStyles.label1,
      color:
        colors.neutral900,
    },

    inviteDescription: {
      ...textStyles.caption1,
      color:
        colors.neutral600,
    },

    inviteActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },

    inviteButton: {
      flex: 1,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor:
        colors.secondary500,
    },

    inviteReject: {
      backgroundColor:
        colors.white,
    },

    inviteAccept: {
      backgroundColor:
        colors.secondary500,
    },

    inviteRejectText: {
      ...textStyles.label2,
      color:
        colors.secondary500,
    },

    inviteAcceptText: {
      ...textStyles.label2,
      color:
        colors.white,
    },
  });
