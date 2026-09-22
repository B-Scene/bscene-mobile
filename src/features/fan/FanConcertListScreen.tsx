import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import {
  invalidatePerformanceInterestQueries,
  useAddPerformanceInterest,
  useDeletePerformanceInterest,
  useUpcomingPerformancesInfiniteQuery,
} from "@/hooks/api/fan/useFanHome";
import { isAlreadyInterestedPerformanceError } from "@/api/fan/home";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import {
  type ConcertListItem,
  mapPerformanceToConcert,
} from "@/features/fan/concertMappers";

export function FanConcertListScreen() {
  const query = useUpcomingPerformancesInfiniteQuery("IMMINENT", 10);
  const concerts =
    query.data?.pages
      .flatMap((page) => page.items)
      .map(mapPerformanceToConcert) ?? [];

  const retry = () => {
    void query.refetch();
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="공연 일정" />

      {query.isLoading ? (
        <AppState loading title="공연을 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="공연을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={retry}
        />
      ) : concerts.length === 0 ? (
        <AppState
          title="표시할 공연이 없어요"
          description="새로운 공연 일정이 등록되면 이곳에서 볼 수 있어요."
        />
      ) : (
        <FlatList
          data={concerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => <ConcertRow item={item} />}
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

function ConcertRow({ item }: { item: ConcertListItem }) {
  const queryClient = useQueryClient();
  const addInterestMutation = useAddPerformanceInterest();
  const deleteInterestMutation = useDeletePerformanceInterest();
  const isInterestPending =
    addInterestMutation.isPending || deleteInterestMutation.isPending;

  const toggleInterest = async () => {
    if (item.performanceId == null) return;

    if (item.isInterested) {
      try {
        await deleteInterestMutation.mutateAsync(item.performanceId);
      } catch {
        Alert.alert("관심 공연", "관심 공연 해제에 실패했어요.");
      }
      return;
    }

    try {
      await addInterestMutation.mutateAsync(item.performanceId);
    } catch (error) {
      if (isAlreadyInterestedPerformanceError(error)) {
        await invalidatePerformanceInterestQueries(queryClient, item.performanceId);
        return;
      }
      Alert.alert("관심 공연", "관심 공연 등록에 실패했어요.");
    }
  };

  return (
    <AppCard style={styles.card}>
      <View style={styles.cardText}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.location}
        </Text>
        <Text style={styles.meta}>{item.dateTime}</Text>
      </View>
      <View style={styles.cardAction}>
        <Badge label={item.status} tone="pink" />
        <AppButton
          label={item.isInterested ? "관심 해제" : "관심"}
          variant={item.isInterested ? "secondary" : "ghost"}
          loading={isInterestPending}
          disabled={item.performanceId == null}
          style={styles.compactButton}
          onPress={() => void toggleInterest()}
        />
        <AppButton
          label="상세"
          variant="ghost"
          onPress={() =>
            router.push(
              `/fan/home/concerts/${item.id}` as Parameters<typeof router.push>[0],
            )
          }
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
  card: {
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 13,
    lineHeight: 18,
  },
  cardAction: {
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
