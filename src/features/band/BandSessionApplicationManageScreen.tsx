import { router } from "expo-router";
import { Fragment } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  useDeleteSessionApplicationMutation,
  useMySessionApplicationSummaryQuery,
  useUpdateSessionApplicationVisibilityMutation,
} from "@/hooks/api/session/useSessionApplication";
import { AppHeader } from "@/shared/components/AppHeader";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type { SessionApplicationSummaryItem } from "@/types/session/sessionApplication";

const isDefaultApplication = (
  application: SessionApplicationSummaryItem,
) => {
  const purpose = application.purpose.trim().toUpperCase();
  const title = application.title.trim().toUpperCase();

  return (
    purpose === "기본" ||
    purpose === "DEFAULT" ||
    purpose === "BASIC" ||
    title === "기본" ||
    title === "DEFAULT" ||
    title === "BASIC"
  );
};

const formatDisplayDate = (value: string) => {
  if (!value) {
    return "";
  }

  if (value.includes("작성") || value.includes("수정")) {
    return value;
  }

  if (value.includes("T")) {
    return `${value.slice(0, 10)} 작성`;
  }

  return value;
};

export function BandSessionApplicationManageScreen() {
  const query = useMySessionApplicationSummaryQuery();
  const deleteMutation = useDeleteSessionApplicationMutation();
  const visibilityMutation =
    useUpdateSessionApplicationVisibilityMutation();

  const summary = query.data;
  const applications = summary?.applications ?? [];
  const hasApplications = applications.length > 0;
  const isActionPending =
    deleteMutation.isPending || visibilityMutation.isPending;

  const createApplication = () => {
    router.push(
      "/band/session/applications/form" as Parameters<typeof router.push>[0],
    );
  };

  const deleteApplication = (application: SessionApplicationSummaryItem) => {
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
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteMutation.mutateAsync(
                  application.sessionApplicationId,
                );
              } catch {
                Alert.alert("지원서 삭제", "지원서를 삭제하지 못했어요.");
              }
            })();
          },
        },
      ],
    );
  };

  const toggleVisibility = (
    application: SessionApplicationSummaryItem,
    nextValue: boolean,
  ) => {
    void (async () => {
      try {
        await visibilityMutation.mutateAsync({
          sessionApplicationId: application.sessionApplicationId,
          body: {
            isPublic: nextValue,
          },
        });
      } catch {
        Alert.alert("지원서 공개 설정", "공개 상태를 변경하지 못했어요.");
      }
    })();
  };

  return (
    <Screen edges={["top", "left", "right"]} contentStyle={styles.container}>
      <AppHeader title="지원서 관리" style={styles.header} />

      {query.isLoading ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>내 지원서를 불러오고 있어요</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>내 지원서를 불러오지 못했어요</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.profileRow}>
              <ProfileImage imageUrl={summary?.profileImageUrl} size={42} />

              <View style={styles.profileInfo}>
                <View style={styles.profileTitleRow}>
                  <Text numberOfLines={1} style={styles.nickname}>
                    {summary?.nickname ?? "닉네임 없음"}
                  </Text>
                  {summary?.skillLevel ? (
                    <View style={styles.skillBadge}>
                      <Text style={styles.skillText}>{summary.skillLevel}</Text>
                    </View>
                  ) : null}
                </View>

                <Text numberOfLines={1} style={styles.profileDescription}>
                  {[summary?.part, summary?.genre, summary?.region]
                    .filter(Boolean)
                    .join(" · ") || "기본 정보를 등록해주세요"}
                </Text>
              </View>
            </View>

            <StatRow
              stats={[
                { label: "지원서", value: summary?.applicationCount ?? 0 },
                { label: "지원", value: summary?.submissionCount ?? 0 },
                { label: "진행중", value: summary?.inProgressCount ?? 0 },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              style={styles.historyButton}
              onPress={() =>
                router.push(
                  "/band/session/applications" as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            >
              <Text style={styles.historyButtonText}>지원 내역</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>지원서</Text>
                <Text style={styles.sectionDescription}>
                  지원할 때 선택할 소개서를 관리해요
                </Text>
              </View>

              {hasApplications ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isActionPending}
                  onPress={createApplication}
                >
                  <Text
                    style={[
                      styles.addText,
                      isActionPending && styles.addTextDisabled,
                    ]}
                  >
                    + 지원서 추가
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {hasApplications ? (
              <View style={styles.applicationList}>
                {applications.map((application) => (
                  <ApplicationCard
                    key={application.sessionApplicationId}
                    application={application}
                    deleting={deleteMutation.isPending}
                    visibilityPending={visibilityMutation.isPending}
                    onDelete={() => deleteApplication(application)}
                    onToggleVisibility={(nextValue) =>
                      toggleVisibility(application, nextValue)
                    }
                  />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>내 지원서가 없어요</Text>
                <Text style={styles.emptyDescription}>
                  {
                    "모집공고에 바로 지원할 수 있도록\n파트, 실력대, 소개글을 담은 지원서를 먼저 만들어보세요"
                  }
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.emptyButton}
                  onPress={createApplication}
                >
                  <Text style={styles.emptyButtonText}>지원서 작성</Text>
                </Pressable>
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

function StatRow({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return (
    <View style={styles.stats}>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <View style={styles.statDivider} /> : null}
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        </Fragment>
      ))}
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
  onToggleVisibility: (value: boolean) => void;
}) {
  const isDefault = isDefaultApplication(application);
  const isPublic = application.isPublic ?? false;

  const editApplication = () => {
    router.push(
      `/band/session/applications/form?applicationId=${application.sessionApplicationId}` as Parameters<
        typeof router.push
      >[0],
    );
  };

  return (
    <View style={styles.applicationCard}>
      <View style={styles.applicationTop}>
        <Text numberOfLines={1} style={styles.dateText}>
          {formatDisplayDate(application.displayDate)}
        </Text>

        {isDefault ? (
          <View style={styles.visibilityRow}>
            <Text style={styles.visibilityLabel}>이력서 공개</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel={
                isPublic ? "이력서 공개 끄기" : "이력서 공개 켜기"
              }
              accessibilityState={{
                checked: isPublic,
                disabled: visibilityPending,
              }}
              disabled={visibilityPending}
              style={[
                styles.toggleTrack,
                isPublic && styles.toggleTrackOn,
                visibilityPending && styles.toggleDisabled,
              ]}
              onPress={() => onToggleVisibility(!isPublic)}
            >
              <View
                style={[styles.toggleThumb, isPublic && styles.toggleThumbOn]}
              />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={styles.applicationTitle}>
        <Text style={styles.applicationTitleAccent}>
          [{application.title}]
        </Text>{" "}
        {application.purpose}
      </Text>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          style={[styles.cardAction, styles.editButton]}
          onPress={editApplication}
        >
          <Text style={styles.cardActionText}>수정</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={deleting}
          style={[styles.cardAction, styles.deleteButton]}
          onPress={onDelete}
        >
          <Text style={styles.cardActionText}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 15,
  },
  state: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  hero: {
    gap: 16,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nickname: {
    ...textStyles.label1,
    flexShrink: 1,
    color: colors.neutral900,
  },
  skillBadge: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 999,
    backgroundColor: colors.secondary0,
    paddingHorizontal: 15,
  },
  skillText: {
    ...textStyles.caption3,
    color: colors.secondary500,
  },
  profileDescription: {
    ...textStyles.caption3,
    marginTop: 4,
    color: colors.neutral600,
  },
  stats: {
    ...shadows.card,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
    backgroundColor: colors.neutral300,
  },
  statValue: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  statLabel: {
    ...textStyles.body5,
    color: colors.neutral600,
  },
  historyButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.secondary400,
  },
  historyButtonText: {
    ...textStyles.body1,
    color: colors.white,
  },
  section: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  sectionDescription: {
    ...textStyles.caption2,
    marginTop: 4,
    color: colors.neutral600,
  },
  addText: {
    ...textStyles.caption3,
    color: colors.secondary500,
    textDecorationLine: "underline",
  },
  addTextDisabled: {
    color: colors.neutral400,
  },
  applicationList: {
    gap: 12,
    marginTop: 24,
  },
  empty: {
    width: "100%",
    maxWidth: 313,
    alignItems: "center",
    alignSelf: "center",
    gap: 12,
    marginTop: 48,
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.secondary400,
  },
  emptyButtonText: {
    ...textStyles.body1,
    color: colors.white,
  },
  applicationCard: {
    ...shadows.card,
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  applicationTop: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  dateText: {
    ...textStyles.caption3,
    flexShrink: 1,
    color: colors.neutral500,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visibilityLabel: {
    ...textStyles.caption3,
    color: colors.neutral700,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.neutral400,
    padding: 2,
  },
  toggleTrackOn: {
    backgroundColor: colors.secondary500,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  applicationTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  applicationTitleAccent: {
    color: colors.secondary500,
  },
  cardActions: {
    flexDirection: "row",
    gap: 28,
  },
  cardAction: {
    height: 32,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: colors.secondary0,
  },
  deleteButton: {
    backgroundColor: colors.neutral300,
  },
  cardActionText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
});
