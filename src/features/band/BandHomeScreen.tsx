import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Path,
} from "react-native-svg";

import {
  BSceneLogo,
} from "@/features/onboarding/BSceneBrandAssets";
import {
  useBandMusicLinksQuery,
  useBandPerformancesQuery,
  useBandPostsQuery,
  useBandQuery,
  useDeleteBandPerformance,
  useDeleteBandPost,
} from "@/hooks/api/band/useBand";
import {
  useActiveBandId,
} from "@/hooks/api/user/useMyProfiles";
import {
  AppState,
} from "@/shared/components/AppState";
import {
  ModeSwitchSheet,
} from "@/features/my/ModeSwitchSheet";
import {
  isBandNotification,
} from "@/features/band/notificationActions";
import {
  useNotificationsInfiniteQuery,
} from "@/hooks/api/notification/useNotification";
import {
  AppIcon,
} from "@/shared/components/AppIcon";
import {
  ConfirmModal,
} from "@/shared/components/ConfirmModal";
import {
  ProfileImage,
} from "@/shared/components/ProfileImage";
import {
  getGenreLabel,
  getRegionLabel,
} from "@/shared/constants/bandLabels";
import {
  colors,
  shadows,
  textStyles,
} from "@/shared/constants/theme";
import type {
  MusicLinksResponse,
} from "@/types/band/musicLink";
import type {
  PerformanceListItem,
} from "@/types/band/performance";
import type {
  PostListItem,
} from "@/types/band/post";

type BandHomeTab =
  | "content"
  | "schedule"
  | "music";

const HOME_TABS: {
  id: BandHomeTab;
  label: string;
}[] = [
  {
    id: "content",
    label: "콘텐츠",
  },
  {
    id: "schedule",
    label: "일정",
  },
  {
    id: "music",
    label: "음원",
  },
];

const ETC_PLATFORM_LABELS: Record<string, string> = {
  MELON: "Melon",
  GENIE: "genie",
  BUGS: "Bugs",
  APPLE_MUSIC: "Apple Music",
};

const MONTH_ABBREVIATIONS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const formatRelativeCreatedAt = (
  value: string,
) => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  const diffMinutes =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          date.getTime()
        ) /
          60_000,
      ),
    );

  if (
    diffMinutes < 1
  ) {
    return "방금 전";
  }

  if (
    diffMinutes < 60
  ) {
    return `${diffMinutes}분 전`;
  }

  const diffHours =
    Math.floor(
      diffMinutes / 60,
    );

  if (
    diffHours < 24
  ) {
    return `${diffHours}시간 전`;
  }

  const diffDays =
    Math.floor(
      diffHours / 24,
    );

  return `${diffDays}일 전`;
};

const getPerformanceDate =
  (
    performance:
      PerformanceListItem,
  ) => {
    const [
      ,
      month,
      day,
    ] =
      performance.performanceDate.split(
        "-",
      );

    return {
      month:
        MONTH_ABBREVIATIONS[
          Number(month) - 1
        ] ?? "",

      day:
        day ?? "",

      fullDate:
        `${performance.performanceDate.replaceAll(
          "-",
          ".",
        )}.`,
    };
  };

