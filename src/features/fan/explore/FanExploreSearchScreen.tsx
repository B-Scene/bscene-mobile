import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  DEFAULT_APPLIED_FILTERS,
  getExplorePath,
} from "@/features/fan/explore/ExploreParts";
import {
  useDeleteAllFanExploreRecentSearches,
  useDeleteFanExploreRecentSearch,
  useFanExploreRecentSearchesQuery,
} from "@/hooks/api/fan/useFanExplore";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { colors, textStyles } from "@/shared/constants/theme";

import type { NormalizedFanExploreRecentSearch } from "@/types/fan/explore";

export function FanExploreSearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);
  const recentQuery = useFanExploreRecentSearchesQuery();
  const deleteMutation = useDeleteFanExploreRecentSearch();
  const deleteAllMutation = useDeleteAllFanExploreRecentSearches();
  const recentSearches = recentQuery.data ?? [];
  const isDeleting = deleteMutation.isPending || deleteAllMutation.isPending;
  const isActive = keyword.length > 0;

  const search = (value: string) => {
    const trimmedKeyword = value.trim();

    if (!trimmedKeyword) return;

    router.push(
      getExplorePath(null, {
        keyword: trimmedKeyword,
        sort: "ACCURACY",
        sortSelected: false,
        filters: DEFAULT_APPLIED_FILTERS,
      }),
    );
  };

  const removeAll = async () => {
    try {
      await deleteAllMutation.mutateAsync();
    } catch {
      setToastMessage("최근 검색어 삭제에 실패했어요");
    }
  };

  const remove = async ({ recentSearchId }: NormalizedFanExploreRecentSearch) => {
    if (recentSearchId == null) return;

    try {
      await deleteMutation.mutateAsync(recentSearchId);
    } catch {
      setToastMessage("최근 검색어 삭제에 실패했어요");
    }
  };

  return (
    <Screen edges={["top"]} scroll={false} contentStyle={styles.container}>
      <AppHeader title="" style={styles.header} />

      <View style={styles.body}>
        <View style={[styles.searchBar, isActive && styles.searchBarActive]}>
          <AppIcon
            name={isActive ? "exploreSearchActive" : "exploreSearch"}
            size={16}
          />
          <TextInput
            autoFocus
            accessibilityLabel="검색어"
            value={keyword}
            placeholder="밴드명, 장르, 지역, 곡명 검색"
            placeholderTextColor={colors.neutral500}
            returnKeyType="search"
            style={styles.searchInput}
            onChangeText={setKeyword}
            onSubmitEditing={() => search(keyword)}
          />
          {isActive ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
              hitSlop={8}
              onPress={() => setKeyword("")}
            >
              <AppIcon name="timesCircle" size={16} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>최근 검색어</Text>
            {recentSearches.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => void removeAll()}
              >
                <Text style={styles.deleteAll}>전체 삭제</Text>
              </Pressable>
            ) : null}
          </View>

          {recentSearches.length > 0 ? (
            <View style={styles.recentList}>
              {recentSearches.map((recentSearch) => (
                <View
                  key={`${recentSearch.recentSearchId ?? "local"}-${recentSearch.keyword}`}
                  style={styles.recentChip}
                >
                  <Pressable
                    accessibilityRole="button"
                    style={styles.recentKeyword}
                    onPress={() => search(recentSearch.keyword)}
                  >
                    <Text numberOfLines={1} style={styles.recentText}>
                      {recentSearch.keyword}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${recentSearch.keyword} 삭제`}
                    disabled={isDeleting}
                    hitSlop={8}
                    onPress={() => void remove(recentSearch)}
                  >
                    <AppIcon name="hintClose" size={12} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>최근 검색어가 없습니다</Text>
          )}
        </View>
      </View>

      <Toast
        open={toastMessage !== null}
        message={toastMessage}
        tone="error"
        onClose={closeToast}
      />
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
  body: {
    paddingLeft: 23,
    paddingRight: 22,
  },
  searchBar: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral500,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
  },
  searchBarActive: {
    borderColor: colors.primary400,
    boxShadow: "0px 0px 4px 0px rgba(240, 69, 121, 0.5)",
  },
  searchInput: {
    ...textStyles.caption3,
    flex: 1,
    minWidth: 0,
    color: colors.neutral900,
    paddingVertical: 0,
  },
  recent: {
    marginTop: 16,
    paddingHorizontal: 18,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  deleteAll: {
    ...textStyles.body5,
    color: colors.neutral600,
  },
  recentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  recentChip: {
    height: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.neutral400,
    backgroundColor: colors.white,
    paddingHorizontal: 6,
  },
  recentKeyword: {
    maxWidth: 120,
  },
  recentText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  emptyText: {
    ...textStyles.caption2,
    marginTop: 8,
    color: colors.neutral600,
  },
});
