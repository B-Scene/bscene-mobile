import { router } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  useFanHomeQuery,
  useUpcomingPerformancesInfiniteQuery,
} from "@/hooks/api/fan/useFanHome";
import { BSceneLogo } from "@/features/onboarding/BSceneBrandAssets";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type {
  FanHomeConcert,
  FanHomeNewsItem,
  FanHomeRecommendedBand,
  FanHomeResponse,
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

export function FanTabHomeScreen() {
  const fanHomeQuery = useFanHomeQuery();
  const upcomingQuery = useUpcomingPerformancesInfiniteQuery("IMMINENT", 4);
  const home = mapHomeResponse(fanHomeQuery.data);
  const upcomingConcerts =
    upcomingQuery.data?.pages
      .flatMap((page) => page.items)
      .map(mapConcertItem) ?? [];
  const concerts = upcomingConcerts.length > 0 ? upcomingConcerts : home.performances;
  const isLoading = fanHomeQuery.isLoading || upcomingQuery.isLoading;
  const isError = fanHomeQuery.isError || upcomingQuery.isError;

  const retry = () => {
    void fanHomeQuery.refetch();
    void upcomingQuery.refetch();
  };

  return (
    <Screen contentStyle={styles.container}>
      <HomeHeader hasUnreadNotification={home.hasUnreadNotification} />

      {isLoading ? (
        <AppState loading title="팬 홈을 불러오는 중이에요" />
      ) : isError ? (
        <AppState
          title="홈 정보를 불러오지 못했어요"
          description="네트워크 상태나 로그인 상태를 확인한 뒤 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={retry}
        />
      ) : (
        <View style={styles.content}>
          {!home.hasFollowingBands ? (
            <EmptyFollowCard />
          ) : (
            <Section title="팔로우한 밴드 소식" onMorePress={undefined}>
              {home.news.length > 0 ? (
                <NewsCarousel items={home.news} />
              ) : (
                <InlineEmpty text="새로운 밴드 소식이 없어요" />
              )}
            </Section>
          )}

          {home.recommendedBands.length > 0 ? (
            <Section
              title="이런 밴드는 어때요?"
              description="관심사 장르 · 지역 기반 추천"
              onMorePress={() =>
                router.push("/fan/explore" as Parameters<typeof router.push>[0])
              }
            >
              <BandRecommendationStrip bands={home.recommendedBands} />
            </Section>
          ) : null}

          <Section
            title={home.hasFollowingBands ? "다가오는 공연" : "이런 공연은 어때요?"}
            description={
              home.hasFollowingBands ? undefined : "지금 인기 있는 공연을 추천해드릴게요!"
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
        </View>
      )}
    </Screen>
  );
}

function HomeHeader({
  hasUnreadNotification,
}: {
  hasUnreadNotification: boolean;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="모드 전환"
        hitSlop={12}
        style={styles.headerIconButton}
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

        <View
          accessibilityRole="button"
          accessibilityLabel="알림"
          style={styles.headerIconButton}
        >
          <NotificationBellIcon hasUnread={hasUnreadNotification} />
        </View>
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
    <View style={styles.section}>
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
            <ArrowIcon />
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

      <SpeakerIllustration />
    </View>
  );
}

function NewsCarousel({ items }: { items: NewsCardItem[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.newsScroll}
    >
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </ScrollView>
  );
}

function NewsCard({ item }: { item: NewsCardItem }) {
  return (
    <Pressable
      accessibilityRole="button"
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
        <Avatar imageUrl={item.profileImageUrl} label={item.bandName} size={38} />
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
        <Image source={{ uri: item.contentImageUrl }} style={styles.newsImage} />
      ) : null}

      <Text numberOfLines={3} style={styles.newsText}>
        {item.title}
      </Text>

      {item.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {item.tags.slice(0, 2).map((tag) => (
            <Text key={tag} numberOfLines={1} style={styles.tagText}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function BandRecommendationStrip({ bands }: { bands: BandCardItem[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bandStrip}
    >
      {bands.map((band) => (
        <Pressable
          key={band.id}
          accessibilityRole="button"
          disabled={band.bandId == null}
          style={styles.recommendBand}
          onPress={() => {
            if (band.bandId == null) return;
            router.push(
              `/fan/explore/bands/${band.bandId}` as Parameters<typeof router.push>[0],
            );
          }}
        >
          <Avatar imageUrl={band.imageUrl} label={band.name} size={52} />
          <Text numberOfLines={1} style={styles.recommendBandName}>
            {band.name}
          </Text>
          <Text numberOfLines={1} style={styles.recommendBandMeta}>
            {band.meta}
          </Text>
          <View style={styles.followButton}>
            <Text style={styles.followButtonText}>
              {band.isFollowing ? "팔로잉" : "팔로우"}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ConcertCard({ item }: { item: ConcertCardItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.concertCard}
      onPress={() =>
        router.push(
          `/fan/home/concerts/${item.id}` as Parameters<typeof router.push>[0],
        )
      }
    >
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>{item.month}</Text>
        <Text style={styles.dateDay}>{item.day}</Text>
      </View>

      <View style={styles.concertText}>
        <Text numberOfLines={1} style={styles.concertTitle}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.concertLocation}>
          {item.location}
        </Text>
        <Text style={styles.concertMeta}>{item.dateTime}</Text>
      </View>

      <Text style={styles.concertStatus}>{item.status}</Text>
    </Pressable>
  );
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <View style={styles.inlineEmpty}>
      <Text style={styles.inlineEmptyText}>{text}</Text>
    </View>
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
      </Svg>
      {hasUnread ? <View style={styles.unreadDot} /> : null}
    </View>
  );
}

function ArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 17L15 12"
        stroke={colors.neutral400}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 12L10 7"
        stroke={colors.neutral400}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SpeakerIllustration() {
  return (
    <View style={styles.speaker}>
      <Svg width={87} height={90} viewBox="0 0 87 90" fill="none">
        <Circle cx={40} cy={45} r={29} fill={colors.primary50} />
        <Path
          d="M26 52H18C16.895 52 16 51.105 16 50V40C16 38.895 16.895 38 18 38H26L41 27V63L26 52Z"
          fill={colors.primary400}
        />
        <Path
          d="M50 36C53.2 39.2 53.2 50.8 50 54M58 28C65 35 65 55 58 62"
          stroke={colors.primary400}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.white,
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  unreadDot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary400,
  },
  content: {
    marginTop: 32,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  sectionDescription: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 1,
  },
  moreText: {
    color: colors.neutral400,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  emptyFollowCard: {
    minHeight: 139,
    borderRadius: 12,
    backgroundColor: colors.primary0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingHorizontal: 19,
    paddingTop: 25,
    paddingBottom: 24,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  emptyFollowCopy: {
    flex: 1,
    minWidth: 0,
  },
  emptyFollowTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  emptyFollowDescription: {
    color: colors.neutral700,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 5,
  },
  exploreButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: colors.primary400,
    marginTop: 12,
    paddingHorizontal: 17,
    paddingVertical: 7,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  speaker: {
    width: 87,
    height: 90,
  },
  newsScroll: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 3,
  },
  newsCard: {
    width: 280,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 14,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  newsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  newsTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  newsBandName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  newsMeta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  newsImage: {
    width: "100%",
    height: 112,
    borderRadius: 10,
    backgroundColor: colors.neutral200,
    marginTop: 12,
  },
  newsText: {
    color: colors.neutral900,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 12,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  tagText: {
    color: colors.primary400,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  bandStrip: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 1,
  },
  recommendBand: {
    width: 76,
    alignItems: "center",
  },
  recommendBandName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 8,
    maxWidth: "100%",
  },
  recommendBandMeta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    maxWidth: "100%",
  },
  followButton: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: colors.primary400,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  followButtonText: {
    color: colors.primary400,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  concertList: {
    gap: 12,
  },
  concertCard: {
    minHeight: 86,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dateBadge: {
    width: 54,
    height: 58,
    borderRadius: 10,
    backgroundColor: colors.primary300,
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  dateDay: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  concertText: {
    flex: 1,
    minWidth: 0,
  },
  concertTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  concertLocation: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  concertMeta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  concertStatus: {
    color: colors.primary500,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  inlineEmpty: {
    minHeight: 86,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral100,
    padding: 16,
  },
  inlineEmptyText: {
    color: colors.neutral600,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
