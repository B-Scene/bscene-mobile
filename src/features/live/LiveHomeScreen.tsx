import { router } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useLiveHomeQuery } from "@/hooks/api/live/useLive";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type {
  LiveNowItem,
  LiveReplayItem,
  ScheduledLiveItem,
} from "@/types/live/live";

type LiveMode = "fan" | "band";

type LiveHomeScreenProps = {
  mode: LiveMode;
};

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
  return (
    <Screen contentStyle={styles.bandContainer}>
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
            <Text style={styles.bandStateText}>라이브 정보를 불러오지 못했어요.</Text>
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
              <BandSectionHeader title="진행 중인 라이브" />
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
              <BandSectionHeader title="예정된 라이브" />
              <View style={styles.bandCardList}>
                {data.scheduled.length > 0 ? (
                  data.scheduled.map((live) => (
                    <BandScheduledLiveCard key={live.liveId} live={live} />
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
  return (
    <Screen contentStyle={styles.fanContainer}>
      <View style={styles.fanHeader}>
        <Text style={styles.fanHeaderTitle}>라이브</Text>
      </View>

      {isLoading ? (
        <View style={styles.fanStateWrap}>
          <AppState loading title="라이브를 불러오는 중이에요" />
        </View>
      ) : isError || !data ? (
        <View style={styles.fanStateWrap}>
          <AppState
            title="라이브를 불러오지 못했어요"
            actionLabel="다시 시도"
            onAction={onRetry}
          />
        </View>
      ) : (
        <View style={styles.fanContent}>
          <View style={styles.fanSection}>
            <FanSectionHeader title="진행 중인 라이브" />
            <View style={styles.fanCardList}>
              {data.liveNow.length === 0 ? (
                <Text style={styles.fanEmpty}>진행 중인 라이브가 없어요.</Text>
              ) : (
                data.liveNow.map((live) => (
                  <FanLiveNowCard key={live.liveId} live={live} />
                ))
              )}
            </View>
          </View>

          <View style={styles.fanSection}>
            <FanSectionHeader title="다시보기" />
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
            <FanSectionHeader title="예정된 라이브" />
            <View style={styles.fanCardList}>
              {data.scheduled.length === 0 ? (
                <Text style={styles.fanEmpty}>예정된 라이브가 없어요.</Text>
              ) : (
                data.scheduled.map((live) => (
                  <FanScheduledLiveCard key={live.liveId} live={live} />
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

function BandSectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.bandSectionTitle}>{title}</Text>
      <View style={styles.moreButton} accessibilityRole="button">
        <Text style={styles.moreText}>전체보기</Text>
        <Text style={styles.moreIcon}>›</Text>
      </View>
    </View>
  );
}

function FanSectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.fanSectionHeader}>
      <Text style={styles.fanSectionTitle}>{title}</Text>
      <View style={styles.fanMoreButton} accessibilityRole="button">
        <Text style={styles.fanMoreText}>더보기</Text>
        <Text style={styles.fanMoreIcon}>›</Text>
      </View>
    </View>
  );
}

function BandLiveNowCard({ live }: { live: LiveNowItem }) {
  const listeners = live.viewerCount ?? live.viewCount ?? 0;

  return (
    <View style={styles.bandLiveCard}>
      <View style={styles.liveProfileWrap}>
        <Avatar
          imageUrl={live.bandProfileImageUrl}
          label={live.bandName}
          size={62}
        />
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.bandCardInfo}>
        <Text numberOfLines={1} style={styles.bandCardTitle}>
          {live.isMine ? "내 라이브 진행 중" : live.bandName}
        </Text>
        <Text numberOfLines={1} style={styles.bandCardSubtitle}>
          {live.title}
        </Text>
        <View style={styles.listenerRow}>
          <LiveHeadIcon />
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

function BandScheduledLiveCard({ live }: { live: ScheduledLiveItem }) {
  return (
    <View style={styles.bandScheduledCard}>
      <Avatar
        imageUrl={live.bandProfileImageUrl}
        label={live.bandName}
        size={62}
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
        <View style={styles.scheduledAction}>
          <Text style={styles.scheduledActionText}>수정</Text>
        </View>
      ) : null}
    </View>
  );
}

function FanLiveNowCard({ live }: { live: LiveNowItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.fanLiveNowCard,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        router.push(
          `/fan/live/room/${live.liveId}` as Parameters<typeof router.push>[0],
        )
      }
    >
      <View style={styles.fanLiveProfileWrap}>
        <Avatar imageUrl={live.bandProfileImageUrl} label={live.bandName} size={62} />
        <View style={styles.fanLiveBadge}>
          <Text style={styles.fanLiveBadgeText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.fanLiveInfo}>
        <Text numberOfLines={1} style={styles.fanLiveTitle}>{live.title}</Text>
        <Text numberOfLines={1} style={styles.fanLiveBand}>{live.bandName}</Text>
        <View style={styles.fanListenerRow}>
          <LiveHeadIcon tone="pink" />
          <Text numberOfLines={1} style={styles.fanListenerText}>
            {(live.viewerCount ?? live.viewCount ?? 0).toLocaleString()}명 시청 중
          </Text>
        </View>
      </View>

      <View style={styles.fanEnterButton}>
        <Text style={styles.fanEnterButtonText}>입장</Text>
      </View>
    </Pressable>
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
          `/fan/live/room/${replay.liveId}` as Parameters<typeof router.push>[0],
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
            <Text style={styles.replayFallbackText}>
              {replay.bandName.slice(0, 1)}
            </Text>
          </View>
        )}
        <View style={styles.replayDuration}>
          <Text style={styles.replayDurationText}>
            {formatReplayDuration(replay.durationSeconds)}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.replayTitle}>{replay.title}</Text>
      <Text numberOfLines={1} style={styles.replayBand}>{replay.bandName}</Text>
      <View style={styles.replayMetaRow}>
        <PlayIcon />
        <Text style={styles.replayMetaText}>
          {replay.viewCount.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

function FanScheduledLiveCard({ live }: { live: ScheduledLiveItem }) {
  const notified = live.notificationEnabled ?? false;

  return (
    <View style={styles.fanScheduledCard}>
      <Avatar
        imageUrl={live.bandProfileImageUrl ?? live.thumbnailImageUrl}
        label={live.bandName}
        size={62}
      />
      <View style={styles.fanScheduledInfo}>
        <Text numberOfLines={1} style={styles.fanLiveTitle}>{live.title}</Text>
        <Text numberOfLines={1} style={styles.fanLiveBand}>{live.bandName}</Text>
        <Text numberOfLines={1} style={styles.fanScheduleText}>
          {formatScheduledAt(live.scheduledAt)}
        </Text>
      </View>
      <View
        style={[
          styles.fanAlarmButton,
          notified ? styles.fanAlarmButtonSoft : styles.fanAlarmButtonOutline,
        ]}
      >
        <NotificationIcon />
        <Text
          style={[
            styles.fanAlarmButtonText,
            notified ? styles.fanAlarmButtonTextSoft : styles.fanAlarmButtonTextOutline,
          ]}
        >
          {notified ? "알림 받는 중" : "알림 받기"}
        </Text>
      </View>
    </View>
  );
}

function LiveIllustration() {
  return (
    <View style={styles.illustration} pointerEvents="none">
      <Text style={[styles.note, styles.noteLeftTop]}>♪</Text>
      <Text style={[styles.note, styles.noteLeftBottom]}>♪</Text>
      <Text style={[styles.note, styles.noteRightTop]}>♫</Text>
      <Text style={[styles.note, styles.noteRightBottom]}>♪</Text>
      <Svg width={94} height={98} viewBox="0 0 94 98" fill="none">
        <Circle cx="47" cy="49" r="34" fill="#FFE7A9" opacity={0.58} />
        <Rect x="32" y="14" width="30" height="45" rx="15" fill="#FBB10E" />
        <Rect x="39" y="20" width="16" height="30" rx="8" fill="#FFF6E5" opacity={0.72} />
        <Path
          d="M24 45C24 58.2 34.3 68.5 47 68.5C59.7 68.5 70 58.2 70 45"
          stroke="#FBB10E"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Path
          d="M47 70V84M34 84H60"
          stroke="#FBB10E"
          strokeWidth={8}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function LiveHeadIcon({ tone = "orange" }: { tone?: "orange" | "pink" }) {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none">
      <Path
        fill={tone === "pink" ? colors.primary400 : "#FDD272"}
        d="M5.6.013C2.413.22 0 3.013 0 6.206v4.46c0 1.107.893 2 2 2h.667c.733 0 1.333-.6 1.333-1.333V8.666c0-.733-.6-1.333-1.333-1.333H1.333v-1.14c0-2.56 1.974-4.787 4.527-4.86A4.667 4.667 0 0 1 10.667 6v1.333H9.333C8.6 7.333 8 7.933 8 8.666v2.667c0 .733.6 1.333 1.333 1.333H10c1.107 0 2-.893 2-2V6A6 6 0 0 0 5.6.013Z"
      />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
      <Path d="M3 2L8 5L3 8V2Z" fill={colors.neutral500} opacity={0.55} />
    </Svg>
  );
}

function NotificationIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={colors.primary400}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21A2 2 0 0 1 10.27 21"
        stroke={colors.primary400}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatScheduledAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    });
}

function formatReplayDuration(totalSeconds?: number) {
  if (totalSeconds === undefined) return "00:00:00";

  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

const styles = StyleSheet.create({
  bandContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.white,
  },
  bandHeader: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  bandHeaderTitle: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  bandContent: {
    paddingHorizontal: 20,
  },
  bandHero: {
    minHeight: 164,
    borderRadius: 12,
    backgroundColor: "#FFF6E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 19,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  heroDescription: {
    color: colors.neutral700,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  heroButton: {
    width: 91,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary500,
    marginTop: 12,
  },
  heroButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  illustration: {
    width: 118,
    height: 98,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    position: "absolute",
    color: colors.secondary500,
    fontWeight: "700",
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
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 20,
  },
  moreText: {
    color: colors.neutral400,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  moreIcon: {
    color: colors.neutral400,
    fontSize: 24,
    lineHeight: 24,
  },
  bandCardList: {
    gap: 12,
    marginTop: 12,
  },
  bandLiveCard: {
    minHeight: 88,
    borderRadius: 10,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bandScheduledCard: {
    minHeight: 88,
    borderRadius: 10,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  liveProfileWrap: {
    position: "relative",
    shadowColor: colors.secondary500,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  liveBadge: {
    position: "absolute",
    left: 17,
    bottom: -4,
    width: 27,
    height: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary500,
  },
  liveBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
  },
  bandCardInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
    paddingRight: 16,
  },
  bandCardTitle: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  bandCardSubtitle: {
    color: colors.neutral700,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 2,
  },
  listenerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  listenerText: {
    color: colors.secondary500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  enterButton: {
    width: 51,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  enterButtonText: {
    color: colors.secondary500,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  scheduleText: {
    color: colors.secondary500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  scheduledAction: {
    minWidth: 69,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary0,
    paddingHorizontal: 8,
  },
  scheduledActionText: {
    color: colors.secondary500,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  bandStateCard: {
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.secondary0,
    marginTop: 32,
    padding: 20,
  },
  bandStateText: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
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
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  bandEmptyText: {
    borderRadius: 12,
    backgroundColor: colors.secondary0,
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 24,
    textAlign: "center",
  },
  fanContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.white,
  },
  fanHeader: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fanHeaderTitle: {
    color: "#1D1A1A",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  fanContent: {
    paddingHorizontal: 20,
  },
  fanStateWrap: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  fanMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  fanMoreText: {
    color: colors.neutral400,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  fanMoreIcon: {
    color: colors.neutral400,
    fontSize: 24,
    lineHeight: 24,
  },
  fanCardList: {
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  fanLiveNowCard: {
    width: "100%",
    minHeight: 86,
    borderRadius: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fanLiveProfileWrap: {
    position: "relative",
    shadowColor: colors.primary400,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  fanLiveBadge: {
    position: "absolute",
    left: 17,
    bottom: -2,
    width: 27,
    height: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary400,
  },
  fanLiveBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
  },
  fanLiveInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    paddingRight: 66,
  },
  fanLiveTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  fanLiveBand: {
    color: colors.neutral700,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  fanListenerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  fanListenerText: {
    color: colors.primary400,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  fanEnterButton: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 51,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  fanEnterButtonText: {
    color: colors.primary400,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
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
    borderRadius: 12,
    overflow: "hidden",
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
    backgroundColor: colors.primary0,
  },
  replayFallbackText: {
    color: colors.primary400,
    fontSize: 22,
    fontWeight: "700",
  },
  replayDuration: {
    position: "absolute",
    right: 7,
    bottom: 5,
    minWidth: 48,
    height: 13,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral900,
    paddingHorizontal: 4,
  },
  replayDurationText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "500",
    lineHeight: 11,
  },
  replayTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 8,
  },
  replayBand: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  replayMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  replayMetaText: {
    color: colors.neutral500,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
  },
  fanScheduledCard: {
    width: "100%",
    minHeight: 86,
    borderRadius: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fanScheduledInfo: {
    flex: 1,
    minWidth: 0,
  },
  fanScheduleText: {
    color: colors.primary300,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 3,
  },
  fanAlarmButton: {
    width: 81,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  fanAlarmButtonSoft: {
    borderColor: "transparent",
    backgroundColor: colors.primary0,
  },
  fanAlarmButtonOutline: {
    borderColor: colors.primary400,
    backgroundColor: colors.white,
  },
  fanAlarmButtonText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  fanAlarmButtonTextSoft: {
    color: colors.primary400,
  },
  fanAlarmButtonTextOutline: {
    color: colors.primary400,
  },
  fanEmpty: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 20,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
