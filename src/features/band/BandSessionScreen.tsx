import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import {
  useAddSessionRecruitmentInterest,
  useRemoveSessionRecruitmentInterest,
  useSessionRecruitmentsQuery,
} from "@/hooks/api/session/useSessionRecruitment";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Badge } from "@/shared/components/Badge";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type {
  SessionRecruitmentListItem,
  SessionRecruitmentSort,
} from "@/types/session/sessionRecruitment";

const formatDday = (dDay: number) => {
  if (dDay < 0) return "마감";
  if (dDay === 0) return "오늘 마감";
  return `D-${dDay}`;
};

const formatPostedAgo = (postedAgo: number) => {
  if (postedAgo <= 0) return "방금 전";
  if (postedAgo < 24) return `${postedAgo}시간 전`;
  return `${Math.floor(postedAgo / 24)}일 전`;
};

export function BandSessionScreen() {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SessionRecruitmentSort>("LATEST");
  const params = useMemo(
    () => ({
      keyword,
      sort,
      size: 20,
    }),
    [keyword, sort],
  );
  const query = useSessionRecruitmentsQuery(params);
  const posts = query.data?.content ?? [];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader
        title="세션"
        showBack={false}
        rightContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="모집 공고 등록"
            hitSlop={12}
            style={styles.headerButton}
            onPress={() =>
              router.push(
                "/band/session/recruitments/form" as Parameters<typeof router.push>[0],
              )
            }
          >
            <Plus size={22} color={colors.neutral900} />
          </Pressable>
        }
      />

      <View style={styles.searchPanel}>
        <AppButton
          label="내 지원 현황"
          variant="secondary"
          onPress={() =>
            router.push(
              "/band/session/applications" as Parameters<typeof router.push>[0],
            )
          }
        />
        <AppTextInput
          label="세션 모집 검색"
          value={keyword}
          placeholder="파트, 밴드명, 키워드로 검색"
          onChangeText={setKeyword}
        />
        <View style={styles.filterGroup}>
          <Chip
            label="최신순"
            selected={sort === "LATEST"}
            onPress={() => setSort("LATEST")}
          />
          <Chip
            label="마감 임박"
            selected={sort === "IMMINENT"}
            onPress={() => setSort("IMMINENT")}
          />
        </View>
      </View>

      {query.isLoading ? (
        <AppState loading title="세션 모집 공고를 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="세션 모집 공고를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : posts.length === 0 ? (
        <AppState
          title="모집 공고가 없어요"
          description="다른 검색어로 다시 찾거나 새 공고를 등록해 보세요."
          actionLabel="모집 공고 등록"
          onAction={() =>
            router.push(
              "/band/session/recruitments/form" as Parameters<typeof router.push>[0],
            )
          }
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.sessionRecruitmentId)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <RecruitmentRow item={item} />}
          ListFooterComponent={
            query.data?.hasNext ? (
              <Text style={styles.footerText}>
                더 많은 공고는 다음 페이지 연동에서 이어집니다
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function RecruitmentRow({ item }: { item: SessionRecruitmentListItem }) {
  const addInterestMutation = useAddSessionRecruitmentInterest();
  const removeInterestMutation = useRemoveSessionRecruitmentInterest();
  const isPending = addInterestMutation.isPending || removeInterestMutation.isPending;

  const toggleInterest = async () => {
    try {
      if (item.isInterested) {
        await removeInterestMutation.mutateAsync(item.sessionRecruitmentId);
        return;
      }

      await addInterestMutation.mutateAsync(item.sessionRecruitmentId);
    } catch {
      Alert.alert("관심 공고", "관심 상태를 변경하지 못했어요.");
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push(
          `/band/session/recruitments/${item.sessionRecruitmentId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <AppCard style={styles.card}>
        <View style={styles.rowHeader}>
          <Badge label={formatDday(item.dDay)} tone="yellow" />
          {item.isNew ? <Badge label="NEW" tone="pink" /> : null}
          {item.isMine ? <Badge label="내 공고" /> : null}
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {item.recruitmentTitle}
        </Text>
        <Text style={styles.meta}>
          {[item.bandName, item.bandGenre, item.bandRegion].filter(Boolean).join(" · ")}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {item.summary}
        </Text>
        <View style={styles.rowFooter}>
          <View style={styles.badges}>
            <Badge label={item.part} />
            <Badge label={item.skillLevel} />
            <Text style={styles.meta}>{formatPostedAgo(item.postedAgo)}</Text>
          </View>
          <AppButton
            label={item.isInterested ? "관심 해제" : "관심"}
            variant={item.isInterested ? "secondary" : "ghost"}
            loading={isPending}
            style={styles.compactButton}
            onPress={() => void toggleInterest()}
          />
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  searchPanel: {
    gap: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  filterGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  rowHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  description: {
    color: colors.neutral700,
    fontSize: 13,
    lineHeight: 19,
  },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  badges: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
});
