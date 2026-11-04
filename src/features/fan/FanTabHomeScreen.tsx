import { useCallback, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  useCompletePerformanceParticipation,
  useFanHomeQuery,
  useDeletePerformanceParticipation,
  usePendingPerformanceParticipationQuery,
  useUpcomingPerformancesInfiniteQuery,
} from "@/hooks/api/fan/useFanHome";
import { useNotificationsInfiniteQuery } from "@/hooks/api/notification/useNotification";
import {
  useFollowExploreBand,
  useUnfollowExploreBand,
} from "@/hooks/api/fan/useFanExplore";
import { BSceneLogo } from "@/features/onboarding/BSceneBrandAssets";
import { ModeSwitchSheet } from "@/features/my/ModeSwitchSheet";
import { PulseView } from "@/features/post/PostDetailParts";
import { AppIcon } from "@/shared/components/AppIcon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type {
  FanHomeConcert,
  FanHomeNewsItem,
  FanHomeRecommendedBand,
  FanHomeResponse,
  PendingPerformanceParticipationItem,
} from "@/types/fan/home";

type NewsCardItem = {
  id: string;
  detailId: number | null;
  bandName: string;
  meta: string;
  title: string;
  tags: string[];
  profileImageUrl?: string | null;
  contentImageUrl?: string | null;
};

type BandCardItem = {
  id: string;
  bandId: number | null;
  name: string;
  meta: string;
  description?: string | null;
  imageUrl?: string | null;
  isFollowing: boolean;
};

type ConcertCardItem = {
  id: string;
  title: string;
  location: string;
  dateTime: string;
  status: string;
  month: string;
  day: string;
  thumbnailUrl?: string | null;
};

const NEWS_CARD_WIDTH = 200;
const NEWS_CARD_GAP = 12;

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const firstList = <T,>(...lists: (T[] | undefined)[]) => {
  return lists.find((list) => Array.isArray(list) && list.length > 0) ?? [];
};

const compactMeta = (parts: (string | null | undefined)[]) => {
  return parts.filter(Boolean).join(" · ");
};

const firstString = (...values: (string | string[] | null | undefined)[]) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value[0];
    if (typeof value === "string" && value.length > 0) return value;
  }

  return undefined;
};

const toNumericId = (value?: number | string | null) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getConcertDate = (concert: FanHomeConcert) => {
  const dateValue =
    concert.startAt ??
    concert.startedAt ??
    concert.startDateTime ??
    concert.performanceDate ??
    concert.startDate;
  const timeValue = concert.performanceTime ?? concert.startTime ?? concert.time;

  if (dateValue && timeValue && !dateValue.includes("T")) {
    return toDate(`${dateValue}T${timeValue}`);
  }

  return toDate(dateValue);
};

const formatDateTime = (date: Date | null) => {
  if (!date) return "일정 미정";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hour}:${minute}`;
};

const formatDday = (concert: FanHomeConcert, date: Date | null) => {
  if (typeof concert.dDay === "number") {
    if (concert.dDay < 0) return "종료";
    if (concert.dDay === 0) return "D-DAY";
    return `D-${concert.dDay}`;
  }

  if (!date) return concert.status ?? "준비중";

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.ceil(
    (dateStart.getTime() - todayStart.getTime()) / 86_400_000,
  );

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-DAY";
  return `D-${diffDays}`;
};

const formatPostedAgo = (item: FanHomeNewsItem) => {
  if (typeof item.postedAgo === "number") return `${item.postedAgo}시간 전`;

  const createdAt = toDate(item.createdAt);
  if (!createdAt) return undefined;

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 60_000),
  );

  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${Math.floor(diffHours / 24)}일 전`;
};

const mapNewsItem = (item: FanHomeNewsItem, index: number): NewsCardItem => {
  const detailId =
    toNumericId(item.postId) ??
    toNumericId(item.contentId) ??
    toNumericId(item.id) ??
    toNumericId(item.newsId);

  return {
    id: String(item.newsId ?? item.postId ?? item.contentId ?? item.id ?? index),
    detailId,
    bandName: item.bandName ?? "밴드명",
    meta:
      compactMeta([item.genre, item.region, formatPostedAgo(item)]) ||
      "장르 · 지역",
    title: item.content ?? item.title ?? "새로운 소식이 도착했어요",
    tags: item.tags ?? [],
    profileImageUrl: firstString(
      item.bandProfileImageUrl,
      item.bandImageUrl,
      item.profileImageUrl,
    ),
    contentImageUrl: firstString(
      item.imageUrl,
      item.contentImageUrl,
      item.thumbnailUrl,
      item.mediaUrl,
      item.mediaUrls,
      item.imageUrls,
    ),
  };
};

