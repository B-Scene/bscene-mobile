import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  DEFAULT_APPLIED_FILTERS,
  ExploreBandCard,
  ExploreConcertCard,
  ExploreFilterBar,
  ExploreFilterSheet,
  ExploreList,
  ExploreMessage,
  ExploreNewsCard,
  ExploreOptionSheet,
  ExploreSearchBar,
  ExploreSectionTitle,
  getBandSubtitle,
  getExplorePath,
  getGenreFilterParam,
  getRegionFilterParam,
  getSearchTypeByContent,
  SEARCH_SORT_OPTIONS,
  SEARCH_SORT_TO_API,
  useExploreFollow,
  type AppliedExploreFilters,
  type ExploreSearchType,
  type SearchSortOption,
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
import { colors } from "@/shared/constants/theme";

const PREVIEW_COUNT = 4;

type PageQuery = {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
  data?: {
    pages: {
      items: unknown[];
      totalCount?: number;
      totalElements?: number;
      total?: number;
    }[];
  };
};

const getTotalCount = (query: PageQuery) => {
  const page = query.data?.pages[0];

  return (
    page?.totalCount ??
    page?.totalElements ??
    page?.total ??
    page?.items.length ??
    0
  );
};

function ResultSectionBody({
  query,
  children,
}: {
  query: PageQuery;
  children: ReactNode;
}) {
  if (query.isLoading) {
    return <ExploreMessage message="검색 결과를 불러오는 중이에요" />;
  }

  if (query.isError) {
    return (
      <ExploreMessage
        actionLabel="검색 결과 다시 불러오기"
        onAction={() => void query.refetch()}
      />
    );
  }

  return <ExploreList>{children}</ExploreList>;
}

export function FanExploreResultScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    genre?: string;
    region?: string;
  }>();
  const keyword = params.q ?? "";
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AppliedExploreFilters>({
    ...DEFAULT_APPLIED_FILTERS,
    genre: params.genre || "전체",
    region: params.region || "전체",
  });
  const [sortState, setSortState] = useState<{
    keyword: string;
    sort: SearchSortOption;
    selectedByUser: boolean;
  }>({ keyword, sort: "정확도순", selectedByUser: false });
  const appliedSort =
    sortState.keyword === keyword ? sortState.sort : "정확도순";
  const shouldHighlightSort =
    sortState.keyword === keyword && sortState.selectedByUser;
  const sort = SEARCH_SORT_TO_API[appliedSort];
  const searchParams = {
    keyword,
    sort,
    size: 20,
    genre: getGenreFilterParam(appliedFilters.genre),
    region: getRegionFilterParam(appliedFilters.region),
  };
  const bandsQuery = useFanExploreBandSearchQuery(searchParams);
  const performancesQuery = useFanExplorePerformanceSearchQuery(searchParams);
  const contentsQuery = useFanExploreContentSearchQuery(searchParams);
  const { toggleFollow, followLayer } = useExploreFollow();
  const bands = bandsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const performances =
    performancesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const contents = contentsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const openMore = (
    type: ExploreSearchType,
    filters: AppliedExploreFilters = appliedFilters,
  ) => {
    router.push(
      getExplorePath(type, {
        keyword,
        sort,
        sortSelected: shouldHighlightSort,
        filters,
      }),
    );
  };

  const applyFilters = (filters: AppliedExploreFilters) => {
    const type = getSearchTypeByContent(filters.content);

    if (type) {
      openMore(type, filters);
      return;
    }

    setAppliedFilters(filters);
  };

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <ExploreSearchBar
        key={keyword}
        initialKeyword={keyword}
        onSubmit={(nextKeyword) =>
          router.replace(
            getExplorePath(null, {
              keyword: nextKeyword,
              sort: "ACCURACY",
              sortSelected: false,
              filters: DEFAULT_APPLIED_FILTERS,
            }),
          )
        }
      />
      <ExploreFilterBar
        appliedFilters={appliedFilters}
        appliedSort={appliedSort}
        highlightSort={shouldHighlightSort}
        onSortPress={() => setIsSortSheetOpen(true)}
        onFilterPress={() => setIsFilterSheetOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.firstSection}>
          <ExploreSectionTitle
            title="밴드"
            count={getTotalCount(bandsQuery)}
            onMorePress={() => openMore("bands")}
          />
          <ResultSectionBody query={bandsQuery}>
            {bands.slice(0, PREVIEW_COUNT).map((band, index) => {
              const item = mapExploreBand(band, index);

              return (
                <ExploreBandCard
                  key={item.id}
                  band={item}
                  subtitle={getBandSubtitle(band)}
                  onToggleFollow={() => void toggleFollow(item)}
                />
              );
            })}
          </ResultSectionBody>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <ExploreSectionTitle
            title="공연"
            count={getTotalCount(performancesQuery)}
            onMorePress={() => openMore("concerts")}
          />
          <ResultSectionBody query={performancesQuery}>
            {performances.slice(0, PREVIEW_COUNT).map((performance, index) => {
              const item = mapExplorePerformance(performance, index);

              return (
                <ExploreConcertCard
                  key={item.id}
                  performance={performance}
                  performanceId={item.performanceId}
                  title={item.title}
                  location={item.meta}
                  dateLabel={item.dateLabel}
                  posterUrl={item.imageUrl}
                />
              );
            })}
          </ResultSectionBody>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <ExploreSectionTitle
            title="콘텐츠"
            count={getTotalCount(contentsQuery)}
            onMorePress={() => openMore("contents")}
          />
          <ResultSectionBody query={contentsQuery}>
            {contents.slice(0, PREVIEW_COUNT).map((content, index) => {
              const item = mapExploreContent(content, index);

              return (
                <ExploreNewsCard
                  key={item.id}
                  content={content}
                  keyword={keyword}
                  postId={item.postId}
                />
              );
            })}
          </ResultSectionBody>
        </View>
      </ScrollView>

      <ExploreOptionSheet
        open={isSortSheetOpen}
        options={SEARCH_SORT_OPTIONS}
        selected={appliedSort}
        onClose={() => setIsSortSheetOpen(false)}
        onSelect={(nextSort) =>
          setSortState({ keyword, sort: nextSort, selectedByUser: true })
        }
      />
      <ExploreFilterSheet
        contentSelectable
        open={isFilterSheetOpen}
        appliedFilters={appliedFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={applyFilters}
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
  scrollContent: {
    paddingBottom: 24,
  },
  firstSection: {
    paddingHorizontal: 23,
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 23,
    paddingVertical: 16,
  },
  divider: {
    height: 16,
    marginTop: 16,
    backgroundColor: colors.primary0,
  },
});
