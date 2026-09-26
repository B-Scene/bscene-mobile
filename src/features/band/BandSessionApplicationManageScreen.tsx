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
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
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

  const createApplication = () => {
    router.push(
      "/band/session/applications/form" as Parameters<typeof router.push>[0],
    );
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader
        title="지원서 관리"
        rightContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지원서 추가"
            hitSlop={12}
            style={styles.headerButton}
            onPress={createApplication}
          >
            <Plus size={22} color={colors.neutral900} />
          </Pressable>
        }
      />

      {query.isLoading ? (
        <AppState loading title="내 지원서를 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="내 지원서를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <>
          <ProfileSummary
            nickname={summary?.nickname ?? "닉네임 없음"}
            profileImageUrl={summary?.profileImageUrl ?? null}
            part={summary?.part}
            skillLevel={summary?.skillLevel}
            genre={summary?.genre}
            region={summary?.region}
            applicationCount={summary?.applicationCount ?? 0}
            submissionCount={summary?.submissionCount ?? 0}
            inProgressCount={summary?.inProgressCount ?? 0}
          />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>지원서</Text>
              <Text style={styles.description}>
                세션 모집에 지원할 때 사용할 소개서를 관리해요.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              style={styles.addTextButton}
              onPress={createApplication}
            >
              <Text style={styles.addText}>+ 지원서 추가</Text>
            </Pressable>
          </View>

          {applications.length === 0 ? (
            <AppState
              title="등록된 지원서가 없어요"
              description="모집 공고에 바로 지원할 수 있도록 지원서를 먼저 만들어 보세요."
              actionLabel="지원서 작성"
              onAction={createApplication}
            />
          ) : (
            <View style={styles.applicationList}>
              {applications.map((application) => (
                <ApplicationCard
                  key={application.sessionApplicationId}
                  application={application}
                  deleting={deleteMutation.isPending}
                  visibilityPending={visibilityMutation.isPending}
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
                          style: "destructive",
                          onPress: () => {
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
                  onToggleVisibility={(nextValue) => {
                    void (async () => {
                      try {
                        await visibilityMutation.mutateAsync({
                          sessionApplicationId:
                            application.sessionApplicationId,
                          body: {
                            isPublic: nextValue,
                          },
                        });
                      } catch {
                        Alert.alert(
                          "지원서 공개 설정",
                          "공개 상태를 변경하지 못했어요.",
                        );
                      }
                    })();
                  }}
                />
              ))}
            </View>
          )}

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
            <Text style={styles.historyButtonText}>내 지원 현황 보기</Text>
          </Pressable>
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
    [part, genre, region].filter(Boolean).join(" · ") ||
    "기본 정보를 등록해 주세요.";

  return (
    <View style={styles.profileCard}>
      <View style={styles.profileRow}>
        <Avatar imageUrl={profileImageUrl} label={nickname} size={54} />

        <View style={styles.profileInfo}>
          <View style={styles.profileTitleRow}>
            <Text style={styles.nickname}>{nickname}</Text>
            {skillLevel ? (
              <Text style={styles.skillBadge}>{skillLevel}</Text>
            ) : null}
          </View>

          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="지원서" value={applicationCount} />
        <Stat label="지원" value={submissionCount} />
        <Stat label="진행중" value={inProgressCount} />
      </View>
    </View>
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
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
        <Text style={styles.dateText}>
          {formatDisplayDate(application.displayDate)}
        </Text>

        {isDefault ? (
          <View style={styles.visibilityRow}>
            <Text style={styles.visibilityLabel}>이력서 공개</Text>
            <Switch
              value={isPublic}
              disabled={visibilityPending}
              onValueChange={onToggleVisibility}
              trackColor={{
                false: colors.neutral400,
                true: colors.secondary300,
              }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.neutral400}
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.applicationTitle}>
        <Text style={styles.applicationTitleAccent}>
          [{application.title}]
        </Text>{" "}
        {application.purpose}
      </Text>

      <View style={styles.statusLine}>
        {isDefault ? <Text style={styles.defaultBadge}>기본</Text> : null}
        <Text
          style={[
            styles.publicBadge,
            isPublic ? styles.publicBadgeOn : styles.publicBadgeOff,
          ]}
        >
          {isPublic ? "공개" : "비공개"}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          style={styles.editButton}
          onPress={editApplication}
        >
          <Text style={styles.cardActionText}>수정</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={deleting}
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Text style={styles.cardActionText}>
            {deleting ? "삭제 중" : "삭제"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: colors.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  nickname: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  skillBadge: {
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    color: colors.secondary600,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  description: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.neutral300,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  statLabel: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  addTextButton: {
    paddingVertical: 8,
  },
  addText: {
    color: colors.secondary500,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  applicationList: {
    gap: 14,
  },
  applicationCard: {
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  applicationTop: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  dateText: {
    flex: 1,
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visibilityLabel: {
    color: colors.neutral700,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  applicationTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  applicationTitleAccent: {
    color: colors.secondary500,
  },
  statusLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  defaultBadge: {
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    color: colors.secondary600,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  publicBadge: {
    height: 22,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  publicBadgeOn: {
    backgroundColor: colors.secondary500,
    color: colors.white,
  },
  publicBadgeOff: {
    backgroundColor: colors.neutral300,
    color: colors.neutral600,
  },
  cardActions: {
    flexDirection: "row",
    gap: 28,
  },
  editButton: {
    flex: 1,
    height: 32,
    borderRadius: 5,
    backgroundColor: colors.secondary0,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    flex: 1,
    height: 32,
    borderRadius: 5,
    backgroundColor: colors.neutral300,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActionText: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  historyButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  historyButtonText: {
    color: colors.secondary500,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
