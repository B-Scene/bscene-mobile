import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { FanConcertCard } from "@/features/fan/FanConcertCard";
import { mapPerformanceToConcert } from "@/features/fan/concertMappers";
import {
  useFanHomeQuery,
  useRecommendedPerformancesInfiniteQuery,
  useUpcomingPerformancesInfiniteQuery,
} from "@/hooks/api/fan/useFanHome";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

import type {
  RecommendedPerformanceSort,
  UpcomingPerformanceSort,
} from "@/types/fan/home";

const UPCOMING_SORT_OPTIONS = ["공연임박순", "최신순", "인기순"] as const;
const RECOMMENDED_SORT_OPTIONS = ["인기순", "공연임박순"] as const;

type SortOption = (typeof UPCOMING_SORT_OPTIONS)[number];

const UPCOMING_SORT_TO_API: Record<SortOption, UpcomingPerformanceSort> = {
  공연임박순: "IMMINENT",
  최신순: "LATEST",
  인기순: "POPULAR",
};

const RECOMMENDED_SORT_TO_API: Record<string, RecommendedPerformanceSort> = {
  인기순: "POPULAR",
  공연임박순: "IMMINENT",
};

export function FanConcertListScreen() {
  const [selectedSort, setSelectedSort] = useState<SortOption | null>(null);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const fanHomeQuery = useFanHomeQuery();
  const useRecommended =
    fanHomeQuery.data?.performanceType === "RECOMMENDED" ||
    fanHomeQuery.data?.hasFollowingBands === false;
  const canResolveSource = fanHomeQuery.isSuccess || fanHomeQuery.isError;
  const sortOptions: readonly SortOption[] = useRecommended
    ? RECOMMENDED_SORT_OPTIONS
    : UPCOMING_SORT_OPTIONS;
  const defaultSort: SortOption = useRecommended ? "인기순" : "공연임박순";
  const effectiveSort =
    selectedSort && sortOptions.includes(selectedSort)
      ? selectedSort
      : defaultSort;
  const upcomingQuery = useUpcomingPerformancesInfiniteQuery(
    UPCOMING_SORT_TO_API[effectiveSort],
    10,
    canResolveSource && !useRecommended,
  );
  const recommendedQuery = useRecommendedPerformancesInfiniteQuery(
    RECOMMENDED_SORT_TO_API[effectiveSort] ?? "POPULAR",
    10,
    canResolveSource && useRecommended,
  );
  const query = useRecommended ? recommendedQuery : upcomingQuery;
  const concerts =
    query.data?.pages
      .flatMap((page) => page.items)
      .map(mapPerformanceToConcert) ?? [];
  const isLoading = !canResolveSource || query.isLoading;

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader
        title={useRecommended ? "추천 공연" : "공연 일정"}
        style={styles.header}
      />

      <View style={styles.sortRow}>
        <Pressable
          accessibilityRole="button"
          style={[styles.sortChip, selectedSort && styles.sortChipSelected]}
          onPress={() => setIsSortSheetOpen(true)}
        >
          <Text
            style={[
              styles.sortChipText,
              selectedSort && styles.sortChipTextSelected,
            ]}
          >
            {effectiveSort}
          </Text>
          <Svg width={12} height={7} viewBox="0 0 12 7" fill="none">
            <Path
              d="M1 1L6 6L11 1"
              stroke={selectedSort ? colors.primary400 : colors.neutral600}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>

      <FlatList
        data={concerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.message}>공연을 불러오는 중이에요</Text>
          ) : query.isError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>공연을 불러오지 못했어요</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={() => {
                  void query.refetch();
                  void fanHomeQuery.refetch();
                }}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <Text style={styles.footerText}>더 불러오는 중이에요</Text>
          ) : undefined
        }
        renderItem={({ item }) => <FanConcertCard item={item} />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
      />

      <BottomSheetModal
        open={isSortSheetOpen}
        closeLabel="정렬 옵션 닫기"
        onClose={() => setIsSortSheetOpen(false)}
      >
        <View style={styles.sheet}>
          {sortOptions.map((option) => {
            const isSelected = option === effectiveSort;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                style={styles.sheetOption}
                onPress={() => {
                  setSelectedSort(option);
                  setIsSortSheetOpen(false);
                }}
              >
                <Text
                  style={[styles.sheetText, isSelected && styles.sheetTextSelected]}
                >
                  {option}
                </Text>
                {isSelected ? <AppIcon name="checkActive" size={20} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: 15,
  },
  sortRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    paddingLeft: 17,
    paddingRight: 18,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.neutral400,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sortChipSelected: {
    borderColor: colors.primary400,
    backgroundColor: colors.primary0,
  },
  sortChipText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  sortChipTextSelected: {
    color: colors.primary400,
  },
  list: {
    gap: 12,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 24,
  },
  message: {
    ...textStyles.body3,
    color: colors.neutral600,
    paddingVertical: 24,
    textAlign: "center",
  },
  errorBox: {
    alignItems: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  errorText: {
    ...textStyles.body3,
    color: colors.neutral700,
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
  footerText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
  sheet: {
    gap: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 30,
    paddingTop: 32,
    paddingBottom: 48,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetText: {
    ...textStyles.label2,
    color: colors.neutral900,
  },
  sheetTextSelected: {
    color: colors.primary400,
  },
});
