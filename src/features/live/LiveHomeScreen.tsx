import { router } from "expo-router";
import { Radio } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useLiveHomeQuery } from "@/hooks/api/live/useLive";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type {
  LiveNowItem,
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
      <AppHeader title="라이브" showBack={false} />

      {isLoading ? (
        <AppState loading title="라이브를 불러오는 중이에요" />
      ) : isError || !data ? (
        <AppState
          title="라이브를 불러오지 못했어요"
          actionLabel="다시 시도"
          onAction={onRetry}
        />
      ) : (
        <>
          <View style={styles.fanSectionHeader}>
            <Radio size={20} color={colors.primary600} />
            <Text style={styles.fanSectionTitle}>지금 라이브</Text>
          </View>

          {data.liveNow.length === 0 ? (
            <AppCard>
              <Text style={styles.fanEmpty}>
                현재 진행 중인 라이브가 없어요.
              </Text>
            </AppCard>
          ) : (
            data.liveNow.map((live) => (
              <FanLiveCard key={live.liveId} live={live} />
            ))
          )}

          <Text style={styles.fanSectionTitle}>예정된 라이브</Text>

          {data.scheduled.length === 0 ? (
            <Text style={styles.fanEmpty}>예정된 라이브가 없어요.</Text>
          ) : (
            data.scheduled.map((live) => (
              <AppCard key={live.liveId} style={styles.fanCard}>
                <Avatar
                  imageUrl={live.bandProfileImageUrl}
                  label={live.bandName}
                  size={48}
                />

                <View style={styles.fanCardInfo}>
                  <Text style={styles.fanTitle}>{live.title}</Text>
                  <Text style={styles.fanMeta}>{live.bandName}</Text>
                  <Text style={styles.fanMeta}>
                    {formatScheduledAt(live.scheduledAt)}
                  </Text>
                </View>
              </AppCard>
            ))
          )}
        </>
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

function FanLiveCard({ live }: { live: LiveNowItem }) {
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/fan/live/room/${live.liveId}` as Parameters<typeof router.push>[0],
        )
      }
    >
      <AppCard style={styles.fanCard}>
        <Avatar imageUrl={live.bandProfileImageUrl} label={live.bandName} size={54} />

        <View style={styles.fanCardInfo}>
          <View style={styles.fanBadges}>
            <Badge label="LIVE" tone="pink" />

            {live.isMine ? <Badge label="내 라이브" tone="yellow" /> : null}
          </View>

          <Text style={styles.fanTitle}>{live.title}</Text>

          <Text style={styles.fanMeta}>
            {live.bandName} · {live.viewerCount ?? live.viewCount ?? 0}명 시청 중
          </Text>
        </View>
      </AppCard>
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

function LiveHeadIcon() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none">
      <Path
        fill="#FDD272"
        d="M5.6.013C2.413.22 0 3.013 0 6.206v4.46c0 1.107.893 2 2 2h.667c.733 0 1.333-.6 1.333-1.333V8.666c0-.733-.6-1.333-1.333-1.333H1.333v-1.14c0-2.56 1.974-4.787 4.527-4.86A4.667 4.667 0 0 1 10.667 6v1.333H9.333C8.6 7.333 8 7.933 8 8.666v2.667c0 .733.6 1.333 1.333 1.333H10c1.107 0 2-.893 2-2V6A6 6 0 0 0 5.6.013Z"
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  fanSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fanSectionTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "900",
  },
  fanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  fanCardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  fanBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  fanTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },
  fanMeta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  fanEmpty: {
    color: colors.neutral500,
    fontSize: 13,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
