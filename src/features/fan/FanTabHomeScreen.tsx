import { router } from "expo-router";
import { Bell, CalendarDays, Repeat2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useFanHomeQuery,
  useUpcomingPerformancesInfiniteQuery,
} from "@/hooks/api/fan/useFanHome";
import { AppCard } from "@/shared/components/AppCard";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type {
  FanHomeConcert,
  FanHomeNewsItem,
  FanHomeRecommendedBand,
  FanHomeResponse,
} from "@/types/fan/home";

type NewsCardItem = {
  id: string;
  bandName: string;
  meta: string;
  title: string;
  profileImageUrl?: string | null;
};

type BandCardItem = {
  id: string;
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
};

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

const mapNewsItem = (item: FanHomeNewsItem, index: number): NewsCardItem => ({
  id: String(item.newsId ?? item.postId ?? item.contentId ?? item.id ?? index),
  bandName: item.bandName ?? "밴드명",
  meta: compactMeta([item.genre, item.region, formatPostedAgo(item)]) || "장르 · 지역",
  title: item.content ?? item.title ?? "새로운 소식이 도착했어요",
  profileImageUrl: firstString(
    item.bandProfileImageUrl,
    item.bandImageUrl,
    item.profileImageUrl,
  ),
});

const mapBandItem = (
  item: FanHomeRecommendedBand,
  index: number,
): BandCardItem => {
  const band = item.band ?? item;

  return {
    id: String(
      band.bandId ??
        item.bandId ??
        band.targetBandId ??
        item.targetBandId ??
        band.id ??
        item.id ??
        index,
    ),
    name: band.bandName ?? band.name ?? item.bandName ?? item.name ?? "밴드명",
    meta: compactMeta([band.genre ?? item.genre, band.region ?? item.region]) || "장르 · 지역",
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
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="모드 전환"
          hitSlop={12}
          style={styles.iconButton}
        >
          <Repeat2 size={23} color={colors.neutral900} />
        </Pressable>
        <Text style={styles.logo}>B:Scene</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="공연 캘린더"
            hitSlop={12}
            onPress={() =>
              router.push(
                "/fan/home/concerts/calendar" as Parameters<typeof router.push>[0],
              )
            }
          >
            <CalendarDays size={22} color={colors.neutral900} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            hitSlop={12}
            onPress={() =>
              router.push(
                "/fan/home/notifications" as Parameters<typeof router.push>[0],
              )
            }
          >
            <Bell
              size={22}
              color={
                home.hasUnreadNotification
                  ? colors.primary500
                  : colors.neutral900
              }
            />
          </Pressable>
        </View>
      </View>

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
        <>
          {!home.hasFollowingBands ? (
            <AppCard style={styles.heroCard}>
              <Text style={styles.heroTitle}>아직 팔로우한 밴드가 없어요</Text>
              <Text style={styles.heroDescription}>
                탐색 탭에서 마음에 드는 밴드를 팔로우하면 소식을 볼 수 있어요.
              </Text>
            </AppCard>
          ) : null}

          <Section title="팔로우한 밴드 소식">
            {home.news.length > 0 ? (
              <HorizontalList>
                {home.news.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </HorizontalList>
            ) : (
              <InlineEmpty text="새로운 밴드 소식이 없어요" />
            )}
          </Section>

          <Section title="이런 밴드는 어때요?" description="관심 장르 · 지역 기반 추천">
            {home.recommendedBands.length > 0 ? (
              <HorizontalList>
                {home.recommendedBands.map((item) => (
                  <BandCard key={item.id} item={item} />
                ))}
              </HorizontalList>
            ) : (
              <InlineEmpty text="추천할 밴드를 준비 중이에요" />
            )}
          </Section>

          <Section title={home.hasFollowingBands ? "다가오는 공연" : "이런 공연은 어때요?"}>
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
    </Screen>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function HorizontalList({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalContent}
    >
      {children}
    </ScrollView>
  );
}

function NewsCard({ item }: { item: NewsCardItem }) {
  return (
    <AppCard style={styles.newsCard}>
      <View style={styles.cardHeader}>
        <Avatar imageUrl={item.profileImageUrl} label={item.bandName} size={38} />
        <View style={styles.cardTitleGroup}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.bandName}
          </Text>
          <Text numberOfLines={1} style={styles.cardMeta}>
            {item.meta}
          </Text>
        </View>
      </View>
      <Text numberOfLines={3} style={styles.newsText}>
        {item.title}
      </Text>
    </AppCard>
  );
}

function BandCard({ item }: { item: BandCardItem }) {
  return (
    <AppCard style={styles.bandCard}>
      <Avatar imageUrl={item.imageUrl} label={item.name} size={58} />
      <Text numberOfLines={1} style={styles.bandName}>
        {item.name}
      </Text>
      <Text numberOfLines={1} style={styles.cardMeta}>
        {item.meta}
      </Text>
      {item.description ? (
        <Text numberOfLines={2} style={styles.bandDescription}>
          {item.description}
        </Text>
      ) : null}
      <Badge label={item.isFollowing ? "팔로잉" : "추천"} tone="pink" />
    </AppCard>
  );
}

function ConcertCard({ item }: { item: ConcertCardItem }) {
  return (
    <AppCard style={styles.concertCard}>
      <View style={styles.concertText}>
        <Text numberOfLines={1} style={styles.concertTitle}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.cardMeta}>
          {item.location}
        </Text>
        <Text style={styles.cardMeta}>{item.dateTime}</Text>
      </View>
      <Badge label={item.status} tone="yellow" />
    </AppCard>
  );
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <View style={styles.inlineEmpty}>
      <Text style={styles.inlineEmptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logo: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.sm,
    backgroundColor: colors.primary0,
    borderColor: colors.primary50,
  },
  heroTitle: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "900",
  },
  heroDescription: {
    color: colors.neutral700,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionDescription: {
    color: colors.neutral600,
    fontSize: 13,
  },
  horizontalContent: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  newsCard: {
    width: 254,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },
  cardMeta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  newsText: {
    color: colors.neutral800,
    fontSize: 14,
    lineHeight: 20,
  },
  bandCard: {
    width: 148,
    alignItems: "center",
    gap: spacing.sm,
  },
  bandName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },
  bandDescription: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  concertList: {
    gap: spacing.md,
  },
  concertCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  concertText: {
    flex: 1,
  },
  concertTitle: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "900",
  },
  inlineEmpty: {
    minHeight: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral100,
    padding: spacing.lg,
  },
  inlineEmptyText: {
    color: colors.neutral600,
    fontSize: 14,
    fontWeight: "600",
  },
});