export function BandHomeScreen() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<BandHomeTab>(
      "content",
    );

  const [
    isModeSwitchOpen,
    setIsModeSwitchOpen,
  ] =
    useState(false);

  const notificationsQuery =
    useNotificationsInfiniteQuery();

  const hasUnreadNotification =
    (
      notificationsQuery.data?.pages.flatMap(
        (page) =>
          page.items,
      ) ?? []
    )
      .filter(
        isBandNotification,
      )
      .some(
        (notification) =>
          !notification.isRead,
      );

  const activeBandQuery =
    useActiveBandId();

  const bandId =
    activeBandQuery.activeBandId;

  const bandQuery =
    useBandQuery(
      bandId,
    );

  const postsQuery =
    useBandPostsQuery(
      bandId,
    );

  const performancesQuery =
    useBandPerformancesQuery(
      bandId,
    );

  const musicLinksQuery =
    useBandMusicLinksQuery(
      bandId,
    );

  const band =
    bandQuery.data;

  const posts =
    postsQuery.data
      ?.posts ?? [];

  const performances =
    performancesQuery.data
      ?.performances ?? [];

  const isLoading =
    activeBandQuery.isLoading ||
    (
      Boolean(bandId) &&
      bandQuery.isLoading
    );

  const isError =
    activeBandQuery.isError ||
    bandQuery.isError;

  const retry = () => {
    void activeBandQuery.refetch();

    if (bandId) {
      void bandQuery.refetch();
      void postsQuery.refetch();
      void performancesQuery.refetch();
      void musicLinksQuery.refetch();
    }
  };

  const openContentCreate =
    () => {
      router.push(
        "/band/home/contents/form" as Parameters<
          typeof router.push
        >[0],
      );
    };

  const openScheduleCreate =
    () => {
      router.push(
        "/band/home/concerts/form" as Parameters<
          typeof router.push
        >[0],
      );
    };

  const openMusicCreate =
    () => {
      Alert.alert(
        "음원 등록",
        "음원 등록 화면은 이후 원본 디자인 이식 단계에서 연결할게요.",
      );
    };

  return (
    <SafeAreaView
      edges={["top"]}
      style={
        styles.safeArea
      }
    >
      <HomeHeader
        hasUnreadNotification={
          hasUnreadNotification
        }
        onModeSwitch={() =>
          setIsModeSwitchOpen(true)
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {isLoading ? (
          <AppState
            loading
            title="밴드 정보를 불러오는 중이에요"
          />
        ) : isError ? (
          <AppState
            title="밴드 정보를 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={
              retry
            }
          />
        ) : bandId &&
          band ? (
          <>
            <BandProfileSection
              name={
                band.name
              }
              imageUrl={
                band.profileImageUrl
              }
              genre={
                band.genre
              }
              region={
                band.region
              }
              memberCount={
                band.memberCount
              }
            />

            <StatRow
              followerCount={
                band.followerCount
              }
              performanceCount={
                band.performanceCount
              }
              contentCount={
                posts.length
              }
            />

            <View
              style={
                styles.registrationButtons
              }
            >
              <RegistrationButton
                label="콘텐츠 등록"
                onPress={
                  openContentCreate
                }
              />

              <RegistrationButton
                label="일정 등록"
                onPress={
                  openScheduleCreate
                }
              />

              <RegistrationButton
                label="음원 등록"
                onPress={
                  openMusicCreate
                }
              />
            </View>

            <BandHomeTabs
              activeTab={
                activeTab
              }
              onChange={
                setActiveTab
              }
            />

            <View
              style={
                styles.tabContent
              }
            >
              {activeTab ===
              "content" ? (
                <ContentSection
                  bandId={
                    bandId
                  }
                  bandName={
                    band.name
                  }
                  bandImageUrl={
                    band.profileImageUrl
                  }
                  genre={
                    band.genre
                  }
                  region={
                    band.region
                  }
                  posts={
                    posts
                  }
                  isLoading={
                    postsQuery.isLoading
                  }
                  isError={
                    postsQuery.isError
                  }
                  onRetry={() =>
                    void postsQuery.refetch()
                  }
                  onCreate={
                    openContentCreate
                  }
                />
              ) : null}

              {activeTab ===
              "schedule" ? (
                <ScheduleSection
                  bandId={
                    bandId
                  }
                  performances={
                    performances
                  }
                  isLoading={
                    performancesQuery.isLoading
                  }
                  isError={
                    performancesQuery.isError
                  }
                  onRetry={() =>
                    void performancesQuery.refetch()
                  }
                  onCreate={
                    openScheduleCreate
                  }
                />
              ) : null}

              {activeTab ===
              "music" ? (
                <MusicSection
                  musicLinks={
                    musicLinksQuery.data
                  }
                  isLoading={
                    musicLinksQuery.isLoading
                  }
                  isError={
                    musicLinksQuery.isError
                  }
                  onRetry={() =>
                    void musicLinksQuery.refetch()
                  }
                  onCreate={
                    openMusicCreate
                  }
                />
              ) : null}
            </View>
          </>
        ) : (
          <NoBandState
            activeTab={
              activeTab
            }
            onTabChange={
              setActiveTab
            }
          />
        )}
      </ScrollView>

      <ModeSwitchSheet
        open={
          isModeSwitchOpen
        }
        onClose={() =>
          setIsModeSwitchOpen(
            false,
          )
        }
      />
    </SafeAreaView>
  );
}

