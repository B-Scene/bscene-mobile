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
import { FanEntryGuide, useFanEntryGuide, useFanGuideAnchor, type FanGuideAnchor } from "@/features/fan/FanEntryGuide";
import { FanDesignIcon } from "@/features/fan/FanDesignIcon";
import { fanDesignText as textStyles } from "@/features/fan/fanDesignText";
import { BSceneLogo } from "@/features/onboarding/BSceneBrandAssets";
import { ModeSwitchSheet } from "@/features/my/ModeSwitchSheet";
import { PulseView } from "@/features/post/PostDetailParts";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { colors, shadows } from "@/shared/constants/theme";
import { useDesignPreviewStore } from "@/stores/useDesignPreviewStore";
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
const HOME_GUTTER = 22;

const previewHomeBands: BandCardItem[] = Array.from({ length: 4 }, (_, index) => ({
  id: String(index),
  bandId: null,
  name: "밴드명",
  meta: "장르 · 지역",
  isFollowing: false,
}));

const previewHomeConcerts: ConcertCardItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: String(index),
  title: "WAVY 단독 공연",
  location: "홍대 롤링홀",
  dateTime: "2026. 05. 17. 18:00",
  status: "D-7",
  month: "MAY",
  day: "17",
}));

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
  const designPreviewEnabled = useDesignPreviewStore((state) => state.enabled);
  const isDesignPreview = __DEV__ && designPreviewEnabled;
  const fanHomeQuery = useFanHomeQuery(!isDesignPreview);
  const upcomingQuery = useUpcomingPerformancesInfiniteQuery(
    "IMMINENT",
    4,
    !isDesignPreview,
  );
  const notificationsQuery = useNotificationsInfiniteQuery(
    20,
    !isDesignPreview,
  );
  const pendingParticipationQuery = usePendingPerformanceParticipationQuery(
    !isDesignPreview,
  );
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
  const concerts = isDesignPreview
    ? previewHomeConcerts
    : upcomingConcerts.length > 0
      ? upcomingConcerts
      : home.performances;
  const recommendedBands = isDesignPreview ? previewHomeBands : home.recommendedBands;
  const isShowingRecommendedConcerts =
    upcomingConcerts.length === 0 &&
    concerts.length > 0 &&
    fanHomeQuery.data?.performanceType === "RECOMMENDED";
  const isLoading =
    !isDesignPreview && (fanHomeQuery.isLoading || upcomingQuery.isLoading);
  const isError =
    !isDesignPreview && (fanHomeQuery.isError || upcomingQuery.isError);
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

  const [guideTargetsLaidOut, setGuideTargetsLaidOut] = useState(false);
  const swapAnchor = useFanGuideAnchor();
  const calendarAnchor = useFanGuideAnchor();
  const emptyFollowAnchor = useFanGuideAnchor();
  const concertsAnchor = useFanGuideAnchor();
  const guide = useFanEntryGuide(
    "home",
    guideTargetsLaidOut &&
      !isLoading &&
      !isError &&
      !home.hasFollowingBands &&
      !currentPendingPerformance &&
      !isModeSwitchOpen,
    isDesignPreview,
  );
  const guideSteps = useMemo(() => [[
    {
      anchor: swapAnchor, padding: 7, radius: 19, labelPosition: "below",
      label: "팬 모드와 밴드 모드를\n전환할 수 있어요", labelWidth: 120, labelOffsetX: 32, circleIcon: "swap",
    },
    {
      anchor: calendarAnchor, padding: 7, radius: 19, labelPosition: "below",
      label: "달력으로\n공연 일정을 확인 할 수 있어요", labelWidth: 160, labelOffsetX: -8, circleIcon: "calendar",
    },
  ], [
    {
      anchor: emptyFollowAnchor, radius: 12, labelPosition: "above",
      label: "관심 있는 밴드를 팔로우하고\n최신 소식을 받아보세요", labelWidth: 160, labelOffsetY: -2,
    },
    {
      anchor: concertsAnchor, radius: 12, paddingX: 12, paddingY: 10.5, labelPosition: "above",
      label: "내 취향에 맞는 공연을\n추천받아보세요", labelWidth: 120, arrowRatio: 323 / 373, labelOffsetX: -6, labelOffsetY: -2, concertArrow: true,
    },
  ]] as const, [calendarAnchor, concertsAnchor, emptyFollowAnchor, swapAnchor]);

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
    <Screen edges={["top", "left", "right"]} scroll={false} contentStyle={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={!guide.open}
        contentContainerStyle={styles.container}
      >
        <HomeHeader
          hasUnreadNotification={hasUnreadNotification}
          swapAnchor={swapAnchor}
          calendarAnchor={calendarAnchor}
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
              <Section
                title="팔로우한 밴드 소식"
                onMorePress={
                  home.hasFollowingBands
                    ? () =>
                        router.push(
                          "/fan/home/news" as Parameters<typeof router.push>[0],
                        )
                    : undefined
                }
              >
                {!home.hasFollowingBands ? (
                  <EmptyFollowCard guideAnchor={emptyFollowAnchor} />
                ) : home.news.length > 0 ? (
                  <NewsCarousel items={home.news} />
                ) : (
                  <InlineEmpty text="새로운 밴드 소식이 없어요" />
                )}
              </Section>

              {!home.hasFollowingBands && recommendedBands.length > 0 ? (
                <Section
                  title="이런 밴드는 어때요?"
                  description="관심사 장르 · 지역 기반 추천"
                  onMorePress={() =>
                    router.push("/fan/explore" as Parameters<typeof router.push>[0])
                  }
                >
                  <BandRecommendationStrip
                    bands={recommendedBands}
                    onFollowChanged={() => {
                      void fanHomeQuery.refetch();
                    }}
                    onToast={setToastMessage}
                  />
                </Section>
              ) : null}

              <Section
                headingAnchor={concertsAnchor}
                onHeadingLayout={() => setGuideTargetsLaidOut(true)}
                title={
                  home.hasFollowingBands
                    ? isShowingRecommendedConcerts ? "다가오는 공연이 없어요" : "다가오는 공연"
                    : "이런 공연은 어때요?"
                }
                description={
                  !home.hasFollowingBands || isShowingRecommendedConcerts
                    ? "지금 인기 있는 공연을 추천해드릴게요!"
                    : undefined
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
                      <ConcertCard key={item.id} item={item} preview={isDesignPreview} />
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

      {guide.open ? <FanEntryGuide steps={guideSteps} onClose={guide.dismiss} /> : null}

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
  swapAnchor,
  calendarAnchor,
  onModeSwitch,
  onNotificationPress,
}: {
  hasUnreadNotification: boolean;
  swapAnchor: FanGuideAnchor;
  calendarAnchor: FanGuideAnchor;
  onModeSwitch: () => void;
  onNotificationPress: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        ref={swapAnchor}
        accessibilityRole="button"
        accessibilityLabel="모드 전환"
        hitSlop={12}
        style={styles.headerIconButton}
        onPress={onModeSwitch}
      >
        <FanDesignIcon name="swap" />
      </Pressable>

      <View pointerEvents="none" style={styles.headerLogo}>
        <BSceneLogo width={105} height={20} />
      </View>

      <View style={styles.headerActions}>
        <Pressable
          ref={calendarAnchor}
          accessibilityRole="button"
          accessibilityLabel="공연 캘린더"
          hitSlop={12}
          style={styles.headerIconButton}
          onPress={() =>
            router.push(
              "/fan/home/concerts/calendar" as Parameters<typeof router.push>[0],
            )
          }
        >
          <FanDesignIcon name="calendar" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="알림"
          hitSlop={12}
          style={styles.headerIconButton}
          onPress={onNotificationPress}
        >
          <FanDesignIcon name={hasUnreadNotification ? "notificationUnread" : "notification"} />
        </Pressable>
      </View>
    </View>
  );
}

