import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SessionFindContent } from "@/features/band/BandSessionFindScreen";
import {
  FloatingCreateButton,
  INITIAL_SESSION_FILTERS,
  matchesRecruitmentFilters,
  RecruitmentPostCard,
  SessionFilterBar,
  SessionFilterSheet,
  SessionPageHeader,
  SessionStateBox,
  SessionTabs,
  type SessionFilterValues,
  type SessionTabId,
} from "@/features/session/SessionHomeParts";
import { SessionSearchView } from "@/features/session/SessionSearchView";
import { useSessionRecruitmentsQuery } from "@/hooks/api/session/useSessionRecruitment";
import { colors } from "@/shared/constants/theme";
import type { SessionRecruitmentSort } from "@/types/session/sessionRecruitment";

export function BandSessionScreen() {
  const [activeTab, setActiveTab] = useState<SessionTabId>("recruitment");
  const [sort, setSort] = useState<SessionRecruitmentSort>("LATEST");
  const [recruitmentFilters, setRecruitmentFilters] =
    useState<SessionFilterValues>(INITIAL_SESSION_FILTERS);
  const [findFilters, setFindFilters] = useState<SessionFilterValues>(
    INITIAL_SESSION_FILTERS,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isFindTab = activeTab === "find";
  const filters = isFindTab ? findFilters : recruitmentFilters;
  const applyFilters = isFindTab ? setFindFilters : setRecruitmentFilters;

  const query = useSessionRecruitmentsQuery({ size: 20, sort });
  const posts = query.data?.content;
  const filteredPosts = useMemo(
    () =>
      (posts ?? []).filter((post) =>
        matchesRecruitmentFilters(post, recruitmentFilters),
      ),
    [posts, recruitmentFilters],
  );

  const handleTabChange = (tab: SessionTabId) => {
    if (tab === "applications") {
      router.push(
        "/band/session/applications" as Parameters<typeof router.push>[0],
      );
      return;
    }

    setActiveTab(tab);
  };

  if (isSearchOpen) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <SessionSearchView
          mode={isFindTab ? "find" : "recruitment"}
          values={filters}
          onBack={() => setIsSearchOpen(false)}
          onApplyFilters={applyFilters}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <SessionPageHeader
          onSearch={() => setIsSearchOpen(true)}
          onMessages={() =>
            router.push(
              "/band/session/messages" as Parameters<typeof router.push>[0],
            )
          }
        />

        <SessionTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <SessionFilterBar
          values={filters}
          sort={isFindTab ? "LATEST" : sort}
          sortOptions={isFindTab ? ["LATEST"] : undefined}
          showBottomBorder={!isFindTab}
          compactHeight={isFindTab}
          onSortChange={isFindTab ? () => undefined : setSort}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        {isFindTab ? (
          <SessionFindContent values={findFilters} />
        ) : query.isLoading ? (
          <View style={styles.stateArea}>
            <SessionStateBox text="모집 공고를 불러오고 있어요" />
          </View>
        ) : query.isError ? (
          <View style={styles.stateArea}>
            <SessionStateBox
              text="모집 공고를 불러오지 못했어요"
              onRetry={() => void query.refetch()}
            />
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.stateArea}>
            <SessionStateBox text="선택한 조건에 맞는 모집 공고가 없어요" />
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => String(item.sessionRecruitmentId)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <RecruitmentPostCard item={item} />}
            refreshing={query.isFetching}
            onRefresh={() => void query.refetch()}
          />
        )}

        {!isFindTab ? (
          <FloatingCreateButton
            onPress={() =>
              router.push(
                "/band/session/recruitments/form" as Parameters<
                  typeof router.push
                >[0],
              )
            }
          />
        ) : null}

        <SessionFilterSheet
          open={isFilterOpen}
          values={filters}
          onApply={applyFilters}
          onClose={() => setIsFilterOpen(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  stateArea: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  listContent: {
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 100,
  },
});
