import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  useAddSessionRecruitmentInterest,
  useRemoveSessionRecruitmentInterest,
} from "@/hooks/api/session/useSessionRecruitment";
import { BottomSheetModal } from "@/shared/components/BottomSheetModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { colors, textStyles } from "@/shared/constants/theme";
import type { SessionApplicationSearchItem } from "@/types/session/sessionApplication";
import type {
  SessionRecruitmentListItem,
  SessionRecruitmentSort,
} from "@/types/session/sessionRecruitment";

export type SessionTabId = "recruitment" | "find" | "applications";

export type SessionFilterKey = "part" | "skill" | "genre" | "region";

export type SessionFilterValues = Record<SessionFilterKey, string>;

const SESSION_TABS: { id: SessionTabId; label: string }[] = [
  { id: "recruitment", label: "세션 모집" },
  { id: "find", label: "세션 찾기" },
  { id: "applications", label: "내 지원서" },
];

const SESSION_FILTER_GROUPS: {
  id: SessionFilterKey;
  title: string;
  options: string[];
}[] = [
  {
    id: "part",
    title: "파트",
    options: ["전체", "보컬", "기타", "베이스", "키보드", "드럼", "etc."],
  },
  {
    id: "skill",
    title: "실력대",
    options: ["전체", "입문", "중급", "상급"],
  },
  {
    id: "genre",
    title: "장르",
    options: [
      "전체",
      "인디",
      "팝",
      "팝록",
      "재즈",
      "블루스",
      "얼터너티브록",
      "사이키델릭록",
      "일렉트로닉록",
      "포크록",
      "펑크록",
      "하드록",
      "메탈",
      "etc.",
    ],
  },
  {
    id: "region",
    title: "지역",
    options: [
      "전체",
      "서울",
      "경기",
      "인천",
      "부산",
      "대구",
      "광주",
      "대전",
      "울산",
      "세종",
      "충남",
      "충북",
      "전남",
      "전북",
      "경남",
      "경북",
      "강원",
      "제주",
    ],
  },
];

const SORT_OPTIONS: { label: string; value: SessionRecruitmentSort }[] = [
  { label: "최신순", value: "LATEST" },
  { label: "마감일순", value: "IMMINENT" },
];

export const INITIAL_SESSION_FILTERS: SessionFilterValues = {
  part: "전체",
  skill: "전체",
  genre: "전체",
  region: "전체",
};

export const getFilterParam = (value: string) => {
  if (value === "전체") return undefined;
  if (value.toLowerCase() === "etc.") return "etc";

  return value;
};

export const matchesRecruitmentFilters = (
  post: SessionRecruitmentListItem,
  filters: SessionFilterValues,
) =>
  (filters.part === "전체" || post.part === filters.part) &&
  (filters.skill === "전체" || post.skillLevel === filters.skill) &&
  (filters.genre === "전체" || post.bandGenre.includes(filters.genre)) &&
  (filters.region === "전체" || post.bandRegion.includes(filters.region));

const getDeadlineLabel = (dDay: number) => {
  if (dDay < 0) return "마감";
  if (dDay === 0) return "오늘 마감";

  return `D-${dDay}`;
};

const getPostedAgoLabel = (postedAgo: number) => {
  if (!Number.isFinite(postedAgo)) return "";
  if (postedAgo <= 0) return "오늘";

  return `${postedAgo}일 전`;
};

function SearchIcon() {
  return (
    <Svg width={23} height={23} viewBox="0 0 21 20" fill="none">
      <Path
        d="m19.73 18.31-3.71-3.68a9 9 0 1 0-1.39 1.39l3.68 3.68a1.002 1.002 0 0 0 1.42 0 1 1 0 0 0 0-1.39ZM9.02 16.02a7 7 0 1 1 0-13.999 7 7 0 0 1 0 14Z"
        fill={colors.neutral900}
      />
    </Svg>
  );
}

