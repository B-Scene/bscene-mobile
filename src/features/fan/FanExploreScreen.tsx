import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import { useGenres, useRegions } from "@/hooks/api/onboarding/useOnboarding";
import {
  useFanExploreBandSearchQuery,
  useFollowExploreBand,
  useRecommendedExploreBandsInfiniteQuery,
  useUnfollowExploreBand,
} from "@/hooks/api/fan/useFanExplore";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type { FanExploreSearchSort } from "@/types/fan/explore";
import {
  type ExploreBandItem,
  mapExploreBand,
} from "@/features/fan/fanExploreMappers";

export function FanExploreScreen() {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<FanExploreSearchSort>("POPULAR");
  const [genre, setGenre] = useState<string | undefined>();
  const [region, setRegion] = useState<string | undefined>();
  const genresQuery = useGenres();
  const regionsQuery = useRegions();
  const recommendedQuery = useRecommendedExploreBandsInfiniteQuery({ size: 20 });
  const searchQuery = useFanExploreBandSearchQuery({
    keyword,
    sort,
    size: 20,
    genre,
    region,
  });
  const isSearching = keyword.trim().length > 0;
  const query = isSearching ? searchQuery : recommendedQuery;
  const bands =
    query.data?.pages
      .flatMap((page) => page.items)
      .map(mapExploreBand) ?? [];
  const genreOptions = useMemo(
    () => (genresQuery.data ?? []).slice(0, 6),
    [genresQuery.data],
  );
  const regionOptions = useMemo(
    () => (regionsQuery.data ?? []).slice(0, 6),
    [regionsQuery.data],
  );

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="탐색" showBack={false} />
      <View style={styles.searchPanel}>
        <AppTextInput
          label="밴드 검색"
          placeholder="밴드명이나 키워드를 입력하세요"
          value={keyword}
          onChangeText={setKeyword}
        />
        <View style={styles.filterGroup}>
          <Chip
            label="인기순"
            selected={sort === "POPULAR"}
            onPress={() => setSort("POPULAR")}
          />
          <Chip
            label="최신순"
            selected={sort === "LATEST"}
            onPress={() => setSort("LATEST")}
          />
          {(genre || region) && (
            <Chip
              label="필터 초기화"
              selected={false}
              onPress={() => {
                setGenre(undefined);
                setRegion(undefined);
              }}
            />
          )}
        </View>
        {genreOptions.length ? (
          <View style={styles.filterGroup}>
            {genreOptions.map((item) => (
              <Chip
                key={item.code}
                label={item.name}
                selected={genre === item.code}
                onPress={() =>
                  setGenre((current) =>
                    current === item.code ? undefined : item.code,
                  )
                }
              />
            ))}
          </View>
        ) : null}
        {regionOptions.length ? (
          <View style={styles.filterGroup}>
            {regionOptions.map((item) => (
              <Chip
                key={item.code}
                label={item.name}
                selected={region === item.code}
                onPress={() =>
                  setRegion((current) =>
                    current === item.code ? undefined : item.code,
                  )
                }
              />
            ))}
          </View>
        ) : null}
      </View>

      {query.isLoading ? (
        <AppState
          loading
          title={isSearching ? "검색 결과를 불러오는 중이에요" : "추천 밴드를 불러오는 중이에요"}
        />
      ) : query.isError ? (
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
      ) : bands.length === 0 ? (
        <AppState
          title={isSearching ? "검색 결과가 없어요" : "추천할 밴드가 없어요"}
          description={
            isSearching
              ? "다른 키워드나 필터로 다시 검색해 보세요."
              : "관심 장르와 지역을 설정하면 더 좋은 추천을 받을 수 있어요."
          }
        />
      ) : (
        <FlatList
          data={bands}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text style={styles.title}>회원님을 위한 추천 밴드</Text>
              <Text style={styles.description}>
                {isSearching
                  ? "검색어와 필터에 맞는 밴드를 보여드려요."
                  : "취향과 활동 정보를 기반으로 B:Scene 밴드를 추천해요."}
              </Text>
            </View>
          }
          renderItem={({ item }) => <BandRow item={item} />}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.footerText}>더 불러오는 중이에요</Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
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
    <AppCard style={styles.card}>
      <Avatar imageUrl={item.imageUrl} label={item.name} size={54} />
      <View style={styles.bandInfo}>
        <Text numberOfLines={1} style={styles.bandName}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.meta}
        </Text>
        {item.description ? (
          <Text numberOfLines={2} style={styles.bandDescription}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.badges}>
          <Badge label={`${item.followerCount.toLocaleString()} 팔로워`} />
          {item.isFollowing ? <Badge label="팔로잉" tone="pink" /> : null}
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          label={item.isFollowing ? "팔로잉" : "팔로우"}
          variant={item.isFollowing ? "secondary" : "ghost"}
          loading={isFollowPending}
          disabled={item.bandId == null}
          style={styles.compactButton}
          onPress={() => void toggleFollow()}
        />
        <AppButton
          label="보기"
          variant="ghost"
          disabled={item.bandId == null}
          style={styles.compactButton}
          onPress={() => {
            if (item.bandId == null) return;
            router.push(
              `/fan/bands/${item.bandId}` as Parameters<typeof router.push>[0],
            );
          }}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  intro: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "900",
  },
  description: {
    color: colors.neutral600,
    fontSize: 13,
  },
  searchPanel: {
    gap: spacing.md,
  },
  filterGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bandInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  bandName: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "900",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
  },
  bandDescription: {
    color: colors.neutral700,
    fontSize: 13,
    lineHeight: 18,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actions: {
    alignItems: "flex-end",
    gap: spacing.xs,
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
