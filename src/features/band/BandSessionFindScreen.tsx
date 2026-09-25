import { router } from "expo-router";
import {
  Search,
} from "lucide-react-native";
import {
  useMemo,
  useState,
} from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useSessionApplicationsSearchInfiniteQuery,
} from "@/hooks/api/session/useSessionApplication";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Chip } from "@/shared/components/Chip";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  spacing,
} from "@/shared/constants/theme";

import type {
  SessionApplicationSearchItem,
} from "@/types/session/sessionApplication";

const PART_OPTIONS = [
  "전체",
  "보컬",
  "기타",
  "베이스",
  "키보드",
  "드럼",
];

const SKILL_OPTIONS = [
  "전체",
  "입문",
  "중급",
  "상급",
];

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

const getFilterValue = (
  value: string,
) => {
  if (value === "전체") {
    return undefined;
  }

  if (
    value.toLowerCase() ===
    "etc."
  ) {
    return "etc";
  }

  return value;
};

export function BandSessionFindScreen() {
  const [
    keyword,
    setKeyword,
  ] = useState("");

  const [
    submittedKeyword,
    setSubmittedKeyword,
  ] = useState("");

  const [part, setPart] =
    useState("전체");

  const [
    skillLevel,
    setSkillLevel,
  ] = useState("전체");

  const [genre, setGenre] =
    useState("전체");

  const [region, setRegion] =
    useState("전체");

  const params = useMemo(
    () => ({
      keyword:
        submittedKeyword ||
        undefined,

      part:
        getFilterValue(part),

      skillLevel:
        getFilterValue(
          skillLevel,
        ),

      genre:
        getFilterValue(
          genre,
        ),

      region:
        getFilterValue(
          region,
        ),

      size: 10,
    }),
    [
      genre,
      part,
      region,
      skillLevel,
      submittedKeyword,
    ],
  );

  const query =
    useSessionApplicationsSearchInfiniteQuery(
      params,
    );

  const candidates =
    useMemo(
      () =>
        query.data?.pages.flatMap(
          (page) =>
            page.content,
        ) ?? [],
      [query.data],
    );

  const search = () => {
    setSubmittedKeyword(
      keyword.trim(),
    );
  };

  const loadMore = () => {
    if (
      !query.hasNextPage ||
      query.isFetchingNextPage
    ) {
      return;
    }

    void query.fetchNextPage();
  };

  return (
    <Screen
      scroll={false}
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="세션 찾기" />

      <View
        style={
          styles.searchArea
        }
      >
        <AppTextInput
          label="세션 뮤지션 검색"
          value={keyword}
          placeholder="닉네임, 지원서 제목 검색"
          returnKeyType="search"
          onSubmitEditing={
            search
          }
          onChangeText={
            setKeyword
          }
        />

        <AppButton
          label="검색"
          onPress={search}
        />

        <FilterSection
          title="파트"
          options={
            PART_OPTIONS
          }
          value={part}
          onChange={setPart}
        />

        <FilterSection
          title="실력대"
          options={
            SKILL_OPTIONS
          }
          value={skillLevel}
          onChange={
            setSkillLevel
          }
        />

        <FilterSection
          title="장르"
          options={
            GENRE_OPTIONS
          }
          value={genre}
          onChange={setGenre}
        />

        <FilterSection
          title="지역"
          options={
            REGION_OPTIONS
          }
          value={region}
          onChange={setRegion}
        />
      </View>

      {query.isLoading ? (
        <AppState
          loading
          title="세션 뮤지션을 불러오는 중이에요"
        />
      ) : query.isError ? (
        <AppState
          title="세션 뮤지션을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : candidates.length ===
        0 ? (
        <AppState
          title="조건에 맞는 세션이 없어요"
          description="검색어나 필터를 변경해 보세요."
        />
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) =>
            String(
              item.sessionApplicationId,
            )
          }
          contentContainerStyle={
            styles.list
          }
          renderItem={({
            item,
          }) => (
            <CandidateCard
              candidate={item}
            />
          )}
          onEndReached={
            loadMore
          }
          onEndReachedThreshold={
            0.4
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <Text
                style={
                  styles.loadingMore
                }
              >
                더 불러오는
                중이에요...
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
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <View
      style={styles.filter}
    >
      <Text
        style={
          styles.filterTitle
        }
      >
        {title}
      </Text>

      <View
        style={styles.chips}
      >
        {options.map(
          (option) => (
            <Chip
              key={option}
              label={option}
              selected={
                value === option
              }
              onPress={() =>
                onChange(option)
              }
            />
          ),
        )}
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
      onPress={() =>
        router.push(
          `/band/session/find/${candidate.sessionApplicationId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <AppCard
        style={styles.card}
      >
        <View
          style={
            styles.candidateRow
          }
        >
          <Avatar
            imageUrl={
              candidate.profileImageUrl
            }
            label={
              candidate.nickname
            }
            size={58}
          />

          <View
            style={
              styles.candidateInfo
            }
          >
            <Text
              style={
                styles.nickname
              }
            >
              {
                candidate.nickname
              }
            </Text>

            <Text
              style={styles.meta}
            >
              {[
                candidate.part,
                candidate.skillLevel,
                candidate.region,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>

          <Search
            size={19}
            color={
              colors.neutral500
            }
          />
        </View>

        <View
          style={styles.badges}
        >
          <Badge
            label={
              candidate.part
            }
            tone="yellow"
          />

          <Badge
            label={
              candidate.genre
            }
          />
        </View>

        <Text
          style={
            styles.applicationTitle
          }
        >
          {
            candidate.title
          }
        </Text>

        <Text
          numberOfLines={2}
          style={
            styles.summary
          }
        >
          {
            candidate.oneLineIntro
          }
        </Text>
      </AppCard>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.lg,
    },

    searchArea: {
      gap: spacing.md,
    },

    filter: {
      gap: spacing.sm,
    },

    filterTitle: {
      color:
        colors.neutral800,
      fontSize: 13,
      fontWeight: "800",
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },

    list: {
      paddingBottom:
        spacing.xxl,
    },

    card: {
      gap: spacing.md,
      marginBottom:
        spacing.md,
    },

    candidateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    candidateInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    nickname: {
      color:
        colors.neutral900,
      fontSize: 17,
      fontWeight: "900",
    },

    meta: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
    },

    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },

    applicationTitle: {
      color:
        colors.neutral900,
      fontSize: 16,
      fontWeight: "900",
    },

    summary: {
      color:
        colors.neutral700,
      fontSize: 13,
      lineHeight: 19,
    },

    loadingMore: {
      paddingVertical:
        spacing.lg,
      textAlign: "center",
      color:
        colors.neutral500,
      fontSize: 12,
    },
  });