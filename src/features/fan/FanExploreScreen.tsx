import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { useGenres, useRegions } from "@/hooks/api/onboarding/useOnboarding";
import {
  useFanExploreBandSearchQuery,
  useFanExploreContentSearchQuery,
  useFanExplorePerformanceSearchQuery,
  useFollowExploreBand,
  useRecommendedExploreBandsInfiniteQuery,
  useUnfollowExploreBand,
} from "@/hooks/api/fan/useFanExplore";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { colors } from "@/shared/constants/theme";
import type { FanExploreSearchSort } from "@/types/fan/explore";
import {
  type ExploreBandItem,
  type ExploreContentItem,
  type ExplorePerformanceItem,
  mapExploreBand,
  mapExploreContent,
  mapExplorePerformance,
} from "@/features/fan/fanExploreMappers";

type ExploreResultType = "BAND" | "PERFORMANCE" | "POST";
type ExploreResultItem =
  | { kind: "BAND"; item: ExploreBandItem }
  | { kind: "PERFORMANCE"; item: ExplorePerformanceItem }
  | { kind: "POST"; item: ExploreContentItem };

const RESULT_TYPES: { id: ExploreResultType; label: string }[] = [
  { id: "BAND", label: "밴드" },
  { id: "PERFORMANCE", label: "공연" },
  { id: "POST", label: "콘텐츠" },
];

export function FanExploreScreen() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeResultType, setActiveResultType] =
    useState<ExploreResultType>("BAND");
  const [sort, setSort] = useState<FanExploreSearchSort>("POPULAR");
  const [genre, setGenre] = useState<string | undefined>();
  const [region, setRegion] = useState<string | undefined>();
  const genresQuery = useGenres();
  const regionsQuery = useRegions();
  const recommendedQuery = useRecommendedExploreBandsInfiniteQuery({ size: 20 });
  const searchParams = {
    keyword,
    sort,
    size: 20,
    genre,
    region,
  };
  const bandSearchQuery = useFanExploreBandSearchQuery(
    searchParams,
    activeResultType === "BAND",
  );
  const performanceSearchQuery = useFanExplorePerformanceSearchQuery(
    searchParams,
    activeResultType === "PERFORMANCE",
  );
  const contentSearchQuery = useFanExploreContentSearchQuery(
    searchParams,
    activeResultType === "POST",
  );
  const isSearching = keyword.trim().length > 0;
  const searchQuery =
    activeResultType === "BAND"
      ? bandSearchQuery
      : activeResultType === "PERFORMANCE"
        ? performanceSearchQuery
        : contentSearchQuery;
  const query = isSearching ? searchQuery : recommendedQuery;
  const resultItems: ExploreResultItem[] = isSearching
    ? activeResultType === "BAND"
      ? (bandSearchQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
          (item, index) => ({
            kind: "BAND",
            item: mapExploreBand(item, index),
          }),
        )
      : activeResultType === "PERFORMANCE"
        ? (
            performanceSearchQuery.data?.pages.flatMap((page) => page.items) ??
            []
          ).map((item, index) => ({
            kind: "PERFORMANCE",
            item: mapExplorePerformance(item, index),
          }))
        : (contentSearchQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
            (item, index) => ({
              kind: "POST",
              item: mapExploreContent(item, index),
            }),
          )
    : (recommendedQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
        (item, index) => ({
          kind: "BAND",
          item: mapExploreBand(item, index),
        }),
      );
  const genreOptions = useMemo(
    () => (genresQuery.data ?? []).slice(0, 8),
    [genresQuery.data],
  );
  const regionOptions = useMemo(
    () => (regionsQuery.data ?? []).slice(0, 8),
    [regionsQuery.data],
  );

  return (
    <View style={styles.root}>
      <ExploreHeader onSearchPress={() => setIsSearchOpen((current) => !current)} />

      <ExploreFilterBar
        sort={sort}
        genreLabel={genreOptions.find((item) => item.code === genre)?.name}
        regionLabel={regionOptions.find((item) => item.code === region)?.name}
        onToggleSort={() =>
          setSort((current) => (current === "POPULAR" ? "LATEST" : "POPULAR"))
        }
        onClearFilters={() => {
          setGenre(undefined);
          setRegion(undefined);
          setKeyword("");
        }}
      />

      {isSearchOpen ? (
        <SearchPanel
          keyword={keyword}
          onKeywordChange={setKeyword}
          activeResultType={activeResultType}
          onResultTypeChange={setActiveResultType}
          genre={genre}
          onGenreChange={setGenre}
          region={region}
          onRegionChange={setRegion}
          genres={genreOptions}
          regions={regionOptions}
        />
      ) : null}

      {query.isLoading ? (
        <View style={styles.stateWrap}>
          <AppState
            loading
            title={isSearching ? "검색 결과를 불러오는 중이에요" : "추천 밴드를 불러오는 중이에요"}
          />
        </View>
      ) : query.isError ? (
        <View style={styles.stateWrap}>
          <AppState
            title={
              isSearching
                ? "검색 결과를 불러오지 못했어요"
                : "추천 밴드를 불러오지 못했어요"
            }
            description="잠시 후 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={() => void query.refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={resultItems}
          keyExtractor={(item) => `${item.kind}-${item.item.id}`}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text style={styles.introTitle}>
                {isSearching
                  ? `${RESULT_TYPES.find((item) => item.id === activeResultType)?.label} 검색 결과`
                  : "회원님을 위한 추천 밴드"}
              </Text>
              <Text style={styles.introDescription}>
                {isSearching
                  ? "검색어와 필터에 맞는 결과를 보여드려요"
                  : "회원님의 취향과 활동을 기반으로 추천해요"}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ResultRow result={item} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isSearching ? "검색 결과가 없어요" : "조건에 맞는 밴드가 없어요"}
              </Text>
            </View>
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.footerText}>더 불러오는 중이에요</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

function ExploreHeader({ onSearchPress }: { onSearchPress: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide} />
      <Text style={styles.headerTitle}>탐색</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="검색"
        hitSlop={12}
        style={styles.headerSide}
        onPress={onSearchPress}
      >
        <SearchIcon />
      </Pressable>
    </View>
  );
}

