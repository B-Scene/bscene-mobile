import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import {
  ExploreBandCard,
  ExploreConcertCard,
  ExploreFilterBar,
  ExploreFilterSheet,
  ExploreMessage,
  ExploreNewsCard,
  ExploreOptionSheet,
  ExploreSearchBar,
  ExploreSectionTitle,
  getBandSubtitle,
  getExplorePath,
  getGenreFilterParam,
  getRegionFilterParam,
  getSearchSortLabel,
  getSearchTypeByContent,
  SEARCH_SORT_OPTIONS,
  SEARCH_SORT_TO_API,
  useExploreFollow,
  type AppliedExploreFilters,
  type ExploreSearchType,
} from "@/features/fan/explore/ExploreParts";
import {
  mapExploreBand,
  mapExploreContent,
  mapExplorePerformance,
} from "@/features/fan/fanExploreMappers";
import {
  useFanExploreBandSearchQuery,
  useFanExploreContentSearchQuery,
  useFanExplorePerformanceSearchQuery,
} from "@/hooks/api/fan/useFanExplore";
import { Screen } from "@/shared/components/Screen";

import type { FanExploreSearchSort } from "@/types/fan/explore";

const TYPE_CONFIG: Record<
  ExploreSearchType,
  { title: string; content: string; subject: string }
> = {
  bands: { title: "밴드", content: "밴드", subject: "밴드를" },
  concerts: { title: "공연", content: "공연", subject: "공연을" },
  contents: { title: "콘텐츠", content: "콘텐츠", subject: "콘텐츠를" },
};

type ListRow = { id: string; node: ReactNode };

export function FanExploreMoreScreen() {
  const params = useLocalSearchParams<{
    type?: string;
    q?: string;
    sort?: string;
    sortSelected?: string;
    genre?: string;
    region?: string;
  }>();
  const type: ExploreSearchType =
    params.type === "concerts" || params.type === "contents"
      ? params.type
      : "bands";
  const config = TYPE_CONFIG[type];
  const keyword = params.q ?? "";
  const sort: FanExploreSearchSort =
    params.sort === "POPULAR" ? "POPULAR" : "ACCURACY";
  const sortSelected = sort === "POPULAR" || params.sortSelected === "1";
  const appliedFilters: AppliedExploreFilters = {
    genre: params.genre || "전체",
    region: params.region || "전체",
    content: config.content,
  };
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const searchParams = {
    keyword,
    sort,
    size: 30,
    genre: getGenreFilterParam(appliedFilters.genre),
    region: getRegionFilterParam(appliedFilters.region),
  };
  const bandsQuery = useFanExploreBandSearchQuery(searchParams, type === "bands");
  const performancesQuery = useFanExplorePerformanceSearchQuery(
    searchParams,
    type === "concerts",
  );
  const contentsQuery = useFanExploreContentSearchQuery(
    searchParams,
    type === "contents",
  );
  const { toggleFollow, followLayer } = useExploreFollow();
  const query =
    type === "bands"
      ? bandsQuery
      : type === "concerts"
        ? performancesQuery
        : contentsQuery;
  const firstPage = query.data?.pages[0];

  const rows: ListRow[] =
    type === "bands"
      ? (bandsQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
          (band, index) => {
            const item = mapExploreBand(band, index);

            return {
              id: item.id,
              node: (
                <ExploreBandCard
                  band={item}
                  subtitle={getBandSubtitle(band)}
                  onToggleFollow={() => void toggleFollow(item)}
                />
              ),
            };
          },
        )
      : type === "concerts"
        ? (performancesQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
            (performance, index) => {
              const item = mapExplorePerformance(performance, index);

              return {
                id: item.id,
                node: (
                  <ExploreConcertCard
                    performance={performance}
                    performanceId={item.performanceId}
                    title={item.title}
                    location={item.meta}
                    dateLabel={item.dateLabel}
                    posterUrl={item.imageUrl}
                  />
                ),
              };
            },
          )
        : (contentsQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
            (content, index) => {
              const item = mapExploreContent(content, index);

              return {
                id: item.id,
                node: (
                  <ExploreNewsCard
                    content={content}
                    keyword={keyword}
                    postId={item.postId}
                  />
                ),
              };
            },
          );

  const totalCount =
    firstPage?.totalCount ??
    firstPage?.totalElements ??
    firstPage?.total ??
    rows.length;

  const navigateTo = (
    nextType: ExploreSearchType | null,
    nextSort: FanExploreSearchSort,
    nextSortSelected: boolean,
    filters: AppliedExploreFilters,
  ) => {
    router.replace(
      getExplorePath(nextType, {
        keyword,
        sort: nextSort,
        sortSelected: nextSortSelected,
        filters,
      }),
    );
  };

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <ExploreSearchBar
        key={keyword}
        initialKeyword={keyword}
        onSubmit={(nextKeyword) =>
          router.replace(
            getExplorePath(type, {
              keyword: nextKeyword,
              sort: "ACCURACY",
              sortSelected: false,
              filters: {
                genre: "전체",
                region: "전체",
                content: config.content,
              },
            }),
          )
        }
      />
      <ExploreFilterBar
        appliedFilters={appliedFilters}
        appliedSort={getSearchSortLabel(sort)}
        highlightSort={sortSelected}
        onSortPress={() => setIsSortSheetOpen(true)}
        onFilterPress={() => setIsFilterSheetOpen(true)}
      />

      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <ExploreSectionTitle title={config.title} count={totalCount} />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <ExploreMessage
              message={`${config.subject} 불러오는 중이에요`}
            />
          ) : query.isError ? (
            <ExploreMessage
              actionLabel={`${config.title} 다시 불러오기`}
              onAction={() => void query.refetch()}
            />
          ) : undefined
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ExploreMessage message="더 불러오는 중이에요" />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => <>{item.node}</>}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
      />

      <ExploreOptionSheet
        open={isSortSheetOpen}
        options={SEARCH_SORT_OPTIONS}
        selected={getSearchSortLabel(sort)}
        onClose={() => setIsSortSheetOpen(false)}
        onSelect={(nextSort) =>
          navigateTo(type, SEARCH_SORT_TO_API[nextSort], true, appliedFilters)
        }
      />
      <ExploreFilterSheet
        contentSelectable
        open={isFilterSheetOpen}
        appliedFilters={appliedFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={(filters) =>
          navigateTo(
            getSearchTypeByContent(filters.content),
            sort,
            sortSelected,
            filters,
          )
        }
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
  listContent: {
    paddingHorizontal: 25,
    paddingTop: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
