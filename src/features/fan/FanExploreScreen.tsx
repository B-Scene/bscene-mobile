import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { useRecommendedExploreBandsInfiniteQuery } from "@/hooks/api/fan/useFanExplore";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import {
  type ExploreBandItem,
  mapExploreBand,
} from "@/features/fan/fanExploreMappers";

export function FanExploreScreen() {
  const query = useRecommendedExploreBandsInfiniteQuery({ size: 20 });
  const bands =
    query.data?.pages
      .flatMap((page) => page.items)
      .map(mapExploreBand) ?? [];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="탐색" showBack={false} />

      {query.isLoading ? (
        <AppState loading title="추천 밴드를 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="추천 밴드를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : bands.length === 0 ? (
        <AppState
          title="추천할 밴드가 없어요"
          description="관심 장르와 지역을 설정하면 더 좋은 추천을 받을 수 있어요."
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
                취향과 활동 정보를 기반으로 B:Scene 밴드를 추천해요.
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
      <AppButton
        label="보기"
        variant="ghost"
        disabled={item.bandId == null}
        onPress={() => {
          if (item.bandId == null) return;
          router.push(
            `/fan/bands/${item.bandId}` as Parameters<typeof router.push>[0],
          );
        }}
      />
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
  footerText: {
    color: colors.neutral600,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