const mapBandItem = (
  item: FanHomeRecommendedBand,
  index: number,
): BandCardItem => {
  const band = item.band ?? item;
  const bandId =
    toNumericId(band.bandId) ??
    toNumericId(item.bandId) ??
    toNumericId(band.targetBandId) ??
    toNumericId(item.targetBandId) ??
    toNumericId(band.id) ??
    toNumericId(item.id);

  return {
    id: String(bandId ?? index),
    bandId,
    name: band.bandName ?? band.name ?? item.bandName ?? item.name ?? "밴드명",
    meta:
      compactMeta([band.genre ?? item.genre, band.region ?? item.region]) ||
      "장르 · 지역",
    description:
      band.description ??
      band.bandDescription ??
      band.introduction ??
      item.description ??
      item.bandDescription ??
      item.introduction,
    imageUrl: firstString(
      band.bandProfileImageUrl,
      band.bandImageUrl,
      band.profileImageUrl,
      band.imageUrl,
      item.bandProfileImageUrl,
      item.bandImageUrl,
      item.profileImageUrl,
      item.imageUrl,
    ),
    isFollowing:
      band.isFollowing ??
      band.following ??
      band.followed ??
      item.isFollowing ??
      item.following ??
      item.followed ??
      false,
  };
};

const mapConcertItem = (
  item: FanHomeConcert,
  index: number,
): ConcertCardItem => {
  const date = getConcertDate(item);

  return {
    id: String(item.performanceId ?? item.concertId ?? item.id ?? index),
    title:
      item.performanceTitle ??
      item.performanceName ??
      item.concertTitle ??
      item.concertName ??
      item.showTitle ??
      item.showName ??
      item.name ??
      item.title ??
      "공연명",
    location: item.location ?? item.venue ?? item.place ?? "공연 장소 미정",
    dateTime: formatDateTime(date),
    status: item.status ?? formatDday(item, date),
    month: date ? MONTH_LABELS[date.getMonth()] : "TBD",
    day: date ? String(date.getDate()).padStart(2, "0") : "--",
    thumbnailUrl: firstString(
      item.posterImageUrl,
      item.posterUrl,
      item.performanceImageUrl,
      item.imageUrl,
      item.mainImageUrl,
      item.thumbnailUrl,
      item.imageUrls,
    ),
  };
};

const mapHomeResponse = (data?: FanHomeResponse) => {
  const news = firstList(
    data?.followingBandNews,
    data?.followedBandNews,
    data?.followedNews,
    data?.news,
  ).map(mapNewsItem);
  const recommendedBands = firstList(
    data?.recommendedBands,
    data?.recommendBands,
  ).map(mapBandItem);
  const performances = firstList(
    data?.performances,
    data?.upcomingConcerts,
    data?.followedConcerts,
    data?.recommendedConcerts,
    data?.recommendConcerts,
    data?.popularConcerts,
  ).map(mapConcertItem);

  return {
    hasFollowingBands: data?.hasFollowingBands === true,
    hasUnreadNotification:
      data?.hasUnreadNotification ?? data?.hasUnreadNotifications ?? false,
    news,
    recommendedBands,
    performances,
  };
};

const getPendingPerformanceTitle = (
  performance?: PendingPerformanceParticipationItem,
) => {
  if (!performance) return null;

  return (
    performance.performanceTitle ??
    performance.performanceName ??
    performance.concertName ??
    performance.showTitle ??
    performance.showName ??
    performance.name ??
    performance.title ??
    null
  );
};