function AirplaneIcon() {
  return (
    <Svg width={23} height={23} viewBox="6 9 20 20" fill="none">
      <Path
        d="m12.02 21.92-4.27-3.416c-1.223-.978-.898-2.918.577-3.445l12.446-4.445c1.59-.568 3.124.967 2.556 2.556l-4.445 12.447c-.526 1.474-2.467 1.799-3.445.576l-3.417-4.271Zm0 0 4.95-4.95"
        stroke={colors.neutral900}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M14.502 18.333h4.748a.916.916 0 1 0 0-1.833h-4.748a2.75 2.75 0 0 0-5.17 0H2.75a.917.917 0 0 0 0 1.833h6.582a2.75 2.75 0 0 0 5.17 0ZM11 17.416a.917.917 0 1 1 1.834 0 .917.917 0 0 1-1.834 0Zm-1.998-5.5H19.25a.917.917 0 0 0 0-1.833H9.002a2.75 2.75 0 0 0-5.17 0H2.75a.917.917 0 0 0 0 1.833h1.082a2.75 2.75 0 0 0 5.17 0ZM5.5 11a.917.917 0 1 1 1.834 0A.917.917 0 0 1 5.5 11Zm10.835-5.5h2.915a.917.917 0 0 0 0-1.834h-2.915a2.75 2.75 0 0 0-5.17 0H2.75a.917.917 0 0 0 0 1.834h8.415a2.75 2.75 0 0 0 5.17 0Zm-3.502-.917a.917.917 0 1 1 1.834 0 .917.917 0 0 1-1.834 0Z"
        fill={colors.neutral900}
      />
    </Svg>
  );
}

function SortChevronIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3 5.25L7 9.25L11 5.25"
        stroke={colors.neutral600}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5L10 17.5L19 7.5"
        stroke={colors.secondary500}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="m12 2.8 2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.25l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92L12 2.8Z"
        fill={active ? colors.secondary500 : "none"}
        stroke={active ? colors.secondary500 : colors.neutral400}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Path
        d="M18 7v22M7 18h22"
        stroke={colors.white}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SessionPageHeader({
  onSearch,
  onMessages,
}: {
  onSearch: () => void;
  onMessages: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>세션</Text>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="세션 검색"
          style={styles.headerIcon}
          onPress={onSearch}
        >
          <SearchIcon />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="쪽지함 열기"
          style={styles.headerIcon}
          onPress={onMessages}
        >
          <AirplaneIcon />
        </Pressable>
      </View>
    </View>
  );
}

export function SessionTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: SessionTabId;
  onTabChange: (tab: SessionTabId) => void;
}) {
  const activeIndex = SESSION_TABS.findIndex((tab) => tab.id === activeTab);
  const [position] = useState(() => new Animated.Value(activeIndex));

  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: activeIndex,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [activeIndex, position]);

  return (
    <View style={styles.tabs}>
      {SESSION_TABS.map((tab) => (
        <Pressable
          key={tab.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab.id }}
          style={styles.tab}
          onPress={() => onTabChange(tab.id)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.tabIndicatorTrack,
          {
            left: position.interpolate({
              inputRange: [0, 1, 2],
              outputRange: ["0%", "33.3333%", "66.6667%"],
            }),
          },
        ]}
      >
        <View style={styles.tabIndicator} />
      </Animated.View>
    </View>
  );
}

