import { router } from "expo-router";
import {
  Check,
  ChevronDown,
  Plus,
  Star,
  X,
} from "lucide-react-native";
import {
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Path,
} from "react-native-svg";

import {
  useAddSessionRecruitmentInterest,
  useRemoveSessionRecruitmentInterest,
  useSessionRecruitmentsQuery,
} from "@/hooks/api/session/useSessionRecruitment";
import { colors } from "@/shared/constants/theme";
import type {
  SessionRecruitmentListItem,
  SessionRecruitmentSort,
} from "@/types/session/sessionRecruitment";

type SessionTabId =
  | "recruitment"
  | "find"
  | "applications";

type FilterKey =
  | "part"
  | "skill"
  | "genre"
  | "region";

type FilterValues = Record<
  FilterKey,
  string
>;

const SESSION_TABS: {
  id: SessionTabId;
  label: string;
}[] = [
  {
    id: "recruitment",
    label: "세션 모집",
  },
  {
    id: "find",
    label: "세션 찾기",
  },
  {
    id: "applications",
    label: "내 지원서",
  },
];

const FILTER_GROUPS: {
  id: FilterKey;
  title: string;
  options: string[];
}[] = [
  {
    id: "part",
    title: "파트",
    options: [
      "전체",
      "보컬",
      "기타",
      "베이스",
      "키보드",
      "드럼",
      "etc.",
    ],
  },
  {
    id: "skill",
    title: "실력대",
    options: [
      "전체",
      "입문",
      "중급",
      "상급",
    ],
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

const INITIAL_FILTERS: FilterValues =
  {
    part: "전체",
    skill: "전체",
    genre: "전체",
    region: "전체",
  };

const getDeadlineLabel = (
  dDay: number,
) => {
  if (dDay < 0) {
    return "마감";
  }

  if (dDay === 0) {
    return "오늘 마감";
  }

  return `D-${dDay}`;
};

const getPostedAgoLabel = (
  postedAgo: number,
) => {
  if (
    !Number.isFinite(
      postedAgo,
    )
  ) {
    return "";
  }

  if (postedAgo <= 0) {
    return "오늘";
  }

  return `${postedAgo}일 전`;
};

export function BandSessionScreen() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<SessionTabId>(
      "recruitment",
    );

  const [
    sort,
    setSort,
  ] =
    useState<SessionRecruitmentSort>(
      "LATEST",
    );

  const [
    filters,
    setFilters,
  ] =
    useState<FilterValues>(
      INITIAL_FILTERS,
    );

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<FilterValues>(
      INITIAL_FILTERS,
    );

  const [
    isSortOpen,
    setIsSortOpen,
  ] = useState(false);

  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false);

  const [
    keyword,
    setKeyword,
  ] = useState("");

  const query =
    useSessionRecruitmentsQuery(
      {
        size: 20,
        sort,
        keyword:
          keyword.trim() ||
          undefined,
      },
    );

  const posts =
    query.data?.content ??
    [];

  const filteredPosts =
    useMemo(() => {
      return posts.filter(
        (post) => {
          const matchesPart =
            filters.part ===
              "전체" ||
            post.part ===
              filters.part;

          const matchesSkill =
            filters.skill ===
              "전체" ||
            post.skillLevel ===
              filters.skill;

          const matchesGenre =
            filters.genre ===
              "전체" ||
            post.bandGenre.includes(
              filters.genre,
            );

          const matchesRegion =
            filters.region ===
              "전체" ||
            post.bandRegion.includes(
              filters.region,
            );

          return (
            matchesPart &&
            matchesSkill &&
            matchesGenre &&
            matchesRegion
          );
        },
      );
    }, [
      filters,
      posts,
    ]);

  const handleTabPress = (
    tab: SessionTabId,
  ) => {
    setActiveTab(tab);

    if (tab === "find") {
      router.push(
        "/band/session/find" as Parameters<
          typeof router.push
        >[0],
      );
      return;
    }

    if (
      tab ===
      "applications"
    ) {
      router.push(
        "/band/session/applications" as Parameters<
          typeof router.push
        >[0],
      );
    }
  };

  const openFilter = () => {
    setDraftFilters(
      filters,
    );

    setIsFilterOpen(
      true,
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        <SessionHeader
          isSearchOpen={
            isSearchOpen
          }
          keyword={keyword}
          onKeywordChange={
            setKeyword
          }
          onSearch={() =>
            setIsSearchOpen(
              (current) =>
                !current,
            )
          }
          onMessages={() =>
            router.push(
              "/band/session/messages" as Parameters<
                typeof router.push
              >[0],
            )
          }
        />

        <View
          style={styles.tabs}
        >
          {SESSION_TABS.map(
            (tab) => {
              const isActive =
                activeTab ===
                tab.id;

              return (
                <Pressable
                  key={tab.id}
                  style={
                    styles.tab
                  }
                  onPress={() =>
                    handleTabPress(
                      tab.id,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive
                        ? styles.tabTextActive
                        : styles.tabTextInactive,
                    ]}
                  >
                    {
                      tab.label
                    }
                  </Text>

                  {isActive ? (
                    <View
                      style={
                        styles
                          .tabIndicator
                      }
                    />
                  ) : null}
                </Pressable>
              );
            },
          )}
        </View>

        <View
          style={
            styles.filterBar
          }
        >
          <Pressable
            style={
              styles.sortButton
            }
            onPress={() =>
              setIsSortOpen(
                true,
              )
            }
          >
            <Text
              style={
                styles
                  .filterText
              }
            >
              {sort ===
              "LATEST"
                ? "최신순"
                : "마감일순"}
            </Text>

            <ChevronDown
              size={14}
              color={
                colors.neutral600
              }
              strokeWidth={2}
            />
          </Pressable>

          <View
            style={
              styles.filterDivider
            }
          />

          <View
            style={
              styles.filterPills
            }
          >
            {FILTER_GROUPS.map(
              (group) => {
                const selected =
                  filters[
                    group.id
                  ] !==
                  "전체";

                return (
                  <Pressable
                    key={
                      group.id
                    }
                    style={[
                      styles
                        .filterPill,
                      selected &&
                        styles
                          .filterPillSelected,
                    ]}
                    onPress={
                      openFilter
                    }
                  >
                    <Text
                      numberOfLines={
                        1
                      }
                      style={[
                        styles
                          .filterPillText,
                        selected &&
                          styles
                            .filterPillTextSelected,
                      ]}
                    >
                      {
                        group.title
                      }
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>

          <Pressable
            hitSlop={8}
            style={
              styles.filterIcon
            }
            onPress={
              openFilter
            }
          >
            <FilterIcon />
          </Pressable>
        </View>

        <View
          style={
            styles.listArea
          }
        >
          {query.isLoading ? (
            <StateCard text="모집 공고를 불러오고 있어요">
              <ActivityIndicator
                color={
                  colors.secondary500
                }
              />
            </StateCard>
          ) : query.isError ? (
            <StateCard text="모집 공고를 불러오지 못했어요">
              <Pressable
                style={
                  styles.retryButton
                }
                onPress={() =>
                  void query.refetch()
                }
              >
                <Text
                  style={
                    styles
                      .retryText
                  }
                >
                  다시 시도
                </Text>
              </Pressable>
            </StateCard>
          ) : filteredPosts
              .length === 0 ? (
            <StateCard
              text="선택한 조건에 맞는 모집 공고가 없어요"
            />
          ) : (
            <FlatList
              data={
                filteredPosts
              }
              keyExtractor={(
                item,
              ) =>
                String(
                  item.sessionRecruitmentId,
                )
              }
              contentContainerStyle={
                styles.listContent
              }
              showsVerticalScrollIndicator={
                false
              }
              renderItem={({
                item,
              }) => (
                <RecruitmentCard
                  item={item}
                />
              )}
              refreshing={
                query.isFetching
              }
              onRefresh={() =>
                void query.refetch()
              }
            />
          )}
        </View>

        <Pressable
          accessibilityLabel="세션 모집 공고 등록"
          style={
            styles.floatingButton
          }
          onPress={() =>
            router.push(
              "/band/session/recruitments/form" as Parameters<
                typeof router.push
              >[0],
            )
          }
        >
          <Plus
            size={36}
            color={
              colors.white
            }
            strokeWidth={2.2}
          />
        </Pressable>

        <SortModal
          visible={
            isSortOpen
          }
          sort={sort}
          onClose={() =>
            setIsSortOpen(
              false,
            )
          }
          onSelect={(
            nextSort,
          ) => {
            setSort(
              nextSort,
            );

            setIsSortOpen(
              false,
            );
          }}
        />

        <FilterModal
          visible={
            isFilterOpen
          }
          values={
            draftFilters
          }
          onChange={(
            key,
            value,
          ) =>
            setDraftFilters(
              (current) => ({
                ...current,
                [key]:
                  value,
              }),
            )
          }
          onReset={() =>
            setDraftFilters(
              INITIAL_FILTERS,
            )
          }
          onClose={() =>
            setIsFilterOpen(
              false,
            )
          }
          onApply={() => {
            setFilters(
              draftFilters,
            );

            setIsFilterOpen(
              false,
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function SessionHeader({
  isSearchOpen,
  keyword,
  onKeywordChange,
  onSearch,
  onMessages,
}: {
  isSearchOpen: boolean;
  keyword: string;
  onKeywordChange: (
    value: string,
  ) => void;
  onSearch: () => void;
  onMessages: () => void;
}) {
  return (
    <>
      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.headerTitle
          }
        >
          세션
        </Text>

        <View
          style={
            styles.headerActions
          }
        >
          <Pressable
            hitSlop={8}
            style={
              styles.headerIcon
            }
            onPress={
              onSearch
            }
          >
            {isSearchOpen ? (
              <X
                size={23}
                color={
                  colors.neutral900
                }
              />
            ) : (
              <SearchIcon />
            )}
          </Pressable>

          <Pressable
            hitSlop={8}
            style={
              styles.headerIcon
            }
            onPress={
              onMessages
            }
          >
            <AirplaneIcon />
          </Pressable>
        </View>
      </View>

      {isSearchOpen ? (
        <View
          style={
            styles.searchArea
          }
        >
          <TextInput
            autoFocus
            value={keyword}
            placeholder="밴드명, 모집 제목으로 검색"
            placeholderTextColor={
              colors.neutral500
            }
            style={
              styles.searchInput
            }
            onChangeText={
              onKeywordChange
            }
          />
        </View>
      ) : null}
    </>
  );
}

function RecruitmentCard({
  item,
}: {
  item: SessionRecruitmentListItem;
}) {
  const addMutation =
    useAddSessionRecruitmentInterest();

  const removeMutation =
    useRemoveSessionRecruitmentInterest();

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending;

  const handleBookmark =
    async () => {
      if (isPending) {
        return;
      }

      try {
        if (
          item.isInterested
        ) {
          await removeMutation.mutateAsync(
            item.sessionRecruitmentId,
          );

          return;
        }

        await addMutation.mutateAsync(
          item.sessionRecruitmentId,
        );
      } catch {
        Alert.alert(
          "관심 공고",
          "관심 상태를 변경하지 못했어요.",
        );
      }
    };

  return (
    <Pressable
      style={
        styles.card
      }
      onPress={() =>
        router.push(
          `/band/session/recruitments/${item.sessionRecruitmentId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    >
      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={
            styles.deadline
          }
        >
          <Text
            style={
              styles.deadlineText
            }
          >
            {getDeadlineLabel(
              item.dDay,
            )}
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          disabled={
            isPending
          }
          style={
            styles.starButton
          }
          onPress={(
            event,
          ) => {
            event.stopPropagation();

            void handleBookmark();
          }}
        >
          <Star
            size={24}
            color={
              item.isInterested
                ? colors.secondary500
                : colors.neutral900
            }
            fill={
              item.isInterested
                ? colors.secondary500
                : "transparent"
            }
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <Text
        numberOfLines={1}
        style={
          styles.cardTitle
        }
      >
        {
          item.recruitmentTitle
        }
      </Text>

      <View
        style={
          styles.metaRow
        }
      >
        <Text
          numberOfLines={1}
          style={
            styles.metaText
          }
        >
          {[
            item.bandName,
            item.bandGenre,
            item.bandRegion,
          ].join(" · ")}
        </Text>

        <View
          style={
            styles.metaDivider
          }
        />

        <Text
          style={
            styles.postedAgo
          }
        >
          {getPostedAgoLabel(
            item.postedAgo,
          )}
        </Text>
      </View>

      <Text
        numberOfLines={2}
        style={
          styles.description
        }
      >
        {item.summary}
      </Text>

      <Text
        style={
          styles.tags
        }
      >
        {[
          item.part,
          item.skillLevel,
        ].join(" · ")}
      </Text>
    </Pressable>
  );
}

function StateCard({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.stateCard
      }
    >
      <Text
        style={
          styles.stateText
        }
      >
        {text}
      </Text>

      {children ? (
        <View
          style={{
            marginTop: 12,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

function SortModal({
  visible,
  sort,
  onSelect,
  onClose,
}: {
  visible: boolean;
  sort: SessionRecruitmentSort;
  onSelect: (
    value: SessionRecruitmentSort,
  ) => void;
  onClose: () => void;
}) {
  const options: {
    label: string;
    value: SessionRecruitmentSort;
  }[] = [
    {
      label: "최신순",
      value: "LATEST",
    },
    {
      label: "마감일순",
      value: "IMMINENT",
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={
        onClose
      }
    >
      <Pressable
        style={
          styles.modalBackdrop
        }
        onPress={
          onClose
        }
      >
        <Pressable
          style={
            styles.sortSheet
          }
          onPress={() => {
            // sheet 내부 터치 전파 방지
          }}
        >
          {options.map(
            (option) => {
              const selected =
                sort ===
                option.value;

              return (
                <Pressable
                  key={
                    option.value
                  }
                  style={
                    styles.sortOption
                  }
                  onPress={() =>
                    onSelect(
                      option.value,
                    )
                  }
                >
                  <Text
                    style={[
                      styles
                        .sortOptionText,
                      selected &&
                        styles
                          .sortOptionTextSelected,
                    ]}
                  >
                    {
                      option.label
                    }
                  </Text>

                  {selected ? (
                    <Check
                      size={24}
                      color={
                        colors.secondary500
                      }
                      strokeWidth={
                        2.5
                      }
                    />
                  ) : null}
                </Pressable>
              );
            },
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FilterModal({
  visible,
  values,
  onChange,
  onReset,
  onApply,
  onClose,
}: {
  visible: boolean;
  values: FilterValues;
  onChange: (
    key: FilterKey,
    value: string,
  ) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.modalBackdrop
        }
      >
        <View
          style={
            styles.filterSheet
          }
        >
          <View
            style={
              styles.filterSheetHeader
            }
          >
            <Text
              style={
                styles.filterSheetTitle
              }
            >
              필터
            </Text>

            <Pressable
              hitSlop={8}
              onPress={
                onClose
              }
            >
              <X
                size={24}
                color={
                  colors.neutral900
                }
              />
            </Pressable>
          </View>

          <FlatList
            data={
              FILTER_GROUPS
            }
            keyExtractor={(
              item,
            ) => item.id}
            contentContainerStyle={
              styles.filterSheetContent
            }
            renderItem={({
              item,
            }) => (
              <View
                style={
                  styles.filterGroup
                }
              >
                <Text
                  style={
                    styles.filterGroupTitle
                  }
                >
                  {
                    item.title
                  }
                </Text>

                <View
                  style={
                    styles.filterOptions
                  }
                >
                  {item.options.map(
                    (
                      option,
                    ) => {
                      const selected =
                        values[
                          item.id
                        ] ===
                        option;

                      return (
                        <Pressable
                          key={
                            option
                          }
                          style={[
                            styles.filterOption,
                            selected &&
                              styles.filterOptionSelected,
                          ]}
                          onPress={() =>
                            onChange(
                              item.id,
                              option,
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              selected &&
                                styles.filterOptionTextSelected,
                            ]}
                          >
                            {
                              option
                            }
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              </View>
            )}
          />

          <View
            style={
              styles.filterFooter
            }
          >
            <Pressable
              style={
                styles.resetButton
              }
              onPress={
                onReset
              }
            >
              <Text
                style={
                  styles.resetText
                }
              >
                초기화
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.applyButton
              }
              onPress={
                onApply
              }
            >
              <Text
                style={
                  styles.applyText
                }
              >
                적용하기
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SearchIcon() {
  return (
    <Svg
      width={23}
      height={23}
      viewBox="0 0 21 20"
      fill="none"
    >
      <Path
        d="m19.73 18.31-3.71-3.68a9 9 0 1 0-1.39 1.39l3.68 3.68a1.002 1.002 0 0 0 1.42 0 1 1 0 0 0 0-1.39ZM9.02 16.02a7 7 0 1 1 0-13.999 7 7 0 0 1 0 14Z"
        fill={colors.neutral900}
      />
    </Svg>
  );
}

function AirplaneIcon() {
  return (
    <Svg
      width={23}
      height={23}
      viewBox="6 9 20 20"
      fill="none"
    >
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
    <Svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
    >
      <Path
        d="M14.502 18.333h4.748a.916.916 0 1 0 0-1.833h-4.748a2.75 2.75 0 0 0-5.17 0H2.75a.917.917 0 0 0 0 1.833h6.582a2.75 2.75 0 0 0 5.17 0ZM11 17.416a.917.917 0 1 1 1.834 0 .917.917 0 0 1-1.834 0Zm-1.998-5.5H19.25a.917.917 0 0 0 0-1.833H9.002a2.75 2.75 0 0 0-5.17 0H2.75a.917.917 0 0 0 0 1.833h1.082a2.75 2.75 0 0 0 5.17 0ZM5.5 11a.917.917 0 1 1 1.834 0A.917.917 0 0 1 5.5 11Zm10.835-5.5h2.915a.917.917 0 0 0 0-1.834h-2.915a2.75 2.75 0 0 0-5.17 0H2.75a.917.917 0 0 0 0 1.834h8.415a2.75 2.75 0 0 0 5.17 0Zm-3.502-.917a.917.917 0 1 1 1.834 0 .917.917 0 0 1-1.834 0Z"
        fill={colors.neutral900}
      />
    </Svg>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.white,
    },

    container: {
      flex: 1,
      backgroundColor:
        colors.white,
    },

    header: {
      height: 48,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.white,
    },

    headerTitle: {
      color: "#1D1A1A",
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 20,
    },

    headerActions: {
      position:
        "absolute",
      right: 24,
      top: 8,
      height: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },

    headerIcon: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent:
        "center",
    },

    searchArea: {
      paddingHorizontal: 22,
      paddingBottom: 8,
    },

    searchInput: {
      height: 42,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 12,
      paddingHorizontal: 14,
      color:
        colors.neutral900,
      fontSize: 14,
    },

    tabs: {
      height: 48,
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor:
        colors.neutral300,
      backgroundColor:
        colors.white,
    },

    tab: {
      flex: 1,
      height: 48,
      alignItems: "center",
      justifyContent:
        "center",
    },

    tabText: {
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 20,
    },

    tabTextActive: {
      color:
        colors.neutral900,
    },

    tabTextInactive: {
      color:
        colors.neutral400,
    },

    tabIndicator: {
      position:
        "absolute",
      bottom: -2,
      width: 114,
      maxWidth: "100%",
      height: 2,
      backgroundColor:
        colors.secondary500,
    },

    filterBar: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 22,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.neutral400,
      backgroundColor:
        colors.white,
    },

    sortButton: {
      height: 22,
      minWidth: 62,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 4,
      borderWidth: 1,
      borderColor:
        colors.neutral400,
      borderRadius: 999,
      paddingHorizontal: 8,
    },

    filterText: {
      color:
        colors.neutral600,
      fontSize: 11,
      fontWeight: "500",
    },

    filterDivider: {
      width: 1,
      height: 26,
      backgroundColor:
        colors.neutral300,
      marginHorizontal: 8,
    },

    filterPills: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    filterPill: {
      width: 49,
      height: 22,
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        colors.neutral400,
      borderRadius: 999,
      backgroundColor:
        colors.white,
    },

    filterPillSelected: {
      borderColor:
        colors.secondary400,
      backgroundColor:
        colors.secondary0,
    },

    filterPillText: {
      color:
        colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
    },

    filterPillTextSelected: {
      color:
        colors.secondary500,
    },

    filterIcon: {
      width: 22,
      height: 22,
      marginLeft: 8,
      alignItems: "center",
      justifyContent:
        "center",
    },

    listArea: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 20,
    },

    listContent: {
      gap: 16,
      paddingBottom: 100,
    },

    stateCard: {
      minHeight: 220,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 24,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.08,
      shadowRadius: 12,

      elevation: 3,
    },

    stateText: {
      color:
        colors.neutral500,
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
    },

    retryButton: {
      minHeight: 36,
      borderRadius: 8,
      backgroundColor:
        colors.secondary500,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent:
        "center",
    },

    retryText: {
      color:
        colors.white,
      fontSize: 12,
      fontWeight: "600",
    },

    card: {
      minHeight: 184,
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 24,
      paddingVertical: 18,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.08,
      shadowRadius: 12,

      elevation: 3,
    },

    cardTop: {
      height: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    deadline: {
      minHeight: 22,
      borderRadius: 999,
      backgroundColor:
        colors.secondary500,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent:
        "center",
    },

    deadlineText: {
      color:
        colors.white,
      fontSize: 11,
      fontWeight: "500",
    },

    starButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent:
        "center",
    },

    cardTitle: {
      marginTop: 14,
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 22,
    },

    metaRow: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    metaText: {
      flexShrink: 1,
      color:
        colors.neutral600,
      fontSize: 11,
      fontWeight: "500",
    },

    metaDivider: {
      width: 1,
      height: 16,
      backgroundColor:
        colors.neutral300,
    },

    postedAgo: {
      flexShrink: 0,
      color:
        colors.secondary500,
      fontSize: 11,
      fontWeight: "500",
    },

    description: {
      maxWidth: 300,
      marginTop: 8,
      color:
        colors.neutral800,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 22,
    },

    tags: {
      marginTop: 4,
      color:
        colors.secondary500,
      fontSize: 11,
      fontWeight: "500",
    },

    floatingButton: {
      position:
        "absolute",
      right: 24,
      bottom: 30,
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.secondary500,

      shadowColor:
        colors.secondary500,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.35,
      shadowRadius: 20,

      elevation: 10,
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(0, 0, 0, 0.45)",
    },

    sortSheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor:
        colors.white,
      paddingHorizontal: 56,
      paddingTop: 38,
      paddingBottom: 70,
      gap: 30,
    },

    sortOption: {
      height: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    sortOptionText: {
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "700",
    },

    sortOptionTextSelected: {
      color:
        colors.secondary500,
    },

    filterSheet: {
      maxHeight: "85%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor:
        colors.white,
    },

    filterSheetHeader: {
      height: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.neutral200,
    },

    filterSheetTitle: {
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "700",
    },

    filterSheetContent: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      gap: 24,
    },

    filterGroup: {
      gap: 12,
    },

    filterGroupTitle: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
    },

    filterOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    filterOption: {
      minHeight: 34,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 999,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent:
        "center",
    },

    filterOptionSelected: {
      borderColor:
        colors.secondary500,
      backgroundColor:
        colors.secondary0,
    },

    filterOptionText: {
      color:
        colors.neutral600,
      fontSize: 13,
      fontWeight: "500",
    },

    filterOptionTextSelected: {
      color:
        colors.secondary500,
      fontWeight: "700",
    },

    filterFooter: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor:
        colors.neutral200,
    },

    resetButton: {
      width: 90,
      height: 52,
      borderWidth: 1,
      borderColor:
        colors.neutral400,
      borderRadius: 12,
      alignItems: "center",
      justifyContent:
        "center",
    },

    resetText: {
      color:
        colors.neutral700,
      fontSize: 15,
      fontWeight: "700",
    },

    applyButton: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      backgroundColor:
        colors.secondary500,
      alignItems: "center",
      justifyContent:
        "center",
    },

    applyText: {
      color:
        colors.white,
      fontSize: 15,
      fontWeight: "700",
    },
  });