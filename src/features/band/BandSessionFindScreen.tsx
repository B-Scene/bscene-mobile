import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSessionApplicationsSearchInfiniteQuery } from "@/hooks/api/session/useSessionApplication";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type { SessionApplicationSearchItem } from "@/types/session/sessionApplication";

const PART_OPTIONS = ["전체", "보컬", "기타", "베이스", "키보드", "드럼"];
const SKILL_OPTIONS = ["전체", "입문", "중급", "상급"];
const GENRE_OPTIONS = [
  "전체",
  "인디",
  "팝",
  "팝록",
  "재즈",
  "블루스",
  "하드록",
  "메탈",
];
const REGION_OPTIONS = [
  "전체",
  "서울",
  "경기",
  "인천",
  "대전",
  "세종",
  "대구",
  "부산",
  "광주",
];

const getFilterValue = (value: string) => {
  if (value === "전체") {
    return undefined;
  }

  if (value.toLowerCase() === "etc.") {
    return "etc";
  }

  return value;
};

export function BandSessionFindScreen() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [part, setPart] = useState("전체");
  const [skillLevel, setSkillLevel] = useState("전체");
  const [genre, setGenre] = useState("전체");
  const [region, setRegion] = useState("전체");
  const [isNoticeVisible, setIsNoticeVisible] = useState(true);

  const params = useMemo(
    () => ({
      keyword: submittedKeyword || undefined,
      part: getFilterValue(part),
      skillLevel: getFilterValue(skillLevel),
      genre: getFilterValue(genre),
      region: getFilterValue(region),
      size: 10,
    }),
    [genre, part, region, skillLevel, submittedKeyword],
  );

  const query = useSessionApplicationsSearchInfiniteQuery(params);

  const candidates = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data],
  );

  const search = () => {
    setSubmittedKeyword(keyword.trim());
  };

  const loadMore = () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    void query.fetchNextPage();
  };

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="세션 찾기" />

      {isNoticeVisible ? (
        <View style={styles.noticeSection}>
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              필터를 선택하지 않으면 기본 지원서에서 선택한{"\n"}
              활동 지역, 장르와 같은 세션 뮤지션이 먼저 보여요.
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
      )}

      <View style={styles.searchArea}>
        <View style={styles.searchRow}>
          <Search size={18} color={colors.neutral500} />
          <TextInput
            value={keyword}
            placeholder="닉네임, 지원서 제목 검색"
            placeholderTextColor={colors.neutral500}
            returnKeyType="search"
            style={styles.searchInput}
            onSubmitEditing={search}
            onChangeText={setKeyword}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.searchButton}
            onPress={search}
          >
            <Text style={styles.searchButtonText}>검색</Text>
          </Pressable>
        </View>

        <FilterSection
          title="파트"
          options={PART_OPTIONS}
          value={part}
          onChange={setPart}
        />
        <FilterSection
          title="실력대"
          options={SKILL_OPTIONS}
          value={skillLevel}
          onChange={setSkillLevel}
        />
        <FilterSection
          title="장르"
          options={GENRE_OPTIONS}
          value={genre}
          onChange={setGenre}
        />
        <FilterSection
          title="지역"
          options={REGION_OPTIONS}
          value={region}
          onChange={setRegion}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>세션 뮤지션을 불러오고 있어요</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>세션 뮤지션을 불러오지 못했어요</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : candidates.length === 0 ? (
        <AppState
          title="조건에 맞는 세션이 없어요"
          description="검색어나 필터를 변경해 보세요."
        />
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) => String(item.sessionApplicationId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <CandidateCard candidate={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text style={styles.loadingMore}>
                세션 뮤지션을 더 불러오는 중이에요
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function FilterSection({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.filter}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                selected ? styles.chipSelected : styles.chipIdle,
              ]}
              onPress={() => onChange(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  selected ? styles.chipTextSelected : styles.chipTextIdle,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CandidateCard({
  candidate,
}: {
  candidate: SessionApplicationSearchItem;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() =>
        router.push(
          `/band/session/find/${candidate.sessionApplicationId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <Avatar
        imageUrl={candidate.profileImageUrl}
        label={candidate.nickname}
        size={50}
      />

      <View style={styles.candidateInfo}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.nickname}>
            {candidate.nickname}
          </Text>
          <Text style={styles.skillBadge}>{candidate.skillLevel}</Text>
        </View>

        <Text numberOfLines={1} style={styles.meta}>
          {candidate.part} · {candidate.genre} · {candidate.region}
        </Text>

        <Text numberOfLines={1} style={styles.applicationTitle}>
          {candidate.title}
        </Text>
        <Text numberOfLines={2} style={styles.summary}>
          {candidate.oneLineIntro}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    backgroundColor: colors.white,
  },
  noticeSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    paddingHorizontal: 24,
    paddingBottom: 9,
  },
  noticeBox: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 12,
    backgroundColor: colors.secondary0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  noticeText: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
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
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  searchArea: {
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 18,
  },
  searchRow: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 0,
  },
  searchButton: {
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  filter: {
    gap: 8,
  },
  filterTitle: {
    color: colors.neutral800,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  chipSelected: {
    backgroundColor: colors.secondary500,
  },
  chipIdle: {
    backgroundColor: colors.neutral300,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  chipTextSelected: {
    color: colors.white,
  },
  chipTextIdle: {
    color: colors.neutral600,
  },
  stateCard: {
    minHeight: 220,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    paddingHorizontal: 24,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  stateText: {
    color: colors.neutral500,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  separator: {
    height: 18,
  },
  card: {
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  candidateInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nickname: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  skillBadge: {
    minWidth: 54,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.secondary0,
    color: colors.secondary500,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 24,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  applicationTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 12,
  },
  summary: {
    color: colors.neutral900,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  loadingMore: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 16,
    textAlign: "center",
  },
});