function HomeHeader({
  hasUnreadNotification,
  onModeSwitch,
}: {
  hasUnreadNotification:
    boolean;
  onModeSwitch:
    () => void;
}) {
  return (
    <View
      style={
        styles.header
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="모드 전환"
        hitSlop={12}
        style={
          styles.headerIconButton
        }
        onPress={
          onModeSwitch
        }
      >
        <SwapIcon />
      </Pressable>

      <View
        pointerEvents="none"
        style={
          styles.headerLogo
        }
      >
        <BSceneLogo
          width={105}
          height={20}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="알림"
        hitSlop={12}
        style={
          styles.headerIconButton
        }
        onPress={() => router.push("/band/notifications" as Parameters<typeof router.push>[0])}
      >
        <NotificationBellIcon
          hasUnread={
            hasUnreadNotification
          }
        />
      </Pressable>
    </View>
  );
}

function BandProfileSection({
  name,
  imageUrl,
  genre,
  region,
  memberCount,
}: {
  name: string;
  imageUrl:
    | string
    | null;
  genre: string;
  region: string;
  memberCount: number;
}) {
  return (
    <View
      style={
        styles.profileSection
      }
    >
      <View
        style={
          styles.profileLeft
        }
      >
        <ProfileImage
          imageUrl={
            imageUrl
          }
          size={72}
          variant="band"
        />

        <View
          style={
            styles.profileText
          }
        >
          <Text
            numberOfLines={1}
            style={
              styles.bandName
            }
          >
            {name}
          </Text>

          <Text
            numberOfLines={1}
            style={
              styles.bandSubtitle
            }
          >
            {getGenreLabel(genre)}
            {" · "}
            {getRegionLabel(region)}
            {" · "}
            멤버{" "}
            {memberCount}명
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={
          styles.profileEditButton
        }
        onPress={() =>
          router.push(
            "/band/my/profile/edit" as Parameters<
              typeof router.push
            >[0],
          )
        }
      >
        <Text
          style={
            styles.profileEditText
          }
        >
          프로필 편집
        </Text>
      </Pressable>
    </View>
  );
}

function StatRow({
  followerCount,
  performanceCount,
  contentCount,
}: {
  followerCount: number;
  performanceCount: number;
  contentCount: number;
}) {
  const { width } =
    useWindowDimensions();

  const dividerStyle = {
    marginHorizontal:
      Math.min(
        38,
        Math.max(
          16,
          width * 0.04,
        ),
      ),
  };

  return (
    <View
      style={[
        styles.statsCard,

        {
          paddingHorizontal:
            Math.min(
              40,
              Math.max(
                16,
                width * 0.06,
              ),
            ),
        },
      ]}
    >
      <Pressable
        style={
          styles.statItem
        }
        onPress={() =>
          router.push(
            "/band/my/followers" as Parameters<
              typeof router.push
            >[0],
          )
        }
      >
        <Text
          style={
            styles.statValue
          }
        >
          {followerCount}
        </Text>

        <Text
          style={
            styles.statLabel
          }
        >
          팔로워
        </Text>
      </Pressable>

      <View
        style={[
          styles.statDivider,
          dividerStyle,
        ]}
      />

      <View
        style={
          styles.statItem
        }
      >
        <Text
          style={
            styles.statValue
          }
        >
          {performanceCount}
        </Text>

        <Text
          style={
            styles.statLabel
          }
        >
          공연
        </Text>
      </View>

      <View
        style={[
          styles.statDivider,
          dividerStyle,
        ]}
      />

      <View
        style={
          styles.statItem
        }
      >
        <Text
          style={
            styles.statValue
          }
        >
          {contentCount}
        </Text>

        <Text
          style={
            styles.statLabel
          }
        >
          콘텐츠
        </Text>
      </View>
    </View>
  );
}

function RegistrationButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({
        pressed,
      }) => [
        styles.registrationButton,

        pressed &&
          styles.pressed,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={
          styles.registrationButtonText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function BandHomeTabs({
  activeTab,
  onChange,
}: {
  activeTab:
    BandHomeTab;
  onChange:
    (
      tab:
        BandHomeTab,
    ) => void;
}) {
  return (
    <View
      style={
        styles.tabsWrapper
      }
    >
      {HOME_TABS.map(
        (tab) => {
          const isActive =
            activeTab ===
            tab.id;

          return (
            <Pressable
              key={
                tab.id
              }
              accessibilityRole="tab"
              accessibilityState={{
                selected:
                  isActive,
              }}
              style={
                styles.tab
              }
              onPress={() =>
                onChange(
                  tab.id,
                )
              }
            >
              <Text
                style={[
                  styles.tabText,

                  isActive
                    ? styles.activeTabText
                    : styles.inactiveTabText,
                ]}
              >
                {
                  tab.label
                }
              </Text>

              {isActive ? (
                <View
                  style={
                    styles.activeIndicator
                  }
                />
              ) : null}
            </Pressable>
          );
        },
      )}

      <View
        style={
          styles.tabsBottomLine
        }
      />
    </View>
  );
}

function ContentSection({
  bandId,
  bandName,
  bandImageUrl,
  genre,
  region,
  posts,
  isLoading,
  isError,
  onRetry,
  onCreate,
}: {
  bandId: number;
  bandName: string;
  bandImageUrl:
    | string
    | null;
  genre: string;
  region: string;
  posts:
    PostListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry:
    () => void;
  onCreate:
    () => void;
}) {
  const deleteMutation =
    useDeleteBandPost(
      bandId,
    );

  const [
    deleteTargetId,
    setDeleteTargetId,
  ] =
    useState<number | null>(
      null,
    );

  if (isLoading) {
    return (
      <AppState
        loading
        title="콘텐츠를 불러오는 중이에요"
      />
    );
  }

  if (isError) {
    return (
      <AppState
        title="콘텐츠를 불러오지 못했어요"
        actionLabel="다시 시도"
        onAction={
          onRetry
        }
      />
    );
  }

  if (
    posts.length === 0
  ) {
    return (
      <EmptyState
        title="등록된 콘텐츠가 없어요"
        description={
          "콘텐츠를 등록하면 팬들이\n소식을 받아볼 수 있어요"
        }
        actionLabel="등록하기"
        onAction={
          onCreate
        }
      />
    );
  }

  const deletePost = () => {
    if (
      deleteTargetId === null
    ) {
      return;
    }

    deleteMutation.mutate(
      deleteTargetId,
      {
        onError: () => {
          Alert.alert(
            "콘텐츠 삭제",
            "콘텐츠를 삭제하지 못했어요.",
          );
        },
      },
    );

    setDeleteTargetId(
      null,
    );
  };

  return (
    <View
      style={
        styles.sectionList
      }
    >
      {posts.map(
        (post) => (
          <View
            key={
              post.postId
            }
            style={
              styles.postCard
            }
          >
            <View
              style={
                styles.postHeader
              }
            >
              <Pressable
                style={
                  styles.postProfile
                }
                onPress={() =>
                  router.push(
                    `/band/home/contents/${post.postId}` as Parameters<
                      typeof router.push
                    >[0],
                  )
                }
              >
                <ProfileImage
                    imageUrl={
                      bandImageUrl
                    }
                    size={36}
                    variant="band"
                  />

                <View
                  style={
                    styles.postProfileText
                  }
                >
                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.postBandName
                    }
                  >
                    {
                      bandName
                    }
                  </Text>

                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.postMeta
                    }
                  >
                    {getGenreLabel(
                        genre,
                      )}
                      {" · "}
                      {getRegionLabel(
                        region,
                      )}
                      {" · "}
                      {formatRelativeCreatedAt(
                      post.createdAt,
                    )}
                  </Text>
                </View>
              </Pressable>

              <View
                style={
                  styles.postActions
                }
              >
                <SmallActionButton
                  label="수정"
                  tone="yellow"
                  onPress={() =>
                    router.push(
                      `/band/home/contents/form?postId=${post.postId}` as Parameters<
                        typeof router.push
                      >[0],
                    )
                  }
                />

                <SmallActionButton
                  label="삭제"
                  onPress={() =>
                    setDeleteTargetId(
                      post.postId,
                    )
                  }
                />
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  `/band/home/contents/${post.postId}` as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            >
              {post.thumbnailUrl ? (
                <View
                  style={
                    styles.postMediaWrapper
                  }
                >
                  <Image
                    source={{
                      uri:
                        post.thumbnailUrl,
                    }}
                    resizeMode="cover"
                    style={
                      styles.postMedia
                    }
                  />

                  {post.type ===
                  "VIDEO" ? (
                    <View
                      style={
                        styles.videoPlayButton
                      }
                    >
                      <AppIcon
                        name="homePlay"
                        size={36}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Text
                numberOfLines={
                  2
                }
                style={
                  styles.postCaption
                }
              >
                {post.description?.trim() ||
                  post.title ||
                  "팬분들께 전하고 싶은 소식을 적어보세요"}
              </Text>
            </Pressable>
          </View>
        ),
      )}

      <ConfirmModal
        open={
          deleteTargetId !== null
        }
        tone="orange"
        title="콘텐츠를 삭제할까요?"
        description="삭제된 콘텐츠는 복구할 수 없어요"
        confirmLabel="삭제"
        onCancel={() =>
          setDeleteTargetId(
            null,
          )
        }
        onConfirm={
          deletePost
        }
      />
    </View>
  );
}

function ScheduleSection({
  bandId,
  performances,
  isLoading,
  isError,
  onRetry,
  onCreate,
}: {
  bandId: number;
  performances:
    PerformanceListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry:
    () => void;
  onCreate:
    () => void;
}) {
  const deleteMutation =
    useDeleteBandPerformance(
      bandId,
    );

  const [
    deleteTargetId,
    setDeleteTargetId,
  ] =
    useState<number | null>(
      null,
    );

  if (isLoading) {
    return (
      <AppState
        loading
        title="공연 일정을 불러오는 중이에요"
      />
    );
  }

  if (isError) {
    return (
      <AppState
        title="공연 일정을 불러오지 못했어요"
        actionLabel="다시 시도"
        onAction={
          onRetry
        }
      />
    );
  }

  if (
    performances.length ===
    0
  ) {
    return (
      <EmptyState
        title="등록된 일정이 없어요"
        description={
          "공연 일정을 등록하면 팬들이\n소식을 받아볼 수 있어요"
        }
        actionLabel="등록하기"
        onAction={
          onCreate
        }
      />
    );
  }

  const deletePerformance = () => {
    if (
      deleteTargetId === null
    ) {
      return;
    }

    deleteMutation.mutate(
      deleteTargetId,
      {
        onError: () => {
          Alert.alert(
            "공연 삭제",
            "공연 일정을 삭제하지 못했어요.",
          );
        },
      },
    );

    setDeleteTargetId(
      null,
    );
  };

  return (
    <View
      style={
        styles.sectionList
      }
    >
      {performances.map(
        (
          performance,
        ) => {
          const date =
            getPerformanceDate(
              performance,
            );

          return (
            <Pressable
              key={
                performance.performanceId
              }
              style={
                styles.performanceCard
              }
              onPress={() =>
                router.push(
                  `/band/home/concerts/${performance.performanceId}` as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            >
              <View
                style={
                  styles.performanceMain
                }
              >
                {performance.posterImageUrl ? (
                  <Image
                    source={{
                      uri:
                        performance.posterImageUrl,
                    }}
                    resizeMode="cover"
                    style={
                      styles.performancePoster
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.dateBadge
                    }
                  >
                    <Text
                      style={
                        styles.dateMonth
                      }
                    >
                      {
                        date.month
                      }
                    </Text>

                    <Text
                      style={
                        styles.dateDay
                      }
                    >
                      {
                        date.day
                      }
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.performanceText
                  }
                >
                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.performanceTitle
                    }
                  >
                    {
                      performance.title
                    }
                  </Text>

                  <View
                    style={
                      styles.locationRow
                    }
                  >
                    <AppIcon
                        name="concertLocation"
                        size={14}
                      />

                    <Text
                      numberOfLines={
                        1
                      }
                      style={
                        styles.performanceLocation
                      }
                    >
                      {
                        performance.venue
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.performanceMetaRow
                    }
                  >
                    <Text
                      style={
                        styles.performanceDate
                      }
                    >
                      {
                        date.fullDate
                      }
                    </Text>

                    <Text
                      style={
                        styles.metaDivider
                      }
                    >
                      |
                    </Text>

                    <Text
                      style={
                        styles.performanceStatus
                      }
                    >
                      등록 완료
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={
                  styles.performanceActions
                }
              >
                <SmallActionButton
                  label="수정"
                  tone="yellow"
                  onPress={() =>
                    router.push(
                      `/band/home/concerts/form?performanceId=${performance.performanceId}` as Parameters<
                        typeof router.push
                      >[0],
                    )
                  }
                />

                <SmallActionButton
                  label="삭제"
                  onPress={() =>
                    setDeleteTargetId(
                      performance.performanceId,
                    )
                  }
                />
              </View>
            </Pressable>
          );
        },
      )}

      <ConfirmModal
        open={
          deleteTargetId !== null
        }
        tone="orange"
        title="공연을 삭제할까요?"
        description="삭제된 공연 정보는 복구할 수 없어요"
        confirmLabel="삭제"
        onCancel={() =>
          setDeleteTargetId(
            null,
          )
        }
        onConfirm={
          deletePerformance
        }
      />
    </View>
  );
}

function MusicSection({
  musicLinks,
  isLoading,
  isError,
  onRetry,
  onCreate,
}: {
  musicLinks?:
    MusicLinksResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry:
    () => void;
  onCreate:
    () => void;
}) {
  if (isLoading) {
    return (
      <AppState
        loading
        title="음원 링크를 불러오는 중이에요"
      />
    );
  }

  if (isError) {
    return (
      <AppState
        title="음원 링크를 불러오지 못했어요"
        actionLabel="다시 시도"
        onAction={
          onRetry
        }
      />
    );
  }

  const links = [
    {
      label:
        "Spotify",
      url:
        musicLinks?.spotifyUrl,
      icon: "spotify",
    },
    {
      label:
        "YouTube",
      url:
        musicLinks?.youtubeUrl,
      icon: "youtube",
    },
    {
      label:
        "SoundCloud",
      url:
        musicLinks?.soundcloudUrl,
      icon: "soundcloud",
    },
    {
      label:
        musicLinks?.etcPlatform
          ? (ETC_PLATFORM_LABELS[
              musicLinks.etcPlatform
            ] ??
            musicLinks.etcPlatform)
          : "기타",
      url:
        musicLinks?.etcUrl,
      icon: "other",
    },
    {
      label:
        "기타",
      url:
        musicLinks?.otherUrl,
      icon: "other",
    },
  ].filter(
    (
      item,
    ): item is {
        label: string;
        url: string;
        icon: string;
      } =>
      Boolean(item.url),
  );

  if (
    links.length === 0
  ) {
    return (
      <EmptyState
        title="등록된 음원이 없어요"
        description={
          "음원 링크를 등록하면 팬들이\n바로 들으러 갈 수 있어요"
        }
        actionLabel="등록하기"
        onAction={
          onCreate
        }
      />
    );
  }

  return (
    <View
      style={
        styles.musicSection
      }
    >
      <Text
        style={
          styles.musicDescription
        }
      >
        외부 음원 플랫폼에서
        이 밴드의 음악을
        들어보세요
      </Text>

      <View
        style={
          styles.musicList
        }
      >
        {links.map(
          (link) => (
            <Pressable
              key={`${link.label}-${link.url}`}
              style={
                styles.musicCard
              }
              onPress={() =>
                void Linking.openURL(
                  link.url,
                )
              }
            >
              <MusicLinkIcon
                    type={
                      link.icon
                    }
                  />

              <View
                style={
                  styles.musicText
                }
              >
                <Text
                  style={
                    styles.musicLabel
                  }
                >
                  {
                    link.label
                  }
                </Text>

                <Text
                  numberOfLines={
                    1
                  }
                  style={
                    styles.musicUrl
                  }
                >
                  {
                    link.url
                  }
                </Text>
              </View>

              <AppIcon
                  name="homeArrowRight"
                  width={8}
                  height={15}
                />
            </Pressable>
          ),
        )}

        <Pressable
          style={[
            styles.musicCard,
            styles.musicAddCard,
          ]}
          onPress={
            onCreate
          }
        >
          <View
            style={
              styles.musicAddIcon
            }
          >
            <AppIcon
                  name="musicPlus"
                  size={24}
                />
          </View>

          <View
            style={
              styles.musicText
            }
          >
            <Text
              style={
                styles.musicLabel
              }
            >
              기타 링크
            </Text>

            <Text
              style={
                styles.musicUrl
              }
            >
              멜론, 지니, 벅스,
              애플뮤직 등
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function MusicLinkIcon({
  type,
}: {
  type: string;
}) {
  if (type === "spotify") {
    return (
      <AppIcon
        name="spotify"
        size={35}
      />
    );
  }

  if (type === "soundcloud") {
    return (
      <AppIcon
        name="soundcloud"
        size={35}
      />
    );
  }

  if (type === "youtube") {
    return (
      <Image
        source={require("../../../assets/images/band/youtube.png")}
        style={
          styles.musicImage
        }
      />
    );
  }

  return (
    <View
      style={
        styles.musicAddIcon
      }
    >
      <AppIcon
        name="homeMusicNote"
        size={20}
      />
    </View>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction:
    () => void;
}) {
  return (
    <View
      style={
        styles.emptyState
      }
    >
      <Text
        style={
          styles.emptyTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.emptyDescription
        }
      >
        {description}
      </Text>

      <Pressable
        style={
          styles.emptyButton
        }
        onPress={
          onAction
        }
      >
        <Text
          style={
            styles.emptyButtonText
          }
        >
          {
            actionLabel
          }
        </Text>
      </Pressable>
    </View>
  );
}

function NoBandState({
  activeTab,
  onTabChange,
}: {
  activeTab:
    BandHomeTab;
  onTabChange:
    (
      tab:
        BandHomeTab,
    ) => void;
}) {
  const openBandCreate =
    () => {
      router.push(
        "/band/my/profile/new" as Parameters<
          typeof router.push
        >[0],
      );
    };

  return (
    <>
      <View
        style={
          styles.noBandProfile
        }
      >
        <ProfileImage
          size={72}
          variant="band"
        />

        <View
          style={
            styles.noBandText
          }
        >
          <Text
            style={
              styles.noBandTitle
            }
          >
            등록된 밴드가 없어요
          </Text>

          <Text
            style={
              styles.noBandDescription
            }
          >
            새로운 밴드를 등록하고
            {"\n"}
            팬들과 소통해보세요!
          </Text>
        </View>
      </View>

      <StatRow
        followerCount={0}
        performanceCount={0}
        contentCount={0}
      />

      <View
        style={
          styles.registrationButtons
        }
      >
        <RegistrationButton
          label="콘텐츠 등록"
          onPress={
            openBandCreate
          }
        />

        <RegistrationButton
          label="일정 등록"
          onPress={
            openBandCreate
          }
        />

        <RegistrationButton
          label="음원 등록"
          onPress={
            openBandCreate
          }
        />
      </View>

      <BandHomeTabs
        activeTab={
          activeTab
        }
        onChange={
          onTabChange
        }
      />

      <View
        style={
          styles.tabContent
        }
      >
        <EmptyState
          title="등록된 밴드가 없어요"
          description={
            "밴드를 등록하면 콘텐츠, 공연, 라이브 등\n다양한 활동을 관리할 수 있어요"
          }
          actionLabel="밴드 등록하기"
          onAction={
            openBandCreate
          }
        />
      </View>
    </>
  );
}

function SmallActionButton({
  label,
  tone = "gray",
  onPress,
}: {
  label: string;
  tone?:
    | "gray"
    | "yellow";
  onPress:
    () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.smallActionButton,

        tone ===
        "yellow"
          ? styles.smallActionYellow
          : styles.smallActionGray,
      ]}
      onPress={(
        event,
      ) => {
        event.stopPropagation();
        onPress();
      }}
    >
      <Text
        style={
          styles.smallActionText
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SwapIcon() {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M14.5 3V20L19.5 15M9.5 21V4L4.5 9"
        stroke={
          colors.neutral900
        }
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NotificationBellIcon({
  hasUnread,
}: {
  hasUnread: boolean;
}) {
  return (
    <Svg
      width={25}
      height={25}
      viewBox="0 0 25 25"
      fill="none"
    >
      <Path
        d="M6 20V11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11V20M6 20H18M6 20H4M18 20H20"
        stroke={
          colors.neutral900
        }
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M11 23L13 23"
        stroke={
          colors.neutral900
        }
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle
        cx={12}
        cy={4}
        r={1}
        stroke={
          colors.neutral900
        }
        strokeWidth={2}
      />
      {hasUnread ? (
        <Circle
          cx={23}
          cy={2}
          r={2}
          fill={colors.secondary400}
        />
      ) : null}
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

    header: {
      height: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 24,
      backgroundColor:
        colors.white,
    },

    headerIconButton: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },

    headerLogo: {
      position:
        "absolute",
      left: 0,
      right: 0,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 24,
    },

    profileSection: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    profileLeft: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    profileText: {
      flex: 1,
      gap: 5,
    },

    bandName: {
      ...textStyles.label1,
      color: colors.neutral900,
    },

    bandSubtitle: {
      ...textStyles.caption2,
      color: colors.neutral700,
    },

    profileEditButton: {
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    profileEditText: {
      ...textStyles.caption3,
      color: colors.neutral600,
    },

    statsCard: {
      ...shadows.card,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: colors.white,
    },

    statItem: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 4,
    },

    statValue: {
      ...textStyles.label1,
      color: colors.neutral900,
    },

    statLabel: {
      ...textStyles.body5,
      color: colors.neutral600,
    },

    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.neutral300,
    },

    registrationButtons: {
      flexDirection:
        "row",
      gap: 9,
      marginTop: 16,
    },

    registrationButton: {
      flex: 1,
      height: 38,
      borderRadius: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.secondary400,
      paddingHorizontal: 8,
    },

    registrationButtonText: {
      ...textStyles.body1,
      color: colors.white,
    },

    pressed: {
      opacity: 0.82,
    },

    tabsWrapper: {
      position:
        "relative",
      flexDirection:
        "row",
      marginHorizontal:
        -20,
      marginTop: 24,
      paddingHorizontal: 20,
    },

    tab: {
      flex: 1,
      position:
        "relative",
      alignItems:
        "center",
      paddingBottom: 10,
    },

    tabText: {
      ...textStyles.body1,
    },

    activeTabText: {
      color:
        colors.secondary500,
    },

    inactiveTabText: {
      color:
        colors.neutral400,
    },

    activeIndicator: {
      position:
        "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor:
        colors.secondary500,
      zIndex: 2,
    },

    tabsBottomLine: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor:
        colors.neutral400,
      zIndex: -1,
    },

    tabContent: {
      marginTop: 16,
    },

    sectionList: {
      gap: 12,
    },

    postCard: {
      ...shadows.card,
      gap: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.white,
    },

    postHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    postProfile: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    postProfileText: {
      flex: 1,
    },

    postBandName: {
      ...textStyles.caption3,
      color: colors.neutral900,
    },

    postMeta: {
      ...textStyles.caption2,
      color: colors.neutral700,
    },

    postActions: {
      flexDirection:
        "row",
      gap: 8,
    },

    smallActionButton: {
      height: 26,
      borderRadius: 8,
      paddingHorizontal: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    smallActionYellow: {
      backgroundColor:
        "#FFF6E5",
    },

    smallActionGray: {
      backgroundColor:
        colors.neutral300,
    },

    smallActionText: {
      ...textStyles.caption3,
      color: colors.neutral600,
    },

    postMediaWrapper: {
      position:
        "relative",
      width: 156,
      height: 92,
      alignSelf:
        "center",
      overflow:
        "hidden",
      backgroundColor:
        colors.neutral300,
    },

    postMedia: {
      width: "100%",
      height: "100%",
    },

    videoPlayButton: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 36,
      height: 36,
      marginLeft: -18,
      marginTop: -18,
    },


    postCaption: {
      ...textStyles.caption2,
      marginTop: 8,
      color: colors.neutral900,
    },

    performanceCard: {
      ...shadows.card,
      height: 86,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.white,
    },

    performanceMain: {
      flex: 1,
      minWidth: 0,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 16,
    },

    performancePoster: {
      width: 50,
      height: 62,
      borderRadius: 8,
      backgroundColor:
        colors.neutral300,
    },

    dateBadge: {
      width: 50,
      height: 62,
      flexShrink: 0,
      borderRadius: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.secondary300,
    },

    dateMonth: {
      color: "#FFFDFB",
      fontSize: 16,
      fontWeight: "500",
      lineHeight: 16,
    },

    dateDay: {
      marginTop: 4,
      color: "#FFFDFB",
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 24,
    },

    performanceText: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },

    performanceTitle: {
      ...textStyles.body1,
      color: colors.neutral900,
    },

    locationRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    performanceLocation: {
      ...textStyles.caption2,
      flex: 1,
      color: colors.neutral700,
    },

    performanceMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },

    performanceDate: {
      ...textStyles.body5,
      color: colors.neutral500,
    },

    metaDivider: {
      ...textStyles.body5,
      color: colors.neutral400,
    },

    performanceStatus: {
      ...textStyles.body5,
      color: colors.secondary500,
    },

    performanceActions: {
      alignItems:
        "center",
      gap: 8,
    },

    musicSection: {
      gap: 16,
    },

    musicDescription: {
      ...textStyles.caption2,
      color: colors.neutral600,
    },

    musicList: {
      gap: 12,
      paddingHorizontal: 10,
    },

    musicCard: {
      ...shadows.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 25,
      paddingVertical: 12,
      paddingLeft: 12,
      paddingRight: 15,
      borderRadius: 12,
      backgroundColor: colors.white,
    },

    musicImage: {
      width: 35,
      height: 35,
      borderRadius: 8,
    },

    musicAddCard: {
      backgroundColor:
        colors.neutral300,
    },



    musicAddIcon: {
      width: 35,
      height: 35,
      borderRadius: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.neutral400,
    },


    musicText: {
      flex: 1,
      minWidth: 0,
    },

    musicLabel: {
      ...textStyles.caption3,
      color: colors.neutral900,
    },

    musicUrl: {
      ...textStyles.caption2,
      color: colors.neutral600,
    },


    emptyState: {
      minHeight: 320,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    emptyTitle: {
      ...textStyles.label1,
      color: colors.neutral900,
      textAlign: "center",
    },

    emptyDescription: {
      ...textStyles.caption1,
      color: colors.neutral600,
      textAlign: "center",
    },

    emptyButton: {
      width: 110,
      height: 38,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary400,
    },

    emptyButtonText: {
      ...textStyles.body1,
      color: colors.white,
    },


    noBandProfile: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },



    noBandText: {
      gap: 8,
    },

    noBandTitle: {
      color: "#000000",
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 20,
    },

    noBandDescription: {
      ...textStyles.caption1,
      color: colors.neutral700,
    },
  });
