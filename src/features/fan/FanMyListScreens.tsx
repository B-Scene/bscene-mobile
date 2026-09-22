import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { useFollowedBandsQuery } from "@/hooks/api/user/useFollowedBands";
import { useInterestedPerformancesQuery } from "@/hooks/api/user/useInterestedPerformances";
import { usePerformanceHistoryQuery } from "@/hooks/api/user/usePerformanceHistory";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type { FollowedBandItem } from "@/types/user/followedBands";
import type { InterestedPerformanceItem } from "@/types/user/interestedPerformance";
import type { PerformanceHistoryItem } from "@/types/user/performanceHistory";

const formatPerformanceDateTime = (dateValue?: string, timeValue?: string) => {
  if (!dateValue) return "일정 미정";

  const date = new Date(
    timeValue && !dateValue.includes("T") ? `${dateValue}T${timeValue}` : dateValue,
  );

  if (Number.isNaN(date.getTime())) {
    return [dateValue, timeValue].filter(Boolean).join(" ");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hour}:${minute}`;
};

const getBandInfo = (band: FollowedBandItem) => band.band ?? band;

const getBandId = (band: FollowedBandItem) => {
  const bandInfo = getBandInfo(band);
  const numericId = Number(
    band.bandId ??
      bandInfo.bandId ??
      bandInfo.id ??
      band.targetBandId ??
      band.followingBandId ??
      band.followedBandId,
  );

  return Number.isFinite(numericId) ? numericId : null;
};

export function FollowedBandsScreen() {
  const query = useFollowedBandsQuery();
  const bands = query.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = query.data?.pages[0]?.totalCount ?? bands.length;

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="팔로우한 밴드" />
      <Text style={styles.countText}>팔로우한 밴드 {totalCount ?? 0}팀</Text>
      <ListState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={bands.length === 0}
        loadingTitle="팔로우한 밴드를 불러오는 중이에요"
        errorTitle="팔로우한 밴드를 불러오지 못했어요"
        emptyTitle="팔로우한 밴드가 없어요"
        onRetry={() => void query.refetch()}
      >
        <FlatList
          data={bands}
          keyExtractor={(item, index) => String(getBandId(item) ?? index)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <FollowedBandRow item={item} />}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.footerText}>더 불러오는 중이에요</Text>
            ) : null
          }
        />
      </ListState>
    </Screen>
  );
}

export function InterestedConcertsScreen() {
  const query = useInterestedPerformancesQuery("ALL");
  const concerts = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PerformanceList
      title="관심 공연"
      countLabel={`관심 공연 ${query.data?.pages[0]?.totalCount ?? concerts.length}개`}
      items={concerts}
      isLoading={query.isLoading}
      isError={query.isError}
      isFetchingNextPage={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      onRetry={() => void query.refetch()}
      onFetchNext={() => void query.fetchNextPage()}
      emptyTitle="관심 공연이 없어요"
      loadingTitle="관심 공연을 불러오는 중이에요"
      errorTitle="관심 공연을 불러오지 못했어요"
    />
  );
}

export function AttendedConcertsScreen() {
  const query = usePerformanceHistoryQuery("ALL");
  const concerts = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PerformanceList
      title="공연 참여 기록"
      countLabel={`참여 공연 ${query.data?.pages[0]?.totalCount ?? concerts.length}개`}
      items={concerts}
      isLoading={query.isLoading}
      isError={query.isError}
      isFetchingNextPage={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      onRetry={() => void query.refetch()}
      onFetchNext={() => void query.fetchNextPage()}
      emptyTitle="참여한 공연이 없어요"
      loadingTitle="공연 참여 기록을 불러오는 중이에요"
      errorTitle="공연 참여 기록을 불러오지 못했어요"
    />
  );
}

function FollowedBandRow({ item }: { item: FollowedBandItem }) {
  const bandInfo = getBandInfo(item);
  const bandId = getBandId(item);
  const name = bandInfo.name ?? bandInfo.bandName ?? "밴드";
  const imageUrl =
    bandInfo.profileImageUrl ??
    bandInfo.bandProfileImageUrl ??
    bandInfo.imageUrl;
  const followerCount = bandInfo.followerCount ?? bandInfo.followers ?? 0;
  const meta =
    [bandInfo.genre, bandInfo.region].filter(Boolean).join(" · ") ||
    "장르 · 지역";

  return (
    <AppCard style={styles.rowCard}>
      <Avatar imageUrl={imageUrl} label={name} size={48} />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          {meta} · 팔로워 {followerCount.toLocaleString()}명
        </Text>
      </View>
      <AppButton
        label="보기"
        variant="ghost"
        disabled={bandId == null}
        style={styles.compactButton}
        onPress={() => {
          if (bandId == null) return;
          router.push(`/fan/bands/${bandId}` as Parameters<typeof router.push>[0]);
        }}
      />
    </AppCard>
  );
}

function PerformanceList({
  title,
  countLabel,
  items,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  emptyTitle,
  loadingTitle,
  errorTitle,
  onRetry,
  onFetchNext,
}: {
  title: string;
  countLabel: string;
  items: (InterestedPerformanceItem | PerformanceHistoryItem)[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  emptyTitle: string;
  loadingTitle: string;
  errorTitle: string;
  onRetry: () => void;
  onFetchNext: () => void;
}) {
  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title={title} />
      <Text style={styles.countText}>{countLabel}</Text>
      <ListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        loadingTitle={loadingTitle}
        errorTitle={errorTitle}
        emptyTitle={emptyTitle}
        onRetry={onRetry}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.performanceId)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <PerformanceRow item={item} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              onFetchNext();
            }
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text style={styles.footerText}>더 불러오는 중이에요</Text>
            ) : null
          }
        />
      </ListState>
    </Screen>
  );
}

function PerformanceRow({
  item,
}: {
  item: InterestedPerformanceItem | PerformanceHistoryItem;
}) {
  const badgeLabel =
    "participationStatus" in item
      ? item.participationStatus === "COMPLETED"
        ? "참여 완료"
        : "예정"
      : "참여 완료";

  return (
    <AppCard style={styles.performanceCard}>
      <Avatar imageUrl={item.posterImageUrl} label={item.title} size={52} />
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          {item.venue}
        </Text>
        <Text style={styles.rowMeta}>
          {formatPerformanceDateTime(item.performanceDate, item.startTime)}
        </Text>
      </View>
      <View style={styles.performanceAction}>
        <Badge label={badgeLabel} tone="pink" />
        <AppButton
          label="상세"
          variant="ghost"
          style={styles.compactButton}
          onPress={() =>
            router.push(
              `/fan/home/concerts/${item.performanceId}` as Parameters<
                typeof router.push
              >[0],
            )
          }
        />
      </View>
    </AppCard>
  );
}

function ListState({
  isLoading,
  isError,
  isEmpty,
  loadingTitle,
  errorTitle,
  emptyTitle,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingTitle: string;
  errorTitle: string;
  emptyTitle: string;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (isLoading) return <AppState loading title={loadingTitle} />;
  if (isError) {
    return (
      <AppState
        title={errorTitle}
        description="잠시 후 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={onRetry}
      />
    );
  }
  if (isEmpty) return <AppState title={emptyTitle} />;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  countText: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  rowCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  performanceCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "900",
  },
  rowMeta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  performanceAction: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