function ExploreFilterBar({
  sort,
  genreLabel,
  regionLabel,
  onToggleSort,
  onClearFilters,
}: {
  sort: FanExploreSearchSort;
  genreLabel?: string;
  regionLabel?: string;
  onToggleSort: () => void;
  onClearFilters: () => void;
}) {
  const hasFilters = Boolean(genreLabel || regionLabel);

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <FilterChip
          label={sort === "POPULAR" ? "인기순" : "최신순"}
          selected
          onPress={onToggleSort}
        />
        <FilterChip label={genreLabel ?? "장르"} selected={Boolean(genreLabel)} />
        <FilterChip label={regionLabel ?? "지역"} selected={Boolean(regionLabel)} />
        <FilterChip label="유형" />
        {hasFilters ? (
          <FilterChip label="초기화" selected={false} onPress={onClearFilters} />
        ) : null}
      </ScrollView>

      <View style={styles.filterIconWrap}>
        <FilterControlIcon />
      </View>
    </View>
  );
}

function SearchPanel({
  keyword,
  onKeywordChange,
  activeResultType,
  onResultTypeChange,
  genre,
  onGenreChange,
  region,
  onRegionChange,
  genres,
  regions,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
  activeResultType: ExploreResultType;
  onResultTypeChange: (value: ExploreResultType) => void;
  genre?: string;
  onGenreChange: (value: string | undefined) => void;
  region?: string;
  onRegionChange: (value: string | undefined) => void;
  genres: { code: string; name: string }[];
  regions: { code: string; name: string }[];
}) {
  return (
    <View style={styles.searchPanel}>
      <View style={styles.searchInputWrap}>
        <SearchIcon muted />
        <TextInput
          value={keyword}
          placeholder="밴드, 공연, 콘텐츠 검색"
          placeholderTextColor={colors.neutral500}
          style={styles.searchInput}
          onChangeText={onKeywordChange}
        />
      </View>

      <View style={styles.optionGroup}>
        {RESULT_TYPES.map((item) => (
          <FilterChip
            key={item.id}
            label={item.label}
            selected={activeResultType === item.id}
            onPress={() => onResultTypeChange(item.id)}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionGroup}
      >
        {genres.map((item) => (
          <FilterChip
            key={item.code}
            label={item.name}
            selected={genre === item.code}
            onPress={() => onGenreChange(genre === item.code ? undefined : item.code)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionGroup}
      >
        {regions.map((item) => (
          <FilterChip
            key={item.code}
            label={item.name}
            selected={region === item.code}
            onPress={() =>
              onRegionChange(region === item.code ? undefined : item.code)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      style={[
        styles.filterChip,
        selected ? styles.filterChipSelected : styles.filterChipIdle,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterChipText,
          selected ? styles.filterChipTextSelected : styles.filterChipTextIdle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ResultRow({ result }: { result: ExploreResultItem }) {
  if (result.kind === "PERFORMANCE") {
    return <PerformanceRow item={result.item} />;
  }

  if (result.kind === "POST") {
    return <ContentRow item={result.item} />;
  }

  return <BandRow item={result.item} />;
}

function BandRow({ item }: { item: ExploreBandItem }) {
  const followMutation = useFollowExploreBand();
  const unfollowMutation = useUnfollowExploreBand();
  const isFollowPending = followMutation.isPending || unfollowMutation.isPending;

  const toggleFollow = async () => {
    if (item.bandId == null) return;

    try {
      if (item.isFollowing) {
        await unfollowMutation.mutateAsync(item.bandId);
        return;
      }

      await followMutation.mutateAsync(item.bandId);
    } catch {
      Alert.alert("밴드 팔로우", "팔로우 상태를 변경하지 못했어요.");
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={item.bandId == null}
      style={styles.bandCard}
      onPress={() => {
        if (item.bandId == null) return;
        router.push(
          `/fan/bands/${item.bandId}` as Parameters<typeof router.push>[0],
        );
      }}
    >
      <Avatar imageUrl={item.imageUrl} label={item.name} size={54} />
      <View style={styles.cardInfo}>
        <Text numberOfLines={1} style={styles.bandName}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.meta}
        </Text>
        {item.description ? (
          <Text numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isFollowPending || item.bandId == null}
        style={styles.followButton}
        onPress={() => void toggleFollow()}
      >
        <Text style={styles.followButtonText}>
          {item.isFollowing ? "팔로잉" : "팔로우"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function PerformanceRow({ item }: { item: ExplorePerformanceItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={item.performanceId == null}
      style={styles.bandCard}
      onPress={() => {
        if (item.performanceId == null) return;
        router.push(
          `/fan/home/concerts/${item.performanceId}` as Parameters<
            typeof router.push
          >[0],
        );
      }}
    >
      <Avatar imageUrl={item.imageUrl} label={item.title} size={54} />
      <View style={styles.cardInfo}>
        <Text numberOfLines={1} style={styles.bandName}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.meta}
        </Text>
        <Text style={styles.description}>{item.dateLabel}</Text>
      </View>
      <Text style={styles.resultKind}>공연</Text>
    </Pressable>
  );
}

function ContentRow({ item }: { item: ExploreContentItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={item.postId == null}
      style={styles.bandCard}
      onPress={() => {
        if (item.postId == null) return;
        router.push(
          `/fan/explore/contents/${item.postId}` as Parameters<
            typeof router.push
          >[0],
        );
      }}
    >
      <Avatar imageUrl={item.imageUrl} label={item.title} size={54} />
      <View style={styles.cardInfo}>
        <Text numberOfLines={1} style={styles.bandName}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.meta}
        </Text>
        {item.description ? (
          <Text numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Text style={styles.resultKind}>콘텐츠</Text>
    </Pressable>
  );
}

function SearchIcon({ muted = false }: { muted?: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19C15.418 19 19 15.418 19 11C19 6.582 15.418 3 11 3C6.582 3 3 6.582 3 11C3 15.418 6.582 19 11 19Z"
        stroke={muted ? colors.neutral500 : colors.neutral900}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21L16.65 16.65"
        stroke={muted ? colors.neutral500 : colors.neutral900}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterControlIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 19 19" fill="none">
      <Path
        d="M12.668 16.478H17.417C17.66 16.478 17.893 16.382 18.065 16.21C18.237 16.038 18.333 15.805 18.333 15.562C18.333 15.319 18.237 15.086 18.065 14.914C17.893 14.742 17.66 14.645 17.417 14.645H12.668C12.476 14.114 12.124 13.656 11.662 13.331C11.199 13.007 10.648 12.833 10.083 12.833C9.518 12.833 8.967 13.007 8.505 13.331C8.042 13.656 7.691 14.114 7.498 14.645H.917C.673 14.645.44 14.742.268 14.914C.096 15.086 0 15.319 0 15.562C0 15.805.096 16.038.268 16.21C.44 16.382.673 16.478.917 16.478H7.498C7.691 17.009 8.042 17.468 8.505 17.792C8.967 18.116 9.518 18.29 10.083 18.29C10.648 18.29 11.199 18.116 11.662 17.792C12.124 17.468 12.476 17.009 12.668 16.478ZM7.168 10.062H17.417C17.66 10.062 17.893 9.965 18.065 9.793C18.237 9.621 18.333 9.388 18.333 9.145C18.333 8.902 18.237 8.669 18.065 8.497C17.893 8.325 17.66 8.228 17.417 8.228H7.168C6.976 7.698 6.624 7.239 6.162 6.915C5.699 6.591 5.148 6.417 4.583 6.417C4.018 6.417 3.467 6.591 3.005 6.915C2.542 7.239 2.191 7.698 1.998 8.228H.917C.673 8.228.44 8.325.268 8.497C.096 8.669 0 8.902 0 9.145C0 9.388.096 9.621.268 9.793C.44 9.965.673 10.062.917 10.062H1.998C2.191 10.593 2.542 11.051 3.005 11.376C3.467 11.7 4.018 11.874 4.583 11.874C5.148 11.874 5.699 11.7 6.162 11.376C6.624 11.051 6.976 10.593 7.168 10.062ZM14.502 3.645H17.417C17.66 3.645 17.893 3.549 18.065 3.377C18.237 3.205 18.333 2.972 18.333 2.728C18.333 2.485 18.237 2.252 18.065 2.08C17.893 1.908 17.66 1.812 17.417 1.812H14.502C14.309 1.281 13.957.822 13.495.498C13.032.174 12.481 0 11.917 0C11.352 0 10.801.174 10.338.498C9.876.822 9.524 1.281 9.332 1.812H.917C.673 1.812.44 1.908.268 2.08C.096 2.252 0 2.485 0 2.728C0 2.972.096 3.205.268 3.377C.44 3.549.673 3.645.917 3.645H9.332C9.524 4.176 9.876 4.635 10.338 4.959C10.801 5.283 11.352 5.457 11.917 5.457C12.481 5.457 13.032 5.283 13.495 4.959C13.957 4.635 14.309 4.176 14.502 3.645Z"
        fill={colors.neutral900}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  headerSide: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral400,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingLeft: 22,
    paddingRight: 20,
  },
  filterScroll: {
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },
  filterIconWrap: {
    width: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChip: {
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  filterChipSelected: {
    borderColor: colors.primary400,
    backgroundColor: colors.primary0,
  },
  filterChipIdle: {
    borderColor: colors.neutral400,
    backgroundColor: colors.white,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  filterChipTextSelected: {
    color: colors.primary400,
  },
  filterChipTextIdle: {
    color: colors.neutral600,
  },
  searchPanel: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  searchInputWrap: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  stateWrap: {
    flex: 1,
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 104,
  },
  intro: {
    marginBottom: 16,
  },
  introTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  introDescription: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  bandCard: {
    minHeight: 86,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
    padding: 14,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  bandName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  description: {
    color: colors.primary300,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  followButton: {
    minWidth: 64,
    borderWidth: 1,
    borderColor: colors.primary400,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followButtonText: {
    color: colors.primary400,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  resultKind: {
    color: colors.primary400,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  emptyCard: {
    borderRadius: 12,
    backgroundColor: colors.neutral100,
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
});
