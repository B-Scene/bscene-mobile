import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  FanLiveNowCard,
  FanScheduledCard,
  formatReplayDuration,
  formatScheduledAt,
} from "@/features/live/LiveCards";
import {
  useLiveHomeQuery,
  useToggleLiveAlarmMutation,
} from "@/hooks/api/live/useLive";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import type {
  LiveNowItem,
  LiveReplayItem,
  ScheduledLiveItem,
} from "@/types/live/live";

const LIVE_MIC_IMAGE = require("../../../assets/images/live/live-mic.png");

type LiveMode = "fan" | "band";

type LiveHomeScreenProps = {
  mode: LiveMode;
};

type BandLiveListKind = "now" | "scheduled";

export function LiveHomeScreen({ mode }: LiveHomeScreenProps) {
  const query = useLiveHomeQuery();
  const data = query.data;

  if (mode === "band") {
    return (
      <BandLiveHome
        data={data}
        isLoading={query.isLoading}
        isError={query.isError || !data}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <FanLiveHome
      data={data}
      isLoading={query.isLoading}
      isError={query.isError || !data}
      onRetry={() => void query.refetch()}
    />
  );
}

function BandLiveHome({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: ReturnType<typeof useLiveHomeQuery>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const now = useScheduledLiveNow();

  const handleScheduledAction =
    (live: ScheduledLiveItem) => {
      if (
        isScheduledLiveStartable(
          live.scheduledAt,
          now,
        )
      ) {
        router.push(
          `/band/live/room/${live.liveId}` as Parameters<typeof router.push>[0],
        );
        return;
      }

      router.push(
        `/band/live/create?reservationLiveId=${live.liveId}` as Parameters<
          typeof router.push
        >[0],
      );
    };

  return (
    <Screen edges={["top"]} contentStyle={styles.bandContainer}>
      <View style={styles.bandHeader}>
        <Text style={styles.bandHeaderTitle}>라이브</Text>
      </View>

      <View style={styles.bandContent}>
        <View style={styles.bandHero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              지금, 오디오 라이브를{"\n"}시작 해보세요!
            </Text>
            <Text style={styles.heroDescription}>
              목소리만으로 팬들과 실시간 소통,{"\n"}팔로워가 없어도 바로 시작할 수 있어요.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.heroButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push(
                  "/band/live/create" as Parameters<typeof router.push>[0],
                )
              }
            >
              <Text style={styles.heroButtonText}>라이브 시작하기</Text>
            </Pressable>
          </View>

          <LiveIllustration />
        </View>

        {isLoading ? (
          <Text style={styles.bandStateText}>라이브를 불러오는 중이에요.</Text>
        ) : null}

        {!isLoading && isError ? (
          <View style={styles.bandStateCard}>
            <Text style={styles.bandStateCardText}>라이브 정보를 불러오지 못했어요.</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.retryButton}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>다시 불러오기</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !isError && data ? (
          <>
            <View style={styles.bandSection}>
              <BandSectionHeader
                title="진행 중인 라이브"
                onMorePress={() =>
                  router.push(
                    "/band/live/now" as Parameters<typeof router.push>[0],
                  )
                }
              />
              <View style={styles.bandCardList}>
                {data.liveNow.length > 0 ? (
                  data.liveNow.map((live) => (
                    <BandLiveNowCard key={live.liveId} live={live} />
                  ))
                ) : (
                  <Text style={styles.bandEmptyText}>진행 중인 라이브가 없어요.</Text>
                )}
              </View>
            </View>

            <View style={styles.bandSection}>
              <BandSectionHeader
                title="예정된 라이브"
                onMorePress={() =>
                  router.push(
                    "/band/live/scheduled" as Parameters<
                      typeof router.push
                    >[0],
                  )
                }
              />
              <View style={styles.bandCardList}>
                {data.scheduled.length > 0 ? (
                  data.scheduled.map((live) => (
                    <BandScheduledLiveCard
                      key={live.liveId}
                      live={live}
                      actionLabel={
                        isScheduledLiveStartable(live.scheduledAt, now)
                          ? "라이브 시작"
                          : "수정"
                      }
                      onAction={() => handleScheduledAction(live)}
                    />
                  ))
                ) : (
                  <Text style={styles.bandEmptyText}>예정된 라이브가 없어요.</Text>
                )}
              </View>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

export function BandLiveListScreen({
  kind,
}: {
  kind: BandLiveListKind;
}) {
  const query = useLiveHomeQuery();
  const now = useScheduledLiveNow();

  const title =
    kind === "now"
      ? "진행 중인 라이브"
      : "예정된 라이브";

  const items = useMemo(() => {
    if (!query.data) {
      return [];
    }

    return kind === "now"
      ? query.data.liveNow
      : query.data.scheduled;
  }, [kind, query.data]);

  const handleScheduledAction =
    (live: ScheduledLiveItem) => {
      if (
        isScheduledLiveStartable(
          live.scheduledAt,
          now,
        )
      ) {
        router.push(
          `/band/live/room/${live.liveId}` as Parameters<typeof router.push>[0],
        );
        return;
      }

      router.push(
        `/band/live/create?reservationLiveId=${live.liveId}` as Parameters<
          typeof router.push
        >[0],
      );
    };

  return (
    <Screen contentStyle={styles.bandListContainer}>
      <AppHeader title={title} style={styles.bandListHeader} />

      {query.isLoading ? (
        <Text style={styles.listMessage}>라이브 목록을 불러오는 중이에요.</Text>
      ) : null}

      {!query.isLoading && query.isError ? (
        <View style={styles.listMessageBox}>
          <Text style={styles.listMessageText}>라이브 목록을 불러오지 못했어요.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryButtonText}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : null}

      {!query.isLoading && !query.isError ? (
        <View style={styles.bandListContent}>
          {items.length > 0 ? (
            items.map((live) =>
              kind === "now" ? (
                <BandLiveNowCard
                  key={(live as LiveNowItem).liveId}
                  live={live as LiveNowItem}
                />
              ) : (
                <BandScheduledLiveCard
                  key={(live as ScheduledLiveItem).liveId}
                  live={live as ScheduledLiveItem}
                  actionLabel={
                    isScheduledLiveStartable(
                      (live as ScheduledLiveItem).scheduledAt,
                      now,
                    )
                      ? "라이브 시작"
                      : "수정"
                  }
                  onAction={() =>
                    handleScheduledAction(
                      live as ScheduledLiveItem,
                    )
                  }
                />
              ),
            )
          ) : (
            <Text style={styles.listMessage}>
              {kind === "now"
                ? "현재 진행 중인 라이브가 없어요."
                : "예정된 라이브가 없어요."}
            </Text>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function FanLiveHome({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: ReturnType<typeof useLiveHomeQuery>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const toggleAlarmMutation =
    useToggleLiveAlarmMutation();
  const [
    notificationOverrides,
    setNotificationOverrides,
  ] =
    useState<
      Record<number, boolean>
    >({});

  const toggleNotification =
    async (
      live: ScheduledLiveItem,
    ) => {
      if (
        toggleAlarmMutation.isPending
      ) {
        return;
      }

      const previousValue =
        notificationOverrides[
          live.liveId
        ] ??
        live.isAlarmSet ??
        live.alarmSet ??
        live.notificationEnabled ??
        false;

      setNotificationOverrides(
        (current) => ({
          ...current,
          [live.liveId]:
            !previousValue,
        }),
      );

      try {
        const result =
          await toggleAlarmMutation.mutateAsync(
            live.liveId,
          );

        setNotificationOverrides(
          (current) => ({
            ...current,
            [live.liveId]:
              result.alarmSet,
          }),
        );
      } catch {
        setNotificationOverrides(
          (current) => ({
            ...current,
            [live.liveId]:
              previousValue,
          }),
        );
        Alert.alert(
          "라이브 알림",
          "라이브 알림을 변경하지 못했어요.",
        );
      }
    };

  return (
    <Screen edges={["top"]} contentStyle={styles.fanContainer}>
      <View style={styles.fanHeader}>
        <Text style={styles.fanHeaderTitle}>라이브</Text>
      </View>

      {isLoading ? (
        <Text style={styles.fanLoadingText}>라이브를 불러오는 중이에요.</Text>
      ) : isError || !data ? (
        <View style={styles.fanErrorCard}>
          <Text style={styles.bandStateCardText}>라이브 정보를 불러오지 못했어요.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.fanRetryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.fanContent}>
          <View style={styles.fanFirstSection}>
            <FanSectionHeader
              title="진행 중인 라이브"
              onMorePress={() =>
                router.push(
                  "/fan/live/now" as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            />
            <View style={styles.fanCardList}>
              {data.liveNow.length === 0 ? (
                <Text style={styles.fanEmpty}>진행 중인 라이브가 없어요.</Text>
              ) : (
                data.liveNow.map((live) => (
                  <FanLiveNowCard
                    key={live.liveId}
                    live={live}
                    listenerLabel={`${(live.viewerCount ?? live.viewCount ?? 0).toLocaleString()}명 시청 중`}
                  />
                ))
              )}
            </View>
          </View>

          <View style={styles.fanSection}>
            <FanSectionHeader
              title="다시보기"
              onMorePress={() =>
                router.push(
                  "/fan/live/replays" as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            />
            {data.replays.length > 0 ? (
              <View style={styles.replayRow}>
                {data.replays.slice(0, 3).map((replay) => (
                  <ReplayPreviewCard key={replay.liveId} replay={replay} />
                ))}
              </View>
            ) : (
              <Text style={styles.fanEmpty}>다시보기가 없어요.</Text>
            )}
          </View>

          <View style={styles.fanSection}>
            <FanSectionHeader
              title="예정된 라이브"
              onMorePress={() =>
                router.push(
                  "/fan/live/scheduled" as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            />
            <View style={styles.fanCardList}>
              {data.scheduled.length === 0 ? (
                <Text style={styles.fanEmpty}>예정된 라이브가 없어요.</Text>
              ) : (
                data.scheduled.map((live) => {
                  const notified =
                    notificationOverrides[
                      live.liveId
                    ] ??
                    live.isAlarmSet ??
                    live.alarmSet ??
                    live.notificationEnabled ??
                    false;

                  return (
                    <FanScheduledCard
                      key={live.liveId}
                      live={live}
                      notified={
                        notified
                      }
                      disabled={
                        toggleAlarmMutation.isPending
                      }
                      onToggleNotification={() =>
                        void toggleNotification(
                          live,
                        )
                      }
                    />
                  );
                })
              )}
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

function BandSectionHeader({
  title,
  onMorePress,
}: {
  title: string;
  onMorePress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.bandSectionTitle}>{title}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.moreButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        onPress={onMorePress}
      >
        <Text style={styles.moreText}>전체보기</Text>
        <AppIcon name="moreArrow" />
      </Pressable>
    </View>
  );
}

function FanSectionHeader({
  title,
  onMorePress,
}: {
  title: string;
  onMorePress?: () => void;
}) {
  return (
    <View style={styles.fanSectionHeader}>
      <Text style={styles.fanSectionTitle}>{title}</Text>
      <Pressable
        style={styles.fanMoreButton}
        accessibilityRole="button"
        onPress={onMorePress}
      >
        <Text style={styles.fanMoreText}>더보기</Text>
        <AppIcon name="moreArrow" />
      </Pressable>
    </View>
  );
}

function BandLiveNowCard({ live }: { live: LiveNowItem }) {
  const listeners = live.viewerCount ?? live.viewCount ?? 0;

  return (
    <View style={styles.bandLiveCard}>
      <View style={styles.liveProfileWrap}>
        <ProfileImage
          imageUrl={live.bandProfileImageUrl}
          size={62}
          variant="band"
        />
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      <View style={[styles.bandCardInfo, styles.bandLiveInfo]}>
        <Text numberOfLines={1} style={styles.bandCardTitle}>
          {live.isMine ? "내 라이브 진행 중" : live.bandName}
        </Text>
        <Text numberOfLines={1} style={styles.bandCardSubtitle}>
          {live.title}
        </Text>
        <View style={styles.listenerRow}>
          <AppIcon name="headsetGold" width={12} height={13} />
          <Text style={styles.listenerText}>{listeners}명 청취 중</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.enterButton,
          pressed && styles.pressed,
        ]}
        onPress={() =>
          router.push(
            `/band/live/room/${live.liveId}` as Parameters<typeof router.push>[0],
          )
        }
      >
        <Text style={styles.enterButtonText}>입장</Text>
      </Pressable>
    </View>
  );
}

function BandScheduledLiveCard({
  live,
  actionLabel = "수정",
  onAction,
}: {
  live: ScheduledLiveItem;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.bandScheduledCard}>
      <ProfileImage
        imageUrl={live.bandProfileImageUrl}
        size={62}
        variant="band"
      />

      <View style={styles.bandCardInfo}>
        <Text numberOfLines={1} style={styles.bandCardTitle}>
          {live.isMine ? "내 예정 라이브" : live.bandName}
        </Text>
        <Text numberOfLines={1} style={styles.bandCardSubtitle}>
          {live.title}
        </Text>
        <Text numberOfLines={1} style={styles.scheduleText}>
          {formatScheduledAt(live.scheduledAt)}
        </Text>
      </View>

      {live.isMine ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.scheduledAction,
            pressed && styles.pressed,
          ]}
          onPress={onAction}
        >
          <Text style={styles.scheduledActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReplayPreviewCard({ replay }: { replay: LiveReplayItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.replayCard,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        router.push(
          `/fan/live/replays/${replay.liveId}` as Parameters<typeof router.push>[0],
        )
      }
    >
      <View style={styles.replayThumb}>
        {replay.thumbnailImageUrl ? (
          <Image
            source={{ uri: replay.thumbnailImageUrl }}
            style={styles.replayImage}
          />
        ) : (
          <View style={styles.replayFallback}>
            <AppIcon name="bandDefaultProfile" size={110} />
          </View>
        )}
        <View style={styles.replayDuration}>
          <Text style={styles.replayDurationText}>
            {formatReplayDuration(replay.durationSeconds ?? replay.durationSec)}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.replayTitle}>{replay.title}</Text>
      <Text numberOfLines={1} style={styles.replayBand}>{replay.bandName}</Text>
      <View style={styles.replayMetaRow}>
        <AppIcon name="playMuted" size={10} />
        <Text style={styles.replayMetaText}>
          {replay.viewCount.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

function LiveIllustration() {
  return (
    <View style={styles.illustration} pointerEvents="none">
      <Text style={[styles.note, styles.noteLeftTop]}>♪</Text>
      <Text style={[styles.note, styles.noteLeftBottom]}>♪</Text>
      <Text style={[styles.note, styles.noteRightTop]}>♫</Text>
      <Text style={[styles.note, styles.noteRightBottom]}>♪</Text>
      <Image source={LIVE_MIC_IMAGE} style={styles.micImage} />
    </View>
  );
}

const KOREAN_SCHEDULE_PATTERN =
  /(?:(\d{4})[.\-/년]\s*)?(\d{1,2})[.\-/월]\s*(\d{1,2})(?:[.\-/일])?(?:\s*\([^)]*\))?\s*(오전|오후|AM|PM)?\s*(\d{1,2}):(\d{2})/i;

function parseScheduledAtTime(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const nativeDate = new Date(
    trimmedValue.includes("T")
      ? trimmedValue
      : trimmedValue.replace(" ", "T"),
  );

  if (!Number.isNaN(nativeDate.getTime())) {
    return nativeDate.getTime();
  }

  const matched =
    trimmedValue.match(KOREAN_SCHEDULE_PATTERN);

  if (!matched) {
    return null;
  }

  const [
    ,
    yearValue,
    monthValue,
    dayValue,
    meridiem,
    hourValue,
    minuteValue,
  ] = matched;
  const year =
    yearValue
      ? Number(yearValue)
      : new Date().getFullYear();
  const month = Number(monthValue);
  const day = Number(dayValue);
  let hour = Number(hourValue);
  const minute = Number(minuteValue);
  const normalizedMeridiem =
    meridiem?.toUpperCase();

  if (
    (normalizedMeridiem === "오후" ||
      normalizedMeridiem === "PM") &&
    hour < 12
  ) {
    hour += 12;
  }

  if (
    (normalizedMeridiem === "오전" ||
      normalizedMeridiem === "AM") &&
    hour === 12
  ) {
    hour = 0;
  }

  const parsedDate = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
  );

  return Number.isNaN(parsedDate.getTime())
    ? null
    : parsedDate.getTime();
}

function isScheduledLiveStartable(
  scheduledAt: string,
  now: number,
) {
  const scheduledTime =
    parseScheduledAtTime(scheduledAt);

  return scheduledTime !== null && scheduledTime <= now;
}

function useScheduledLiveNow() {
  const [
    now,
    setNow,
  ] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Date.now()),
      1000,
    );

    return () => clearInterval(timer);
  }, []);

  return now;
}

const styles = StyleSheet.create({
  bandContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  bandListContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 32,
    backgroundColor: colors.white,
  },
  bandHeader: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  bandListHeader: {
    paddingHorizontal: 20,
  },
  bandHeaderTitle: {
    ...textStyles.label2,
    color: "#1D1A1A",
  },
  bandContent: {
    paddingHorizontal: 20,
  },
  bandHero: {
    minHeight: 164,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: "#FFF6E5",
    marginTop: 20,
    padding: 19,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.1)",
  },
  heroCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  heroTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  heroDescription: {
    ...textStyles.caption2,
    color: colors.neutral700,
    marginTop: 8,
  },
  heroButton: {
    width: 91,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: colors.secondary500,
    marginTop: 12,
  },
  heroButtonText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  illustration: {
    width: 118,
    height: 98,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  micImage: {
    width: 94,
    height: 98,
  },
  note: {
    position: "absolute",
    color: colors.secondary500,
  },
  noteLeftTop: {
    top: 21,
    left: 0,
    fontSize: 18,
  },
  noteLeftBottom: {
    top: 57,
    left: 16,
    fontSize: 13,
  },
  noteRightTop: {
    top: 25,
    right: 0,
    fontSize: 17,
  },
  noteRightBottom: {
    top: 58,
    right: 20,
    fontSize: 14,
  },
  bandSection: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bandSectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    lineHeight: 24,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 20,
  },
  moreText: {
    ...textStyles.body2,
    color: colors.neutral400,
  },
  bandCardList: {
    gap: 12,
    marginTop: 12,
  },
  bandListContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bandLiveCard: {
    height: 88,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    boxShadow: "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
  },
  bandScheduledCard: {
    height: 88,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    boxShadow: "0px 4px 15px 0px rgba(20, 20, 20, 0.08)",
  },
  liveProfileWrap: {
    width: 62,
    height: 62,
    flexShrink: 0,
    borderRadius: 31,
    boxShadow: "0px 0px 10px 0px #FBB10E",
  },
  liveBadge: {
    position: "absolute",
    left: 17.5,
    bottom: -4,
    width: 27,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.secondary500,
  },
  liveBadgeText: {
    ...textStyles.label4,
    color: colors.white,
  },
  bandCardInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },
  bandLiveInfo: {
    paddingRight: 62,
  },
  bandCardTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  bandCardSubtitle: {
    ...textStyles.body3,
    color: colors.neutral700,
    marginTop: 2,
  },
  listenerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  listenerText: {
    ...textStyles.caption2,
    color: colors.secondary500,
  },
  enterButton: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 51,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  enterButtonText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  scheduleText: {
    ...textStyles.caption2,
    color: colors.secondary500,
    marginTop: 4,
  },
  scheduledAction: {
    minWidth: 69,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 8,
  },
  scheduledActionText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  bandStateCard: {
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.secondary0,
    marginTop: 32,
    padding: 20,
  },
  bandStateCardText: {
    ...textStyles.caption2,
    color: colors.neutral700,
    textAlign: "center",
  },
  bandStateText: {
    ...textStyles.caption2,
    color: colors.neutral500,
    marginTop: 32,
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
    ...textStyles.caption3,
    color: colors.white,
  },
  bandEmptyText: {
    ...textStyles.caption2,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.secondary0,
    color: colors.neutral500,
    paddingVertical: 24,
    textAlign: "center",
  },
  listMessage: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 48,
    textAlign: "center",
  },
  listMessageBox: {
    alignItems: "center",
    paddingVertical: 48,
  },
  listMessageText: {
    ...textStyles.caption2,
    color: colors.neutral500,
    textAlign: "center",
  },
  fanContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  fanHeader: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fanHeaderTitle: {
    ...textStyles.label2,
    color: "#1D1A1A",
  },
  fanContent: {
    paddingHorizontal: 20,
  },
  fanLoadingText: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 40,
    textAlign: "center",
  },
  fanErrorCard: {
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: colors.primary50,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  fanRetryButton: {
    borderRadius: 8,
    backgroundColor: colors.primary400,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fanFirstSection: {
    paddingTop: 20,
  },
  fanSection: {
    marginTop: 28,
  },
  fanSectionHeader: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fanSectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  fanMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  fanMoreText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  fanCardList: {
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  replayRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  replayCard: {
    width: 110,
    flexShrink: 0,
  },
  replayThumb: {
    width: 110,
    height: 68,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.neutral200,
  },
  replayImage: {
    width: "100%",
    height: "100%",
  },
  replayFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  replayDuration: {
    position: "absolute",
    right: 7,
    bottom: 5,
    height: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    backgroundColor: colors.neutral900,
    paddingLeft: 4,
    paddingRight: 3,
    paddingBottom: 1,
  },
  replayDurationText: {
    ...textStyles.body5,
    color: colors.white,
  },
  replayTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
    marginTop: 8,
  },
  replayBand: {
    ...textStyles.caption2,
    color: colors.neutral500,
    marginTop: 2,
  },
  replayMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  replayMetaText: {
    ...textStyles.body5,
    color: colors.neutral500,
  },
  fanEmpty: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 20,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
