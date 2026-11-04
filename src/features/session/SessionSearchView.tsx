import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path, SvgXml } from "react-native-svg";

import type { SessionSearchHistoryItem } from "@/api/session/sessionSearchHistory";
import {
  getFilterParam,
  matchesRecruitmentFilters,
  RecruitmentPostCard,
  SessionCandidateCard,
  SessionFilterBar,
  SessionFilterSheet,
  SessionStateBox,
  type SessionFilterValues,
} from "@/features/session/SessionHomeParts";
import { SESSION_SEARCH_CONTEXT_XML } from "@/features/session/sessionSearchContextXml";
import { useSessionApplicationsSearchInfiniteQuery } from "@/hooks/api/session/useSessionApplication";
import { useSessionRecruitmentsQuery } from "@/hooks/api/session/useSessionRecruitment";
import {
  useDeleteSessionSearchHistory,
  useSessionSearchHistoryQuery,
} from "@/hooks/api/session/useSessionSearchHistory";
import { AppIcon } from "@/shared/components/AppIcon";
import { colors, textStyles } from "@/shared/constants/theme";
import type { SessionRecruitmentSort } from "@/types/session/sessionRecruitment";

const RECENT_KEYWORD_LIMIT = 10;

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="세션 화면으로 돌아가기"
      style={styles.backButton}
      onPress={onBack}
    >
      <AppIcon name="arrowLeft" size={20} />
    </Pressable>
  );
}

function SearchField({
  keyword,
  autoFocus,
  label,
  onChange,
  onClear,
  onSearch,
}: {
  keyword: string;
  autoFocus: boolean;
  label: string;
  onChange: (keyword: string) => void;
  onClear: () => void;
  onSearch: () => void;
}) {
  const isSearching = keyword.trim().length > 0;

  return (
    <View style={[styles.field, isSearching && styles.fieldActive]}>
      {isSearching ? (
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
          <Circle
            cx={9}
            cy={9}
            r={6}
            stroke={colors.secondary500}
            strokeWidth={1.8}
          />
          <Path
            d="m13.5 13.5 3 3"
            stroke={colors.secondary500}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      ) : (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SvgXml xml={SESSION_SEARCH_CONTEXT_XML} width="100%" height={36} />
        </View>
      )}

      <TextInput
        accessibilityLabel={label}
        autoFocus={autoFocus}
        value={keyword}
        returnKeyType="search"
        style={[styles.input, !isSearching && styles.inputIdle]}
        onChangeText={onChange}
        onSubmitEditing={onSearch}
      />

      {isSearching ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="검색어 지우기"
          hitSlop={8}
          style={styles.clearButton}
          onPress={onClear}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Circle cx={8} cy={8} r={8} fill="#FFFFFF" fillOpacity={0.9} />
            <Path
              d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5"
              stroke="#525252"
              strokeWidth={1.3}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

function RecruitmentSearchResults({
  keyword,
  sort,
  values,
  onSearched,
}: {
  keyword: string;
  sort: SessionRecruitmentSort;
  values: SessionFilterValues;
  onSearched: () => void;
}) {
  const query = useSessionRecruitmentsQuery({ keyword, sort, size: 20 });
  const { isSuccess } = query;
  const posts = (query.data?.content ?? []).filter((post) =>
    matchesRecruitmentFilters(post, values),
  );

  useEffect(() => {
    if (isSuccess) onSearched();
  }, [isSuccess, keyword, onSearched]);

  if (query.isLoading) {
    return (
      <View style={styles.recruitmentState}>
        <SessionStateBox text="검색 결과를 불러오고 있어요" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.recruitmentState}>
        <SessionStateBox
          text="검색 결과를 불러오지 못했어요"
          onRetry={() => void query.refetch()}
        />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.recruitmentState}>
        <SessionStateBox text="검색 결과가 없어요" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.sessionRecruitmentId)}
      contentContainerStyle={styles.recruitmentList}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <RecruitmentPostCard item={item} />}
    />
  );
}

function CandidateSearchResults({
  keyword,
  values,
  onSearched,
}: {
  keyword: string;
  values: SessionFilterValues;
  onSearched: () => void;
}) {
  const params = useMemo(
    () => ({
      keyword,
      part: getFilterParam(values.part),
      skillLevel: getFilterParam(values.skill),
      genre: getFilterParam(values.genre),
      region: getFilterParam(values.region),
      size: 10,
    }),
    [keyword, values],
  );
  const query = useSessionApplicationsSearchInfiniteQuery(params);
  const { isSuccess } = query;
  const candidates = query.data?.pages.flatMap((page) => page.content) ?? [];

  useEffect(() => {
    if (isSuccess) onSearched();
  }, [isSuccess, keyword, onSearched]);

  if (query.isLoading) {
    return (
      <View style={styles.findState}>
        <SessionStateBox
          variant="find"
          text="세션 뮤지션 검색 결과를 불러오고 있어요"
        />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.findState}>
        <SessionStateBox
          variant="find"
          text="세션 뮤지션 검색 결과를 불러오지 못했어요"
          onRetry={() => void query.refetch()}
        />
      </View>
    );
  }

  if (candidates.length === 0) {
    return (
      <View style={styles.findState}>
        <SessionStateBox variant="find" text="검색 결과가 없어요" />
      </View>
    );
  }

  return (
    <FlatList
      data={candidates}
      keyExtractor={(item) => String(item.sessionApplicationId)}
      contentContainerStyle={styles.findList}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <SessionCandidateCard candidate={item} />}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <Text style={styles.loadingMore}>
            세션 뮤지션을 더 불러오는 중이에요
          </Text>
        ) : undefined
      }
    />
  );
}

