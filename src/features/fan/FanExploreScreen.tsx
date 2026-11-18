import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import {
  DEFAULT_APPLIED_FILTERS,
  type AppliedExploreFilters,
  ExploreBandCard,
  ExploreFilterBar,
  ExploreFilterSheet,
  ExploreMessage,
  ExploreOptionSheet,
  useExploreFollow,
} from "@/features/fan/explore/ExploreParts";
import { FanEntryGuide, useFanEntryGuide, useFanGuideAnchor } from "@/features/fan/FanEntryGuide";
import { FanDesignIcon } from "@/features/fan/FanDesignIcon";
import { fanDesignText as textStyles } from "@/features/fan/fanDesignText";
import { mapExploreBand } from "@/features/fan/fanExploreMappers";
import { useRecommendedExploreBandsInfiniteQuery } from "@/hooks/api/fan/useFanExplore";
import { AppHeader } from "@/shared/components/AppHeader";
import { Screen } from "@/shared/components/Screen";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors } from "@/shared/constants/theme";
import { useDesignPreviewStore } from "@/stores/useDesignPreviewStore";

const SORT_OPTIONS = ["추천순", "정확도순", "인기순"] as const;
type ExploreSortOption = (typeof SORT_OPTIONS)[number];

const previewBandImage = require("../../../assets/images/fan/preview-band.png");
const previewBands = Array.from({ length: 6 }, (_, index) => ({
  item: {
    ...mapExploreBand({}, index),
    name: "WAVY",
    description: "몽환적인 사운드와 감각적인\n스타일로 주목받는 3인조 밴드",
    isFollowing: index === 0,
  },
  genre: "인디",
  region: "서울",
}));

export function FanExploreScreen() {
  const designPreviewEnabled = useDesignPreviewStore((state) => state.enabled);
  const isDesignPreview = __DEV__ && designPreviewEnabled;
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<ExploreSortOption>("추천순");
  const [firstCardLaidOut, setFirstCardLaidOut] = useState(false);
  const [registeredOnly, setRegisteredOnly] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_APPLIED_FILTERS);
  const hasAppliedFilter = Object.values(appliedFilters).some(
    (value) => value !== "전체",
  );
  const query = useRecommendedExploreBandsInfiniteQuery(
    { size: 20, withDummy: registeredOnly ? false : undefined },
    !isDesignPreview,
  );
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
    const filtered = (isDesignPreview ? previewBands : items).filter(
      ({ genre, region }) =>
        (appliedFilters.genre === "전체" || genre === appliedFilters.genre) &&
        (appliedFilters.region === "전체" || region === appliedFilters.region),
    );

    return selectedSort === "인기순"
      ? [...filtered].sort(
          (a, b) => b.item.followerCount - a.item.followerCount,
        )
      : filtered;
  }, [appliedFilters, isDesignPreview, query.data, selectedSort]);

  const searchAnchor = useFanGuideAnchor();
  const sortAnchor = useFanGuideAnchor();
  const filterAnchor = useFanGuideAnchor();
  const bandAnchor = useFanGuideAnchor();
  const guide = useFanEntryGuide(
    "explore",
    !hasAppliedFilter &&
      !isSortSheetOpen &&
      !isFilterSheetOpen &&
      firstCardLaidOut &&
      bands.length > 0 &&
      (isDesignPreview || query.isSuccess),
    isDesignPreview,
  );
  const guideSteps = useMemo(() => [[
    {
      anchor: searchAnchor, padding: 7, radius: 19, labelPosition: "left",
      label: "원하는 밴드를\n직접 검색할 수 있어요", labelWidth: 110, labelOffsetY: 5, circleIcon: "search",
    },
    {
      anchor: sortAnchor, radius: 11, labelPosition: "below",
      label: "정렬 기준을 바꿔\n밴드를 탐색할 수 있어요", labelWidth: 116, labelOffsetX: 8.5, labelOffsetY: 8, exploreArrow: true,
    },
    {
      anchor: filterAnchor, extendAfter: sortAnchor, padding: -8, trailingInset: 9,
      radius: 12, labelPosition: "below", arrowRatio: 260 / 284,
      label: "원하는 조건으로\n밴드를 필터링할 수 있어요", labelWidth: 125, labelOffsetX: -26.5, labelOffsetY: 8, exploreArrow: true,
    },
    {
      anchor: bandAnchor, radius: 16, labelPosition: "below", arrowRatio: 295 / 348,
      label: "마음에 드는 밴드를 팔로우하고\n소식을 받아보세요", labelWidth: 155, labelOffsetX: -13, labelOffsetY: 6, exploreArrow: true,
    },
  ]] as const, [bandAnchor, filterAnchor, searchAnchor, sortAnchor]);

  const previewCount = guide.open ? 6 : hasAppliedFilter ? 3 : 5;
  const displayedBands = isDesignPreview
    ? bands.slice(0, previewCount)
    : query.isLoading || query.isError ? [] : bands;

  const applyFilters = (filters: AppliedExploreFilters) => {
    setAppliedFilters(filters);
    const hasFilter = Object.values(filters).some((value) => value !== "전체");
    setSelectedSort((sort) => {
      if (!hasFilter) return "추천순";
      return sort === "인기순" ? sort : "정확도순";
    });
  };

  return (
    <Screen edges={["top", "left", "right"]} scroll={false} contentStyle={styles.container}>
      <AppHeader
        title="탐색"
        showBack={false}
        style={styles.header}
        titleStyle={textStyles.label2}
        rightContent={
          <Pressable
            ref={searchAnchor}
            accessibilityRole="button"
            accessibilityLabel="검색"
            hitSlop={12}
            onPress={() => router.push("/fan/explore/search" as Href)}
          >
            <FanDesignIcon name="search" />
          </Pressable>
        }
      />

      <ExploreFilterBar
        appliedFilters={appliedFilters}
        appliedSort={selectedSort}
        highlightSort={selectedSort === "인기순"}
        contentLabel="유형"
        guideAnchors={{ bar: filterAnchor, sort: sortAnchor }}
        registeredOnly={registeredOnly}
        onRegisteredOnlyChange={guide.open ? undefined : setRegisteredOnly}
        onSortPress={() => setIsSortSheetOpen(true)}
        onFilterPress={() => setIsFilterSheetOpen(true)}
      />

      <FlatList
        scrollEnabled={!guide.open}
        data={displayedBands}
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
        renderItem={({ item: { item, genre, region }, index }) => (
          <ExploreBandCard
            band={isDesignPreview && guide.open && item.isFollowing
              ? { ...item, isFollowing: false }
              : item}
            subtitle={`${genre} · ${region}`}
            previewImage={isDesignPreview ? previewBandImage : undefined}
            guideAnchor={index === 0 ? bandAnchor : undefined}
            onGuideAnchorLayout={index === 0 ? () => setFirstCardLaidOut(true) : undefined}
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
        options={hasAppliedFilter ? SORT_OPTIONS.slice(1) : SORT_OPTIONS}
        selected={selectedSort}
        onClose={() => setIsSortSheetOpen(false)}
        onSelect={setSelectedSort}
      />
      <ExploreFilterSheet
        open={isFilterSheetOpen}
        selectableContent={["전체", "밴드"]}
        appliedFilters={appliedFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={applyFilters}
      />

      {guide.open ? <FanEntryGuide steps={guideSteps} onClose={guide.dismiss} /> : null}
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
    marginTop: 10,
    paddingHorizontal: 24,
  },
  listContent: {
    paddingLeft: 23,
    paddingRight: 22,
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
