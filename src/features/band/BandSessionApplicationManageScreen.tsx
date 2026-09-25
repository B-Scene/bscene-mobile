import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import {
    Alert,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

import {
    useDeleteSessionApplicationMutation,
    useMySessionApplicationSummaryQuery,
    useUpdateSessionApplicationVisibilityMutation,
} from "@/hooks/api/session/useSessionApplication";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import {
    colors,
    spacing,
} from "@/shared/constants/theme";
import type {
    SessionApplicationSummaryItem,
} from "@/types/session/sessionApplication";

const isDefaultApplication = (
  application: SessionApplicationSummaryItem,
) => {
  const purpose =
    application.purpose
      .trim()
      .toUpperCase();

  const title =
    application.title
      .trim()
      .toUpperCase();

  return (
    purpose === "기본" ||
    purpose === "DEFAULT" ||
    purpose === "BASIC" ||
    title === "기본" ||
    title === "DEFAULT" ||
    title === "BASIC"
  );
};

const formatDisplayDate = (
  value: string,
) => {
  if (!value) {
    return "";
  }

  if (
    value.includes("작성") ||
    value.includes("수정")
  ) {
    return value;
  }

  if (value.includes("T")) {
    return `${value.slice(
      0,
      10,
    )} 작성`;
  }

  return value;
};

export function BandSessionApplicationManageScreen() {
  const query =
    useMySessionApplicationSummaryQuery();

  const deleteMutation =
    useDeleteSessionApplicationMutation();

  const visibilityMutation =
    useUpdateSessionApplicationVisibilityMutation();

  const summary = query.data;

  const applications =
    summary?.applications ?? [];

  const createApplication =
    () => {
      router.push(
        "/band/session/applications/form" as Parameters<
          typeof router.push
        >[0],
      );
    };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title="지원서 관리"
        rightContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지원서 추가"
            hitSlop={12}
            style={
              styles.headerButton
            }
            onPress={
              createApplication
            }
          >
            <Plus
              size={22}
              color={
                colors.neutral900
              }
            />
          </Pressable>
        }
      />

      {query.isLoading ? (
        <AppState
          loading
          title="내 지원서를 불러오는 중이에요"
        />
      ) : query.isError ? (
        <AppState
          title="내 지원서를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() =>
            void query.refetch()
          }
        />
      ) : (
        <>
          <ProfileSummary
            nickname={
              summary?.nickname ??
              "닉네임 없음"
            }
            profileImageUrl={
              summary?.profileImageUrl ??
              null
            }
            part={
              summary?.part
            }
            skillLevel={
              summary?.skillLevel
            }
            genre={
              summary?.genre
            }
            region={
              summary?.region
            }
            applicationCount={
              summary?.applicationCount ??
              0
            }
            submissionCount={
              summary?.submissionCount ??
              0
            }
            inProgressCount={
              summary?.inProgressCount ??
              0
            }
          />

          <View
            style={
              styles.sectionHeader
            }
          >
            <View
              style={
                styles.sectionHeaderText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                지원서
              </Text>

              <Text
                style={
                  styles.description
                }
              >
                세션 모집에 지원할
                때 사용할 소개서를
                관리해요.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={
                createApplication
              }
              style={
                styles.addTextButton
              }
            >
              <Text
                style={
                  styles.addText
                }
              >
                + 지원서 추가
              </Text>
            </Pressable>
          </View>

          {applications.length ===
          0 ? (
            <AppState
              title="등록된 지원서가 없어요"
              description="모집 공고에 바로 지원할 수 있도록 지원서를 먼저 만들어 보세요."
              actionLabel="지원서 작성"
              onAction={
                createApplication
              }
            />
          ) : (
            <View
              style={
                styles.applicationList
              }
            >
              {applications.map(
                (application) => (
                  <ApplicationCard
                    key={
                      application.sessionApplicationId
                    }
                    application={
                      application
                    }
                    deleting={
                      deleteMutation.isPending
                    }
                    visibilityPending={
                      visibilityMutation.isPending
                    }
                    onDelete={() => {
                      Alert.alert(
                        "지원서 삭제",
                        `"${application.title}" 지원서를 삭제할까요?`,
                        [
                          {
                            text: "취소",
                            style: "cancel",
                          },

                          {
                            text: "삭제",
                            style:
                              "destructive",

                            onPress:
                              () => {
                                void (async () => {
                                  try {
                                    await deleteMutation.mutateAsync(
                                      application.sessionApplicationId,
                                    );
                                  } catch {
                                    Alert.alert(
                                      "지원서 삭제",
                                      "지원서를 삭제하지 못했어요.",
                                    );
                                  }
                                })();
                              },
                          },
                        ],
                      );
                    }}
                    onToggleVisibility={(
                      nextValue,
                    ) => {
                      void (async () => {
                        try {
                          await visibilityMutation.mutateAsync(
                            {
                              sessionApplicationId:
                                application.sessionApplicationId,

                              body: {
                                isPublic:
                                  nextValue,
                              },
                            },
                          );
                        } catch {
                          Alert.alert(
                            "지원서 공개 설정",
                            "공개 상태를 변경하지 못했어요.",
                          );
                        }
                      })();
                    }}
                  />
                ),
              )}
            </View>
          )}

          <AppButton
            label="내 지원 현황 보기"
            variant="secondary"
            onPress={() =>
              router.push(
                "/band/session/applications" as Parameters<
                  typeof router.push
                >[0],
              )
            }
          />
        </>
      )}
    </Screen>
  );
}