export function FanTabHomeScreen() {
  const fanHomeQuery = useFanHomeQuery();
  const upcomingQuery = useUpcomingPerformancesInfiniteQuery("IMMINENT", 4);
  const notificationsQuery = useNotificationsInfiniteQuery();
  const pendingParticipationQuery = usePendingPerformanceParticipationQuery();
  const completeParticipationMutation = useCompletePerformanceParticipation();
  const deleteParticipationMutation = useDeletePerformanceParticipation();
  const [answeredPendingIds, setAnsweredPendingIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [isParticipationModalDismissed, setIsParticipationModalDismissed] =
    useState(false);
  const [participationError, setParticipationError] = useState<string | null>(
    null,
  );
  const [isModeSwitchOpen, setIsModeSwitchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);
  const home = mapHomeResponse(fanHomeQuery.data);
  const upcomingConcerts =
    upcomingQuery.data?.pages
      .flatMap((page) => page.items)
      .map(mapConcertItem) ?? [];
  const concerts = upcomingConcerts.length > 0 ? upcomingConcerts : home.performances;
  const isLoading = fanHomeQuery.isLoading || upcomingQuery.isLoading;
  const isError = fanHomeQuery.isError || upcomingQuery.isError;
  const notificationItems =
    notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnreadNotification =
    notificationItems.length > 0
      ? notificationItems.some((notification) => !notification.isRead)
      : home.hasUnreadNotification;
  const pendingPerformances = useMemo(
    () =>
      (pendingParticipationQuery.data?.items ?? []).filter(
        (item) => !answeredPendingIds.has(item.performanceId),
      ),
    [answeredPendingIds, pendingParticipationQuery.data?.items],
  );
  const currentPendingPerformance = pendingPerformances[0];
  const currentPendingPerformanceTitle = getPendingPerformanceTitle(
    currentPendingPerformance,
  );
  const isParticipationResponding =
    completeParticipationMutation.isPending ||
    deleteParticipationMutation.isPending;

  const retry = () => {
    void fanHomeQuery.refetch();
    void upcomingQuery.refetch();
  };

  const handleNotificationPress = () => {
    router.push(
      "/fan/home/notifications" as Parameters<typeof router.push>[0],
    );
  };

  const removeCurrentPendingPerformance = () => {
    if (!currentPendingPerformance) return;

    setAnsweredPendingIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(currentPendingPerformance.performanceId);
      return nextIds;
    });
    setParticipationError(null);
  };

  const handleParticipationComplete = async () => {
    if (!currentPendingPerformance || isParticipationResponding) return;

    try {
      await completeParticipationMutation.mutateAsync(
        currentPendingPerformance.performanceId,
      );
      removeCurrentPendingPerformance();
    } catch {
      setParticipationError("참여 여부를 저장하지 못했어요.");
    }
  };

  const handleParticipationDelete = async () => {
    if (!currentPendingPerformance || isParticipationResponding) return;

    try {
      await deleteParticipationMutation.mutateAsync(
        currentPendingPerformance.performanceId,
      );
      removeCurrentPendingPerformance();
    } catch {
      setParticipationError("참여 여부를 저장하지 못했어요.");
    }
  };

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <HomeHeader
          hasUnreadNotification={hasUnreadNotification}
          onModeSwitch={() => setIsModeSwitchOpen(true)}
          onNotificationPress={handleNotificationPress}
        />

        <View style={styles.content}>
          {isLoading ? (
            <LoadingBlock />
          ) : isError ? (
            <View style={styles.messageBlock}>
              <Text style={styles.errorText}>홈 정보를 불러오지 못했어요</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={retry}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Section title="팔로우한 밴드 소식">
                {!home.hasFollowingBands ? (
                  <EmptyFollowCard />
                ) : home.news.length > 0 ? (
                  <NewsCarousel items={home.news} />
                ) : (
                  <InlineEmpty text="새로운 밴드 소식이 없어요" />
                )}
              </Section>

              {home.recommendedBands.length > 0 ? (
                <Section
                  title="이런 밴드는 어때요?"
                  description="관심사 장르 · 지역 기반 추천"
                  onMorePress={() =>
                    router.push("/fan/explore" as Parameters<typeof router.push>[0])
                  }
                >
                  <BandRecommendationStrip
                    bands={home.recommendedBands}
                    onFollowChanged={() => {
                      void fanHomeQuery.refetch();
                    }}
                    onToast={setToastMessage}
                  />
                </Section>
              ) : null}

              <Section
                title={
                  home.hasFollowingBands ? "다가오는 공연" : "이런 공연은 어때요?"
                }
                description={
                  home.hasFollowingBands
                    ? undefined
                    : "지금 인기 있는 공연을 추천해드릴게요!"
                }
                onMorePress={() =>
                  router.push(
                    "/fan/home/concerts" as Parameters<typeof router.push>[0],
                  )
                }
              >
                {concerts.length > 0 ? (
                  <View style={styles.concertList}>
                    {concerts.slice(0, 4).map((item) => (
                      <ConcertCard key={item.id} item={item} />
                    ))}
                  </View>
                ) : (
                  <InlineEmpty text="표시할 공연이 없어요" />
                )}
              </Section>
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        open={Boolean(currentPendingPerformance) && !isParticipationModalDismissed}
        title="공연은 재미있게 보셨나요?"
        description={[
          currentPendingPerformanceTitle
            ? `${currentPendingPerformanceTitle}에 참여했다면`
            : "참여했다면",
          "'참여했어요'를 눌러주세요",
          participationError,
        ]
          .filter(Boolean)
          .join("\n")}
        cancelLabel={
          deleteParticipationMutation.isPending ? "처리 중" : "불참했어요"
        }
        confirmLabel={
          completeParticipationMutation.isPending ? "처리 중" : "참여했어요"
        }
        onCancel={() => void handleParticipationDelete()}
        onConfirm={() => void handleParticipationComplete()}
        onBackdropPress={() => setIsParticipationModalDismissed(true)}
      />

      <ModeSwitchSheet
        open={isModeSwitchOpen}
        onClose={() => setIsModeSwitchOpen(false)}
      />

      <Toast
        open={toastMessage !== null}
        message={toastMessage}
        tone={toastMessage?.includes("실패") ? "error" : "success"}
        onClose={closeToast}
      />
    </Screen>
  );
}

