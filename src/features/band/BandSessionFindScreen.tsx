import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import {
  getFilterParam,
  INITIAL_SESSION_FILTERS,
  SessionCandidateCard,
  SessionFilterBar,
  SessionFilterSheet,
  SessionStateBox,
  type SessionFilterValues,
} from "@/features/session/SessionHomeParts";
import { useSessionApplicationsSearchInfiniteQuery } from "@/hooks/api/session/useSessionApplication";
import { AppHeader } from "@/shared/components/AppHeader";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

export function SessionFindContent({
  values,
}: {
  values: SessionFilterValues;
}) {
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);
  const params = useMemo(
    () => ({
      part: getFilterParam(values.part),
      skillLevel: getFilterParam(values.skill),
      genre: getFilterParam(values.genre),
      region: getFilterParam(values.region),
      size: 10,
    }),
    [values],
  );
  const query = useSessionApplicationsSearchInfiniteQuery(params);
  const candidates = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data],
  );

  const loadMore = () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;

    void query.fetchNextPage();
  };

  return (
    <FlatList
      data={candidates}
      keyExtractor={(item) => String(item.sessionApplicationId)}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        isNoticeVisible ? (
          <View style={styles.noticeSection}>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                {
                  "필터를 선택하지 않으면 기본 지원서에서 선택한\n활동 지역, 장르와 같은 세션 뮤지션이 먼저 보여요."
                }
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="안내 닫기"
                hitSlop={8}
                style={styles.noticeClose}
                onPress={() => setIsNoticeVisible(false)}
              >
                <Text style={styles.noticeCloseText}>×</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.topDivider} />
        )
      }
      ListEmptyComponent={
        <View style={styles.item}>
          {query.isLoading ? (
            <SessionStateBox
              variant="find"
              text="세션 뮤지션을 불러오고 있어요"
            />
          ) : query.isError ? (
            <SessionStateBox
              variant="find"
              text="세션 뮤지션을 불러오지 못했어요"
              onRetry={() => void query.refetch()}
            />
          ) : (
            <SessionStateBox
              variant="find"
              text="선택한 조건에 맞는 세션 뮤지션이 없어요"
            />
          )}
        </View>
      }
      ItemSeparatorComponent={Separator}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <Text style={styles.loadingMore}>
            세션 뮤지션을 더 불러오는 중이에요
          </Text>
        ) : undefined
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <SessionCandidateCard candidate={item} />
        </View>
      )}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

export function BandSessionFindScreen() {
  const [filters, setFilters] = useState(INITIAL_SESSION_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader title="세션 찾기" style={styles.header} />

      <SessionFilterBar
        compactHeight
        showBottomBorder={false}
        values={filters}
        sort="LATEST"
        sortOptions={["LATEST"]}
        onSortChange={() => undefined}
        onOpenFilter={() => setIsFilterOpen(true)}
      />

      <SessionFindContent values={filters} />

      <SessionFilterSheet
        open={isFilterOpen}
        values={filters}
        onApply={setFilters}
        onClose={() => setIsFilterOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 15,
  },
  list: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingBottom: 24,
  },
  noticeSection: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    paddingHorizontal: 24,
    paddingBottom: 9,
  },
  noticeBox: {
    minHeight: 86,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 12,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  noticeText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    lineHeight: 20,
    textAlign: "center",
  },
  noticeClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeCloseText: {
    color: colors.neutral400,
    fontSize: 18,
    lineHeight: 18,
  },
  topDivider: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  item: {
    paddingHorizontal: 24,
  },
  separator: {
    height: 18,
  },
  loadingMore: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 12,
    textAlign: "center",
  },
});