function ProfileSummary({
  nickname,
  profileImageUrl,
  part,
  skillLevel,
  genre,
  region,
  applicationCount,
  submissionCount,
  inProgressCount,
}: {
  nickname: string;
  profileImageUrl: string | null;
  part?: string | null;
  skillLevel?: string | null;
  genre?: string | null;
  region?: string | null;
  applicationCount: number;
  submissionCount: number;
  inProgressCount: number;
}) {
  const description =
    [
      part,
      genre,
      region,
    ]
      .filter(Boolean)
      .join(" · ") ||
    "기본 정보를 등록해 주세요.";

  return (
    <AppCard
      style={
        styles.profileCard
      }
    >
      <View
        style={
          styles.profileRow
        }
      >
        <Avatar
          imageUrl={
            profileImageUrl
          }
          label={nickname}
          size={54}
        />

        <View
          style={
            styles.profileInfo
          }
        >
          <View
            style={
              styles.profileTitleRow
            }
          >
            <Text
              style={
                styles.nickname
              }
            >
              {nickname}
            </Text>

            {skillLevel ? (
              <Badge
                label={
                  skillLevel
                }
                tone="yellow"
              />
            ) : null}
          </View>

          <Text
            style={
              styles.description
            }
          >
            {description}
          </Text>
        </View>
      </View>

      <View
        style={styles.stats}
      >
        <Stat
          label="지원서"
          value={
            applicationCount
          }
        />

        <Stat
          label="지원"
          value={
            submissionCount
          }
        />

        <Stat
          label="진행중"
          value={
            inProgressCount
          }
        />
      </View>
    </AppCard>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={styles.stat}
    >
      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function ApplicationCard({
  application,
  deleting,
  visibilityPending,
  onDelete,
  onToggleVisibility,
}: {
  application: SessionApplicationSummaryItem;
  deleting: boolean;
  visibilityPending: boolean;
  onDelete: () => void;
  onToggleVisibility: (
    value: boolean,
  ) => void;
}) {
  const isDefault =
    isDefaultApplication(
      application,
    );

  const isPublic =
    application.isPublic ??
    false;

  const editApplication =
    () => {
      router.push(
        `/band/session/applications/form?applicationId=${application.sessionApplicationId}` as Parameters<
          typeof router.push
        >[0],
      );
    };

  return (
    <AppCard
      style={styles.applicationCard}
    >
      <View
        style={
          styles.applicationTop
        }
      >
        <Text
          style={
            styles.dateText
          }
        >
          {formatDisplayDate(
            application.displayDate,
          )}
        </Text>

        {isDefault ? (
          <View
            style={
              styles.visibilityRow
            }
          >
            <Text
              style={
                styles.visibilityLabel
              }
            >
              공개
            </Text>

            <Switch
              value={isPublic}
              disabled={
                visibilityPending
              }
              onValueChange={
                onToggleVisibility
              }
              trackColor={{
                false:
                  colors.neutral400,
                true:
                  colors.primary300,
              }}
              thumbColor={
                colors.white
              }
              ios_backgroundColor={
                colors.neutral400
              }
            />
          </View>
        ) : null}
      </View>

      <View
        style={styles.badges}
      >
        {isDefault ? (
          <Badge
            label="기본"
            tone="yellow"
          />
        ) : null}

        {isPublic ? (
          <Badge
            label="공개"
            tone="pink"
          />
        ) : (
          <Badge label="비공개" />
        )}
      </View>

      <Text
        style={
          styles.applicationTitle
        }
      >
        [{application.title}]
      </Text>

      <Text
        style={
          styles.applicationPurpose
        }
      >
        {application.purpose}
      </Text>

      <View
        style={
          styles.cardActions
        }
      >
        <AppButton
          label="수정"
          variant="secondary"
          style={
            styles.actionButton
          }
          onPress={
            editApplication
          }
        />

        <AppButton
          label="삭제"
          variant="ghost"
          disabled={deleting}
          style={
            styles.actionButton
          }
          onPress={
            onDelete
          }
        />
      </View>
    </AppCard>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
      paddingBottom:
        spacing.xxl,
    },

    headerButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent:
        "center",
    },

    profileCard: {
      gap: spacing.lg,
    },

    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    profileInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    profileTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
    },

    nickname: {
      color:
        colors.neutral900,
      fontSize: 17,
      fontWeight: "900",
    },

    description: {
      color:
        colors.neutral600,
      fontSize: 12,
      lineHeight: 18,
    },

    stats: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor:
        colors.neutral300,
      paddingTop:
        spacing.md,
    },

    stat: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xs,
    },

    statValue: {
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "900",
    },

    statLabel: {
      color:
        colors.neutral600,
      fontSize: 12,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
      gap: spacing.md,
    },

    sectionHeaderText: {
      flex: 1,
      gap: spacing.xs,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 18,
      fontWeight: "900",
    },

    addTextButton: {
      paddingVertical:
        spacing.sm,
    },

    addText: {
      color:
        colors.primary600,
      fontSize: 13,
      fontWeight: "800",
    },

    applicationList: {
      gap: spacing.md,
    },

    applicationCard: {
      gap: spacing.md,
    },

    applicationTop: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
    },

    dateText: {
      flex: 1,
      color:
        colors.neutral500,
      fontSize: 12,
    },

    visibilityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    visibilityLabel: {
      color:
        colors.neutral700,
      fontSize: 12,
      fontWeight: "700",
    },

    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },

    applicationTitle: {
      color:
        colors.primary600,
      fontSize: 17,
      fontWeight: "900",
    },

    applicationPurpose: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
    },

    cardActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },

    actionButton: {
      flex: 1,
    },
  });