export function SessionSearchView({
  mode,
  values,
  onBack,
  onApplyFilters,
}: {
  mode: "recruitment" | "find";
  values: SessionFilterValues;
  onBack: () => void;
  onApplyFilters: (values: SessionFilterValues) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sort, setSort] = useState<SessionRecruitmentSort>("LATEST");
  const [optimisticKeywords, setOptimisticKeywords] = useState<
    SessionSearchHistoryItem[]
  >([]);
  const historyQuery = useSessionSearchHistoryQuery();
  const deleteHistoryMutation = useDeleteSessionSearchHistory();
  const refetchHistory = historyQuery.refetch;
  const isFindMode = mode === "find";
  const fieldLabel = isFindMode ? "세션 지원서 검색" : "세션 모집 공고 검색";

  const recentKeywords = useMemo(() => {
    const seen = new Set<string>();

    return [...optimisticKeywords, ...(historyQuery.data ?? [])]
      .filter((item) => {
        const normalized = item.keyword.trim();

        if (!normalized || seen.has(normalized)) return false;

        seen.add(normalized);
        return true;
      })
      .slice(0, RECENT_KEYWORD_LIMIT);
  }, [historyQuery.data, optimisticKeywords]);

  const addOptimisticKeyword = (nextKeyword: string) => {
    setOptimisticKeywords((current) =>
      [
        { keywordId: -Date.now(), keyword: nextKeyword },
        ...current.filter((item) => item.keyword.trim() !== nextKeyword),
      ].slice(0, RECENT_KEYWORD_LIMIT),
    );
  };

  const submit = (value: string) => {
    const nextKeyword = value.trim();

    if (!nextKeyword) return;

    setKeyword(nextKeyword);
    addOptimisticKeyword(nextKeyword);
    setSubmittedKeyword(nextKeyword);
  };

  const clearKeyword = () => {
    setKeyword("");
    setSubmittedKeyword("");
    void refetchHistory();
  };

  const removeKeyword = (keywordId: number, value: string) => {
    setOptimisticKeywords((current) =>
      current.filter((item) => item.keyword.trim() !== value.trim()),
    );

    if (keywordId < 0) return;

    deleteHistoryMutation.mutate(keywordId, {
      onSuccess: () => void refetchHistory(),
    });
  };

  if (submittedKeyword) {
    return (
      <View style={styles.container}>
        <View style={styles.resultHeader}>
          <BackButton onBack={onBack} />
          <SearchField
            keyword={keyword}
            autoFocus={false}
            label={fieldLabel}
            onChange={setKeyword}
            onClear={clearKeyword}
            onSearch={() => submit(keyword)}
          />
        </View>

        <SessionFilterBar
          values={values}
          sort={sort}
          sortOptions={isFindMode ? ["LATEST"] : undefined}
          onSortChange={setSort}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        {isFindMode ? (
          <CandidateSearchResults
            keyword={submittedKeyword}
            values={values}
            onSearched={refetchHistory}
          />
        ) : (
          <RecruitmentSearchResults
            keyword={submittedKeyword}
            sort={sort}
            values={values}
            onSearched={refetchHistory}
          />
        )}

        <SessionFilterSheet
          open={isFilterOpen}
          values={values}
          onApply={onApplyFilters}
          onClose={() => setIsFilterOpen(false)}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.backHeader}>
        <BackButton onBack={onBack} />
      </View>

      <View style={styles.fieldRow}>
        <SearchField
          autoFocus
          keyword={keyword}
          label={fieldLabel}
          onChange={setKeyword}
          onClear={clearKeyword}
          onSearch={() => submit(keyword)}
        />
      </View>

      <View style={styles.recent}>
        <Text style={styles.recentTitle}>최근 검색어</Text>

        {historyQuery.isLoading ? (
          <Text style={styles.recentMessage}>
            최근 검색어를 불러오고 있어요
          </Text>
        ) : historyQuery.isError ? (
          <Text style={styles.recentMessage}>
            최근 검색어를 불러오지 못했어요
          </Text>
        ) : recentKeywords.length > 0 ? (
          <View style={styles.recentChips}>
            {recentKeywords.map((item) => (
              <View
                key={`${item.keywordId}-${item.keyword}`}
                style={styles.recentChip}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => submit(item.keyword)}
                >
                  <Text style={styles.recentChipText}>{item.keyword}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.keyword} 삭제`}
                  hitSlop={6}
                  onPress={() => removeKeyword(item.keywordId, item.keyword)}
                >
                  <Text style={styles.recentChipRemove}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.recentMessage}>최근 검색어가 없습니다</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backHeader: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  resultHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldRow: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  field: {
    height: 36,
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  fieldActive: {
    borderWidth: 1,
    borderColor: colors.secondary500,
    paddingHorizontal: 14,
  },
  input: {
    ...textStyles.caption2,
    height: "100%",
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    color: colors.neutral900,
    paddingVertical: 0,
  },
  inputIdle: {
    marginLeft: 0,
    paddingLeft: 36,
    paddingRight: 22,
  },
  clearButton: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  recent: {
    marginTop: 26,
    paddingHorizontal: 38,
  },
  recentTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  recentMessage: {
    ...textStyles.caption2,
    marginTop: 16,
    color: colors.neutral600,
  },
  recentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  recentChip: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
  },
  recentChipText: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  recentChipRemove: {
    ...textStyles.caption2,
    color: colors.neutral500,
  },
  recruitmentState: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  recruitmentList: {
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
  findState: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  findList: {
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },
  loadingMore: {
    ...textStyles.caption2,
    color: colors.neutral500,
    paddingVertical: 12,
    textAlign: "center",
  },
});