function HomeHeader({
  hasUnreadNotification,
  onModeSwitch,
  onNotificationPress,
}: {
  hasUnreadNotification: boolean;
  onModeSwitch: () => void;
  onNotificationPress: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="모드 전환"
        hitSlop={12}
        style={styles.headerIconButton}
        onPress={onModeSwitch}
      >
        <SwapIcon />
      </Pressable>

      <View pointerEvents="none" style={styles.headerLogo}>
        <BSceneLogo width={105} height={20} />
      </View>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="공연 목록"
          hitSlop={12}
          style={styles.headerIconButton}
          onPress={() =>
            router.push("/fan/home/concerts" as Parameters<typeof router.push>[0])
          }
        >
          <CalendarIcon />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="알림"
          hitSlop={12}
          style={styles.headerIconButton}
          onPress={onNotificationPress}
        >
          <NotificationBellIcon hasUnread={hasUnreadNotification} />
        </Pressable>
      </View>
    </View>
  );
}

function Section({
  title,
  description,
  onMorePress,
  children,
}: {
  title: string;
  description?: string;
  onMorePress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleGroup}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {description ? (
            <Text style={styles.sectionDescription}>{description}</Text>
          ) : null}
        </View>

        {onMorePress ? (
          <Pressable
            accessibilityRole="button"
            style={styles.moreButton}
            onPress={onMorePress}
          >
            <Text style={styles.moreText}>더보기</Text>
            <View style={styles.moreIcon}>
              <AppIcon name="concertArrow" size={24} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function EmptyFollowCard() {
  return (
    <View style={styles.emptyFollowCard}>
      <View style={styles.emptyFollowCopy}>
        <Text style={styles.emptyFollowTitle}>아직 팔로우한 밴드가 없어요</Text>
        <Text style={styles.emptyFollowDescription}>
          탐색 탭에서 마음에 드는 밴드를{"\n"}팔로우하면 소식을 볼 수 있어요
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.exploreButton}
          onPress={() =>
            router.push("/fan/explore" as Parameters<typeof router.push>[0])
          }
        >
          <Text style={styles.exploreButtonText}>밴드 탐색하기</Text>
        </Pressable>
      </View>

      <Image
        source={require("../../../assets/images/home/speaker.png")}
        resizeMode="contain"
        style={styles.speaker}
      />
    </View>
  );
}

function NewsCarousel({ items }: { items: NewsCardItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxOffset = contentSize.width - layoutMeasurement.width;

    if (maxOffset <= 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex(
      Math.min(
        items.length - 1,
        Math.max(
          0,
          Math.round((contentOffset.x / maxOffset) * (items.length - 1)),
        ),
      ),
    );
  };

  return (
    <View>
      <ScrollView
        horizontal
        decelerationRate="fast"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToInterval={NEWS_CARD_WIDTH + NEWS_CARD_GAP}
        style={styles.bleed}
        contentContainerStyle={styles.newsScroll}
        onScroll={handleScroll}
      >
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.newsDots}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.newsDot,
                index === activeIndex && styles.newsDotActive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function NewsCard({ item }: { item: NewsCardItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title} 상세보기`}
      disabled={item.detailId == null}
      style={styles.newsCard}
      onPress={() => {
        if (item.detailId == null) return;
        router.push(
          `/fan/explore/contents/${item.detailId}` as Parameters<typeof router.push>[0],
        );
      }}
    >
      <View style={styles.newsHeader}>
        <ProfileImage imageUrl={item.profileImageUrl} size={36} variant="band" />
        <View style={styles.newsTitleGroup}>
          <Text numberOfLines={1} style={styles.newsBandName}>
            {item.bandName}
          </Text>
          <Text numberOfLines={1} style={styles.newsMeta}>
            {item.meta}
          </Text>
        </View>
      </View>

      {item.contentImageUrl ? (
        <Image
          source={{ uri: item.contentImageUrl }}
          resizeMode="cover"
          style={styles.newsImage}
        />
      ) : null}

      <Text numberOfLines={2} style={styles.newsText}>
        {item.title}
      </Text>

      {item.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {item.tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tagChip, tag.trim().length === 2 && styles.tagChipShort]}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function BandRecommendationStrip({
  bands,
  onFollowChanged,
  onToast,
}: {
  bands: BandCardItem[];
  onFollowChanged: () => void;
  onToast: (message: string) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const followMutation = useFollowExploreBand();
  const unfollowMutation = useUnfollowExploreBand();
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [pendingBandId, setPendingBandId] = useState<number | null>(null);
  const [unfollowTarget, setUnfollowTarget] = useState<BandCardItem | null>(null);
  const isFollowPending = followMutation.isPending || unfollowMutation.isPending;
  const itemWidth = (windowWidth - 40 - 36) / 4;

  const runFollowChange = (band: BandCardItem, nextIsFollowing: boolean) => {
    const bandId = band.bandId;

    if (bandId == null) return;

    setPendingBandId(bandId);
    setFollowOverrides((currentOverrides) => ({
      ...currentOverrides,
      [band.id]: nextIsFollowing,
    }));

    const mutation = nextIsFollowing ? followMutation : unfollowMutation;

    mutation.mutate(bandId, {
      onSuccess: () => {
        onFollowChanged();
        onToast(
          nextIsFollowing
            ? `${band.name}를 팔로우했어요`
            : `${band.name} 팔로우를 취소했어요`,
        );
      },
      onError: () => {
        setFollowOverrides((currentOverrides) => ({
          ...currentOverrides,
          [band.id]: !nextIsFollowing,
        }));
        onToast(
          nextIsFollowing
            ? "밴드 팔로우에 실패했어요"
            : "팔로우 취소에 실패했어요",
        );
      },
      onSettled: () => {
        setPendingBandId(null);
      },
    });
  };

  const toggleFollow = (band: BandCardItem) => {
    if (band.bandId == null || pendingBandId === band.bandId) return;

    if (followOverrides[band.id] ?? band.isFollowing) {
      setUnfollowTarget(band);
      return;
    }

    runFollowChange(band, true);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.bandStrip}
      >
        {bands.map((band) => {
          const isFollowing = followOverrides[band.id] ?? band.isFollowing;
          const isBandPending = isFollowPending && pendingBandId === band.bandId;

          return (
            <View key={band.id} style={[styles.recommendBand, { width: itemWidth }]}>
              <Pressable
                accessibilityRole="button"
                disabled={band.bandId == null}
                style={styles.recommendBandLink}
                onPress={() => {
                  if (band.bandId == null) return;
                  router.push(
                    `/fan/bands/${band.bandId}` as Parameters<
                      typeof router.push
                    >[0],
                  );
                }}
              >
                <ProfileImage imageUrl={band.imageUrl} size={52} variant="band" />
                <Text numberOfLines={1} style={styles.recommendBandName}>
                  {band.name}
                </Text>
                <Text numberOfLines={1} style={styles.recommendBandMeta}>
                  {band.meta}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={band.bandId == null || isBandPending}
                style={[
                  styles.followButton,
                  (band.bandId == null || isBandPending) &&
                    styles.followButtonDisabled,
                ]}
                onPress={() => toggleFollow(band)}
              >
                <Text style={styles.followButtonText}>
                  {isFollowing ? "팔로잉" : "팔로우"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <ConfirmModal
        open={unfollowTarget !== null}
        title="팔로우를 취소할까요?"
        description={"이 밴드의 소식이\n홈피드에서 사라져요"}
        onCancel={() => setUnfollowTarget(null)}
        onConfirm={() => {
          if (unfollowTarget) runFollowChange(unfollowTarget, false);
          setUnfollowTarget(null);
        }}
      />
    </>
  );
}

function ConcertCard({ item }: { item: ConcertCardItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title} 상세보기`}
      style={styles.concertCard}
      onPress={() =>
        router.push(
          `/fan/home/concerts/${item.id}` as Parameters<typeof router.push>[0],
        )
      }
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          resizeMode="cover"
          style={styles.concertThumbnail}
        />
      ) : (
        <View
          style={[
            styles.dateBadge,
            item.status === "준비중" && styles.dateBadgePending,
          ]}
        >
          <Text style={styles.dateMonth}>{item.month}</Text>
          <Text style={styles.dateDay}>{item.day}</Text>
        </View>
      )}

      <View style={styles.concertText}>
        <View style={styles.concertTitleGroup}>
          <Text numberOfLines={1} style={styles.concertTitle}>
            {item.title}
          </Text>
          <View style={styles.concertLocation}>
            <AppIcon name="concertLocation" size={14} />
            <Text numberOfLines={1} style={styles.concertVenue}>
              {item.location}
            </Text>
          </View>
        </View>
        <View style={styles.concertMeta}>
          <Text numberOfLines={1} style={styles.concertDateTime}>
            {item.dateTime}
          </Text>
          <Text style={styles.concertDivider}>|</Text>
          <Text style={styles.concertStatus}>{item.status}</Text>
        </View>
      </View>

      <AppIcon name="concertArrow" size={24} />
    </Pressable>
  );
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <View style={styles.messageBlock}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function LoadingBlock() {
  return (
    <PulseView style={styles.loadingList}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.loadingCard} />
      ))}
    </PulseView>
  );
}

function SwapIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 3L14.5 20L19.5 15M9.5 21V4L4.5 9"
        stroke={colors.neutral900}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4H17V3C17 2.735 16.895 2.48 16.707 2.293C16.52 2.105 16.265 2 16 2C15.735 2 15.48 2.105 15.293 2.293C15.105 2.48 15 2.735 15 3V4H9V3C9 2.735 8.895 2.48 8.707 2.293C8.52 2.105 8.265 2 8 2C7.735 2 7.48 2.105 7.293 2.293C7.105 2.48 7 2.735 7 3V4H5C4.204 4 3.441 4.316 2.879 4.879C2.316 5.441 2 6.204 2 7V19C2 19.796 2.316 20.559 2.879 21.121C3.441 21.684 4.204 22 5 22H19C19.796 22 20.559 21.684 21.121 21.121C21.684 20.559 22 19.796 22 19V7C22 6.204 21.684 5.441 21.121 4.879C20.559 4.316 19.796 4 19 4ZM20 19C20 19.265 19.895 19.52 19.707 19.707C19.52 19.895 19.265 20 19 20H5C4.735 20 4.48 19.895 4.293 19.707C4.105 19.52 4 19.265 4 19V12H20V19ZM20 10H4V7C4 6.735 4.105 6.48 4.293 6.293C4.48 6.105 4.735 6 5 6H7V7C7 7.265 7.105 7.52 7.293 7.707C7.48 7.895 7.735 8 8 8C8.265 8 8.52 7.895 8.707 7.707C8.895 7.52 9 7.265 9 7V6H15V7C15 7.265 15.105 7.52 15.293 7.707C15.48 7.895 15.735 8 16 8C16.265 8 16.52 7.895 16.707 7.707C16.895 7.52 17 7.265 17 7V6H19C19.265 6 19.52 6.105 19.707 6.293C19.895 6.48 20 6.735 20 7V10Z"
        fill={colors.neutral900}
      />
    </Svg>
  );
}

function NotificationBellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <View>
      <Svg width={25} height={25} viewBox="0 0 25 25" fill="none">
        <Path
          d="M6 20V11C6 7.686 8.686 5 12 5C15.314 5 18 7.686 18 11V20M6 20H18M6 20H4M18 20H20"
          stroke={colors.neutral900}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M11 23L13 23"
          stroke={colors.neutral900}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={4} r={1} stroke={colors.neutral900} strokeWidth={2} />
        {hasUnread ? <Circle cx={23} cy={2} r={2} fill={colors.primary400} /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -20,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  headerIconButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  content: {
    gap: 32,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  sectionDescription: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 2,
  },
  moreText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  moreIcon: {
    opacity: 0.35,
  },
  emptyFollowCard: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    borderRadius: 12,
    backgroundColor: colors.primary0,
    paddingHorizontal: 19,
    paddingTop: 25,
    paddingBottom: 24,
  },
  emptyFollowCopy: {
    flex: 1,
    minWidth: 0,
  },
  emptyFollowTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  emptyFollowDescription: {
    ...textStyles.caption2,
    marginTop: 5,
    color: colors.neutral700,
  },
  exploreButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.primary400,
    paddingHorizontal: 17,
    paddingVertical: 7,
  },
  exploreButtonText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  speaker: {
    width: 87,
    height: 90,
  },
  bleed: {
    marginHorizontal: -20,
  },
  newsScroll: {
    gap: NEWS_CARD_GAP,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  newsCard: {
    width: NEWS_CARD_WIDTH,
    height: 238,
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
    boxShadow: "0px 0px 10px 1px rgba(20, 20, 20, 0.12)",
  },
  newsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newsTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  newsBandName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  newsMeta: {
    ...textStyles.body5,
    color: colors.neutral600,
  },
  newsImage: {
    width: "100%",
    height: 82,
    borderRadius: 8,
    backgroundColor: colors.neutral300,
  },
  newsText: {
    ...textStyles.caption2,
    color: colors.neutral900,
  },
  tagRow: {
    height: 20,
    flexDirection: "row",
    gap: 4,
    overflow: "hidden",
    marginTop: "auto",
  },
  tagChip: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.primary50,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tagChipShort: {
    minWidth: 32,
  },
  tagText: {
    ...textStyles.body5,
    color: colors.primary400,
  },
  newsDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  newsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral400,
  },
  newsDotActive: {
    backgroundColor: colors.primary300,
  },
  bandStrip: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  recommendBand: {
    alignItems: "center",
  },
  recommendBandLink: {
    width: "100%",
    alignItems: "center",
  },
  recommendBandName: {
    ...textStyles.body1,
    maxWidth: "100%",
    marginTop: 8,
    color: colors.neutral900,
  },
  recommendBandMeta: {
    ...textStyles.caption2,
    maxWidth: "100%",
    color: colors.neutral600,
  },
  followButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary400,
    paddingVertical: 4,
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    ...textStyles.caption3,
    color: colors.primary400,
  },
  concertList: {
    gap: 12,
  },
  concertCard: {
    ...shadows.card,
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  concertThumbnail: {
    width: 50,
    height: 62,
    borderRadius: 8,
    backgroundColor: colors.neutral300,
  },
  dateBadge: {
    width: 50,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary300,
  },
  dateBadgePending: {
    backgroundColor: colors.neutral300,
  },
  dateMonth: {
    color: "#FFFDFB",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 16,
  },
  dateDay: {
    marginTop: 4,
    color: "#FFFDFB",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24,
  },
  concertText: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  concertTitleGroup: {
    gap: 3,
  },
  concertTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  concertLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  concertVenue: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.neutral700,
  },
  concertMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  concertDateTime: {
    ...textStyles.body5,
    flexShrink: 1,
    color: colors.neutral500,
  },
  concertDivider: {
    ...textStyles.body5,
    color: colors.neutral400,
  },
  concertStatus: {
    ...textStyles.body5,
    color: colors.primary500,
  },
  messageBlock: {
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    ...textStyles.body3,
    color: colors.neutral600,
    textAlign: "center",
  },
  errorText: {
    ...textStyles.body3,
    color: colors.neutral700,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.primary400,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  loadingList: {
    gap: 12,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 348,
    height: 86,
    borderRadius: 12,
    backgroundColor: colors.neutral100,
  },
});