export function SessionFilterBar({
  values,
  sort,
  sortOptions = ["LATEST", "IMMINENT"],
  showBottomBorder = true,
  compactHeight = false,
  onSortChange,
  onOpenFilter,
}: {
  values: SessionFilterValues;
  sort: SessionRecruitmentSort;
  sortOptions?: SessionRecruitmentSort[];
  showBottomBorder?: boolean;
  compactHeight?: boolean;
  onSortChange: (sort: SessionRecruitmentSort) => void;
  onOpenFilter: () => void;
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "최신순";
  const visibleSortOptions = SORT_OPTIONS.filter((option) =>
    sortOptions.includes(option.value),
  );

  return (
    <>
      <View
        style={[
          styles.filterBar,
          compactHeight && styles.filterBarCompact,
          showBottomBorder && styles.filterBarBorder,
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`정렬 기준: ${sortLabel}`}
            style={[
              styles.sortButton,
              { width: sort === "IMMINENT" ? 73 : 62 },
            ]}
            onPress={() => setIsSortOpen(true)}
          >
            <Text style={styles.sortText}>{sortLabel}</Text>
            <SortChevronIcon />
          </Pressable>

          <View style={styles.filterLine} />

          <View style={styles.filterPills}>
            {SESSION_FILTER_GROUPS.map((group) => {
              const selected = values[group.id] !== "전체";

              return (
                <Pressable
                  key={group.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.filterPill,
                    selected && styles.filterPillSelected,
                  ]}
                  onPress={onOpenFilter}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.filterPillText,
                      selected && styles.filterPillTextSelected,
                    ]}
                  >
                    {group.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="필터 설정"
          hitSlop={8}
          style={styles.filterIcon}
          onPress={onOpenFilter}
        >
          <FilterIcon />
        </Pressable>
      </View>

      <BottomSheetModal
        open={isSortOpen}
        closeLabel="정렬 옵션 닫기"
        backdropColor="rgba(0, 0, 0, 0.45)"
        onClose={() => setIsSortOpen(false)}
      >
        <View style={styles.sortSheet}>
          {visibleSortOptions.map((option) => {
            const selected = sort === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                style={styles.sortOption}
                onPress={() => {
                  onSortChange(option.value);
                  setIsSortOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    selected && styles.sortOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selected ? <CheckIcon /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </>
  );
}

export function SessionFilterSheet({
  open,
  values,
  onApply,
  onClose,
}: {
  open: boolean;
  values: SessionFilterValues;
  onApply: (values: SessionFilterValues) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(values);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(values);
  }

  const hasChanges = SESSION_FILTER_GROUPS.some(
    (group) => draft[group.id] !== values[group.id],
  );

  return (
    <BottomSheetModal
      open={open}
      closeLabel="필터 닫기"
      backdropColor="rgba(20, 20, 20, 0.7)"
      onClose={onClose}
    >
      <View style={styles.filterSheet}>
        <View style={styles.filterSheetHeader}>
          <View style={styles.filterSheetHandle} />
          <Text style={styles.filterSheetTitle}>필터</Text>
        </View>

        <View
          style={[
            styles.filterSheetBody,
            { paddingBottom: 20 + insets.bottom },
          ]}
        >
          <ScrollView
            style={styles.filterSheetScroll}
            contentContainerStyle={styles.filterSheetContent}
          >
            {SESSION_FILTER_GROUPS.map((group) => (
              <View key={group.id}>
                <Text style={styles.filterGroupTitle}>{group.title}</Text>

                <View style={styles.filterOptions}>
                  {group.options.map((option) => {
                    const selected = draft[group.id] === option;

                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[
                          styles.filterOption,
                          selected && styles.filterOptionSelected,
                        ]}
                        onPress={() =>
                          setDraft((current) => ({
                            ...current,
                            [group.id]: option,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            selected && styles.filterOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={!hasChanges}
            style={[styles.applyButton, hasChanges && styles.applyButtonActive]}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            <Text
              style={[styles.applyText, hasChanges && styles.applyTextActive]}
            >
              선택완료
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}

export function SessionStateBox({
  text,
  variant = "recruitment",
  onRetry,
}: {
  text: string;
  variant?: "recruitment" | "find";
  onRetry?: () => void;
}) {
  return (
    <View
      style={[styles.stateBox, variant === "find" && styles.stateBoxFind]}
    >
      <Text style={styles.stateText}>{text}</Text>

      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          style={styles.retryButton}
          onPress={onRetry}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RecruitmentPostCard({
  item,
}: {
  item: SessionRecruitmentListItem;
}) {
  const addMutation = useAddSessionRecruitmentInterest();
  const removeMutation = useRemoveSessionRecruitmentInterest();
  const isPending = addMutation.isPending || removeMutation.isPending;
  const postedAgoLabel = getPostedAgoLabel(item.postedAgo);

  const handleBookmark = async () => {
    if (isPending) return;

    try {
      if (item.isInterested) {
        await removeMutation.mutateAsync(item.sessionRecruitmentId);
        return;
      }

      await addMutation.mutateAsync(item.sessionRecruitmentId);
    } catch {
      Alert.alert("관심 공고", "관심 상태를 변경하지 못했어요.");
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.postCard}
      onPress={() =>
        router.push(
          `/band/session/recruitments/${item.sessionRecruitmentId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <View style={styles.deadline}>
        <Text style={styles.deadlineText}>{getDeadlineLabel(item.dDay)}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.isInterested ? "북마크 해제" : "북마크"}
        accessibilityState={{ selected: item.isInterested }}
        disabled={isPending}
        hitSlop={10}
        style={styles.starButton}
        onPress={(event) => {
          event.stopPropagation();
          void handleBookmark();
        }}
      >
        <StarIcon active={item.isInterested} />
      </Pressable>

      <Text style={styles.postTitle}>{item.recruitmentTitle}</Text>

      <View style={styles.postMeta}>
        <Text numberOfLines={1} style={styles.postMetaText}>
          {[item.bandName, item.bandGenre, item.bandRegion].join(" · ")}
        </Text>

        {postedAgoLabel ? (
          <>
            <View style={styles.postMetaDivider} />
            <Text style={styles.postedAgo}>{postedAgoLabel}</Text>
          </>
        ) : null}
      </View>

      <Text style={styles.postDescription}>{item.summary}</Text>

      <Text style={styles.postTags}>
        {[item.part, item.skillLevel].filter(Boolean).join(" · ")}
      </Text>
    </Pressable>
  );
}

export function SessionCandidateCard({
  candidate,
}: {
  candidate: SessionApplicationSearchItem;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.candidateCard}
      onPress={() =>
        router.push(
          `/band/session/find/${candidate.sessionApplicationId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <ProfileImage imageUrl={candidate.profileImageUrl} size={50} />

      <View style={styles.candidateInfo}>
        <View style={styles.candidateNameRow}>
          <Text style={styles.candidateName}>{candidate.nickname}</Text>
          <View style={styles.skillBadge}>
            <Text style={styles.skillBadgeText}>{candidate.skillLevel}</Text>
          </View>
        </View>

        <Text style={styles.candidateMeta}>
          {candidate.part} · {candidate.genre} · {candidate.region}
        </Text>

        <Text style={styles.candidateTitle}>{candidate.title}</Text>
        <Text style={styles.candidateSummary}>{candidate.oneLineIntro}</Text>
      </View>
    </Pressable>
  );
}

export function FloatingCreateButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="세션 모집 공고 등록"
      style={styles.floatingButton}
      onPress={onPress}
    >
      <PlusIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...textStyles.label2,
    color: "#1D1A1A",
  },
  headerActions: {
    position: "absolute",
    top: 8,
    right: 24,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    height: 48,
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral300,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  tabTextActive: {
    color: colors.neutral900,
  },
  tabIndicatorTrack: {
    position: "absolute",
    bottom: -2,
    width: "33.3333%",
    height: 2,
    alignItems: "center",
  },
  tabIndicator: {
    width: 114,
    maxWidth: "100%",
    height: 2,
    backgroundColor: colors.secondary500,
  },
  filterBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
  },
  filterBarCompact: {
    height: 53,
  },
  filterBarBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral400,
  },
  filterScroll: {
    flex: 1,
  },
  filterScrollContent: {
    alignItems: "center",
  },
  sortButton: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  sortText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  filterLine: {
    width: 2,
    height: 26,
    marginHorizontal: 8,
    borderRadius: 1,
    backgroundColor: colors.neutral300,
  },
  filterPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterPill: {
    width: 49,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  filterPillSelected: {
    borderColor: colors.secondary400,
    backgroundColor: colors.secondary0,
  },
  filterPillText: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  filterPillTextSelected: {
    color: colors.secondary500,
  },
  filterIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sortSheet: {
    gap: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
    paddingHorizontal: 56,
    paddingTop: 38,
    paddingBottom: 70,
  },
  sortOption: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortOptionText: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  sortOptionTextSelected: {
    color: colors.secondary500,
  },
  filterSheet: {
    height: 610,
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
  },
  filterSheetHeader: {
    height: 70,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  filterSheetHandle: {
    width: 56,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral300,
  },
  filterSheetTitle: {
    ...textStyles.h4,
    marginTop: 20,
    color: colors.neutral900,
    textAlign: "center",
  },
  filterSheetBody: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
  },
  filterSheetScroll: {
    flex: 1,
  },
  filterSheetContent: {
    gap: 12,
    paddingHorizontal: 12,
  },
  filterGroupTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  filterOption: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.neutral300,
    paddingHorizontal: 12,
  },
  filterOptionSelected: {
    backgroundColor: colors.secondary500,
  },
  filterOptionText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  filterOptionTextSelected: {
    color: colors.white,
  },
  applyButton: {
    width: 353,
    maxWidth: "100%",
    height: 52,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.neutral300,
  },
  applyButtonActive: {
    backgroundColor: colors.secondary500,
  },
  applyText: {
    ...textStyles.label2,
    color: colors.neutral600,
  },
  applyTextActive: {
    color: colors.white,
  },
  stateBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    boxShadow: "0px 0px 12px 0px rgba(0, 0, 0, 0.08)",
  },
  stateBoxFind: {
    borderRadius: 12,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.08)",
  },
  stateText: {
    ...textStyles.caption1,
    color: colors.neutral500,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption2,
    color: colors.white,
  },
  postCard: {
    minHeight: 184,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 18,
    boxShadow: "0px 0px 12px 0px rgba(0, 0, 0, 0.08)",
  },
  deadline: {
    height: 22,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 12,
  },
  deadlineText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  starButton: {
    position: "absolute",
    top: 22,
    right: 28,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  postTitle: {
    ...textStyles.label1,
    marginTop: 14,
    color: colors.neutral900,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  postMetaText: {
    ...textStyles.caption3,
    flexShrink: 1,
    color: colors.neutral600,
  },
  postMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.neutral300,
  },
  postedAgo: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  postDescription: {
    ...textStyles.caption2,
    maxWidth: 300,
    marginTop: 8,
    color: colors.neutral800,
    lineHeight: 22,
  },
  postTags: {
    ...textStyles.caption3,
    marginTop: 4,
    color: colors.secondary500,
  },
  candidateCard: {
    flexDirection: "row",
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.08)",
  },
  candidateInfo: {
    flex: 1,
    minWidth: 0,
  },
  candidateNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  candidateName: {
    ...textStyles.label1,
    flexShrink: 1,
    color: colors.neutral900,
  },
  skillBadge: {
    minWidth: 54,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 12,
  },
  skillBadgeText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  candidateMeta: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  candidateTitle: {
    ...textStyles.body1,
    marginTop: 12,
    color: colors.neutral900,
  },
  candidateSummary: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral900,
  },
  floatingButton: {
    position: "absolute",
    right: 24,
    bottom: 30,
    zIndex: 20,
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: colors.secondary500,
    boxShadow: "0px 8px 20px 0px rgba(251, 177, 14, 0.35)",
  },
});