function Section({
  title,
  description,
  onMorePress,
  headingAnchor,
  onHeadingLayout,
  children,
}: {
  title: string;
  description?: string;
  onMorePress?: () => void;
  headingAnchor?: FanGuideAnchor;
  onHeadingLayout?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View
        ref={headingAnchor}
        collapsable={false}
        onLayout={onHeadingLayout}
        style={[
          styles.sectionHeader,
          !onMorePress && styles.sectionHeaderWithoutAction,
          description && styles.sectionHeaderWithDescription,
        ]}
      >
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
            <FanDesignIcon name="moreArrow" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function EmptyFollowCard({ guideAnchor }: { guideAnchor: FanGuideAnchor }) {
  return (
    <View ref={guideAnchor} collapsable={false} style={styles.emptyFollowCard}>
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
        style={[styles.bleed, styles.newsViewport]}
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
        {item.profileImageUrl ? (
          <ProfileImage imageUrl={item.profileImageUrl} size={32} variant="band" />
        ) : (
          <View style={styles.newsAvatar}>
            <FanDesignIcon name="newsGuitar" />
          </View>
        )}
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
              style={styles.tagChip}
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
  const itemWidth = (windowWidth - HOME_GUTTER * 2 - NEWS_CARD_GAP * 3) / 4;

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
                {band.imageUrl ? (
                  <ProfileImage imageUrl={band.imageUrl} size={52} variant="band" />
                ) : (
                  <View style={styles.recommendBandPlaceholder} />
                )}
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
                  isFollowing && styles.followingButton,
                  isBandPending && styles.followButtonDisabled,
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

function ConcertCard({ item, preview }: { item: ConcertCardItem; preview: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title} 상세보기`}
      style={styles.concertCard}
      disabled={preview}
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
      ) : preview || item.day === "--" ? (
        <View style={[styles.concertThumbnail, styles.posterPlaceholder]}>
          <FanDesignIcon name="poster" />
        </View>
      ) : (
        <View style={styles.dateBadge}>
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
            <FanDesignIcon name="location" />
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

      <FanDesignIcon name="concertArrow" />
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

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 10,
  },
  container: {
    paddingHorizontal: HOME_GUTTER,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: -HOME_GUTTER,
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
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    minHeight: 24,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  sectionHeaderWithoutAction: {
    minHeight: 20,
  },
  sectionHeaderWithDescription: {
    minHeight: 42,
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
  },
  moreText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  emptyFollowCard: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    minHeight: 154,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: colors.primary0,
    paddingHorizontal: 19,
    paddingVertical: 24,
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
    width: 100,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  exploreButtonText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  speaker: {
    width: 87,
    height: 90,
    opacity: 0.8,
  },
  bleed: {
    marginHorizontal: -HOME_GUTTER,
  },
  newsViewport: {
    marginTop: -6,
  },
  newsScroll: {
    gap: NEWS_CARD_GAP,
    paddingHorizontal: HOME_GUTTER,
    paddingTop: 6,
    paddingBottom: 12,
  },
  newsCard: {
    width: NEWS_CARD_WIDTH,
    height: 238,
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
    ...shadows.card,
  },
  newsAvatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.neutral400,
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
    width: 156,
    height: 92,
    alignSelf: "center",
    backgroundColor: colors.neutral400,
  },
  newsText: {
    ...textStyles.caption2,
    color: colors.neutral900,
  },
  tagRow: {
    height: 18,
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
    paddingVertical: 3,
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
    backgroundColor: colors.primary400,
  },
  bandStrip: {
    gap: 12,
    paddingHorizontal: HOME_GUTTER,
  },
  recommendBand: {
    alignItems: "center",
  },
  recommendBandLink: {
    width: "100%",
    alignItems: "center",
  },
  recommendBandPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#d9d9d9",
  },
  recommendBandName: {
    ...textStyles.body1,
    maxWidth: "100%",
    marginTop: 4,
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
    marginTop: 4,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary400,
  },
  followingButton: {
    borderColor: colors.primary50,
    backgroundColor: colors.primary50,
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
    backgroundColor: colors.neutral400,
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  dateBadge: {
    width: 50,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary300,
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
