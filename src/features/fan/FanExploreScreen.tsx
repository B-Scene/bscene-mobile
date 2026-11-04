import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import {
  DEFAULT_APPLIED_FILTERS,
  ExploreBandCard,
  ExploreFilterBar,
  ExploreFilterSheet,
  ExploreMessage,
  ExploreOptionSheet,
  useExploreFollow,
} from "@/features/fan/explore/ExploreParts";
import { mapExploreBand } from "@/features/fan/fanExploreMappers";
import { useRecommendedExploreBandsInfiniteQuery } from "@/hooks/api/fan/useFanExplore";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { Screen } from "@/shared/components/Screen";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";

const SORT_OPTIONS = ["추천순", "정확도순", "인기순"] as const;
type ExploreSortOption = (typeof SORT_OPTIONS)[number];

export function FanExploreScreen() {
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<ExploreSortOption>("추천순");
  const [registeredOnly, setRegisteredOnly] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_APPLIED_FILTERS);
  const hasAppliedFilter = Object.values(appliedFilters).some(
    (value) => value !== "전체",
  );
  const query = useRecommendedExploreBandsInfiniteQuery({
    size: 20,
    withDummy: registeredOnly ? false : undefined,
  });
  const { toggleFollow, followLayer } = useExploreFollow();

  const bands = useMemo(() => {
    const items = (query.data?.pages.flatMap((page) => page.items) ?? []).map(
      (band, index) => {
        const info = band.band ?? band;

        return {
          item: mapExploreBand(band, index),
          genre: info.genre ? getGenreLabel(info.genre) : "장르",
          region: info.region ? getRegionLabel(info.region) : "지역",
        };
      },
    );
    const filtered = items.filter(
      ({ genre, region }) =>
        (appliedFilters.genre === "전체" || genre === appliedFilters.genre) &&
        (appliedFilters.region === "전체" || region === appliedFilters.region),
    );

    return selectedSort === "인기순"
      ? [...filtered].sort(
          (a, b) => b.item.followerCount - a.item.followerCount,
        )
      : filtered;
  }, [appliedFilters, query.data, selectedSort]);

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <AppHeader
        title="탐색"
        showBack={false}
        style={styles.header}
        rightContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="검색"
            hitSlop={12}
            onPress={() => router.push("/fan/explore/search" as Href)}
          >
            <AppIcon name="exploreSearchDark" size={20} />
          </Pressable>
        }
      />

      <ExploreFilterBar
        requireFilterForSort
        appliedFilters={appliedFilters}
        appliedSort={selectedSort === "추천순" ? null : selectedSort}
        highlightSort={selectedSort !== "추천순"}
        disabledFilterIds={["content"]}
        registeredOnly={registeredOnly}
        onRegisteredOnlyChange={setRegisteredOnly}
        onSortPress={() => setIsSortSheetOpen(true)}
        onFilterPress={() => setIsFilterSheetOpen(true)}
      />

      <FlatList
        data={query.isLoading || query.isError ? [] : bands}
        keyExtractor={({ item }) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: hasAppliedFilter ? 16 : 24 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          !hasAppliedFilter ? (
            <View style={styles.intro}>
              <Text style={styles.introTitle}>회원님을 위한 추천 밴드</Text>
              <Text style={styles.introDescription}>
                회원님의 취향과 활동을 기반으로 추천해요
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          query.isLoading ? (
            <ExploreMessage message="추천 밴드를 불러오는 중이에요" />
          ) : query.isError ? (
            <ExploreMessage
              actionLabel="추천 밴드 다시 불러오기"
              onAction={() => void query.refetch()}
            />
          ) : (
            <ExploreMessage message="조건에 맞는 밴드가 없어요" />
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ExploreMessage message="더 불러오는 중이에요" />
            </View>
          ) : undefined
        }
        renderItem={({ item: { item, genre, region } }) => (
          <ExploreBandCard
            band={item}
            subtitle={`${genre} · ${region}`}
            onToggleFollow={() => void toggleFollow(item)}
          />
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
      />

      <ExploreOptionSheet
        open={isSortSheetOpen}
        options={SORT_OPTIONS}
        selected={selectedSort}
        disabledOptions={hasAppliedFilter ? [] : ["정확도순", "인기순"]}
        onClose={() => setIsSortSheetOpen(false)}
        onSelect={setSelectedSort}
      />
      <ExploreFilterSheet
        open={isFilterSheetOpen}
        appliedFilters={appliedFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={setAppliedFilters}
      />

      {followLayer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: 24,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  intro: {
    marginBottom: 16,
  },
  introTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  introDescription: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
});
