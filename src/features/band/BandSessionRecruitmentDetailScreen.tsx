import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useApplySessionRecruitmentMutation,
  useMySessionApplicationSummaryQuery,
} from "@/hooks/api/session/useSessionApplication";
import {
  useCreateChatRoomMutation,
} from "@/hooks/api/session/useSessionChat";
import {
  useAddSessionRecruitmentInterest,
  useDeleteSessionRecruitment,
  useRemoveSessionRecruitmentInterest,
  useSessionRecruitmentDetailQuery,
} from "@/hooks/api/session/useSessionRecruitment";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
} from "@/shared/constants/theme";
import type {
  SessionRecruitmentDetailResponse,
} from "@/types/session/sessionRecruitment";

const parseRouteId = (
  value?: string | string[],
) => {
  const rawValue =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number(rawValue);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 0;
};

const formatDday = (
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

const formatDeadline = (
  value: string,
) => {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const [dateValue, timeValue = ""] = normalized.split("T");
  const time = timeValue.slice(0, 5);

  if (!dateValue || !time) {
    return value;
  }

  const [year, month, day] = dateValue.split("-");

  return `${year}.${month}.${day}. ${time} 마감`;
};

export function BandSessionRecruitmentDetailScreen() {
  const params =
    useLocalSearchParams<{
      recruitmentId?: string;
    }>();

  const recruitmentId =
    parseRouteId(
      params.recruitmentId,
    );

  const query =
    useSessionRecruitmentDetailQuery(
      recruitmentId,
    );

  const addInterestMutation =
    useAddSessionRecruitmentInterest();

  const removeInterestMutation =
    useRemoveSessionRecruitmentInterest();

  const deleteMutation =
    useDeleteSessionRecruitment();

  const createChatMutation =
    useCreateChatRoomMutation();

  const detail = query.data;
  const isInterested =
    detail?.isInterested ??
    false;
  const isInterestPending =
    addInterestMutation.isPending ||
    removeInterestMutation.isPending;

  const toggleInterest =
    async () => {
      if (!detail) {
        return;
      }

      try {
        if (isInterested) {
          await removeInterestMutation.mutateAsync(
            detail.sessionRecruitmentId,
          );

          return;
        }

        await addInterestMutation.mutateAsync(
          detail.sessionRecruitmentId,
        );
      } catch {
        Alert.alert(
          "관심 공고",
          "관심 상태를 변경하지 못했어요.",
        );
      }
    };

  const openChat =
    async () => {
      if (
        !detail ||
        detail.isMine ||
        createChatMutation.isPending
      ) {
        return;
      }

      try {
        const room =
          await createChatMutation.mutateAsync(
            {
              contextType:
                "RECRUITMENT",

              sessionRecruitmentId:
                detail.sessionRecruitmentId,
            },
          );

        router.push(
          `/band/session/messages/${room.chatRoomId}` as Parameters<
            typeof router.push
          >[0],
        );
      } catch {
        Alert.alert(
          "쪽지",
          "쪽지방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
      }
    };

  const editRecruitment =
    () => {
      if (!detail) {
        return;
      }

      router.push(
        `/band/session/recruitments/form?recruitmentId=${detail.sessionRecruitmentId}` as Parameters<
          typeof router.push
        >[0],
      );
    };

  const deleteRecruitment =
    () => {
      if (!detail) {
        return;
      }

      Alert.alert(
        "세션 모집 공고 취소",
        "취소한 모집 공고는 다시 복구할 수 없어요.",
        [
          {
            text: "닫기",
            style: "cancel",
          },

          {
            text: "취소하기",
            style: "destructive",

            onPress: () => {
              void (async () => {
                try {
                  await deleteMutation.mutateAsync(
                    detail.sessionRecruitmentId,
                  );

                  router.replace(
                    "/band/session" as Parameters<
                      typeof router.replace
                    >[0],
                  );
                } catch {
                  Alert.alert(
                    "모집 공고 취소",
                    "모집 공고를 취소하지 못했어요.",
                  );
                }
              })();
            },
          },
        ],
      );
    };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="모집 공고" />

      {query.isLoading ? (
        <View style={styles.stateWrap}>
          <AppState
            loading
            title="모집 공고 상세 정보를 불러오고 있어요"
          />
        </View>
      ) : query.isError ||
        !detail ? (
        <View style={styles.stateWrap}>
          <AppState
            title="모집 공고 상세 정보를 불러오지 못했어요"
            description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
            actionLabel="다시 시도"
            onAction={() =>
              void query.refetch()
            }
          />
        </View>
      ) : (
        <>
          <RecruitmentDetailContent
            detail={detail}
          />

          {detail.isMine ? (
            <OwnerActions
              isDeleting={deleteMutation.isPending}
              onEdit={editRecruitment}
              onDelete={deleteRecruitment}
            />
          ) : (
            <VisitorActions
              bandName={detail.bandName}
              isMessaging={createChatMutation.isPending}
              onMessage={() => void openChat()}
            />
          )}

          {!detail.isMine ? (
            <ApplyRecruitmentCard
              detail={detail}
            />
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isInterestPending}
            style={[
              styles.interestButton,
              isInterested
                ? styles.interestButtonActive
                : styles.interestButtonIdle,
            ]}
            onPress={() =>
              void toggleInterest()
            }
          >
            <Text
              style={[
                styles.interestButtonText,
                isInterested
                  ? styles.interestButtonTextActive
                  : styles.interestButtonTextIdle,
              ]}
            >
              {isInterestPending
                ? "변경 중..."
                : isInterested
                  ? "관심 공고 해제"
                  : "관심 공고 등록"}
            </Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

function RecruitmentDetailContent({
  detail,
}: {
  detail: SessionRecruitmentDetailResponse;
}) {
  const infoRows = [
    {
      label: "파트",
      value: detail.part,
    },
    {
      label: "실력대",
      value: detail.skillLevel,
    },
    {
      label: "장르",
      value: detail.genre,
    },
    {
      label: "활동 지역",
      value: detail.region,
    },
    {
      label: "연습 일정",
      value: detail.practiceSchedule,
    },
    {
      label: "연습 장소",
      value: detail.practicePlace,
    },
    {
      label: "지원 자격",
      value: detail.qualification,
    },
  ];

  return (
    <>
      <View style={styles.summarySection}>
        <View style={styles.badgeLine}>
          {detail.isNew ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          ) : null}
          {detail.isMine ? (
            <View style={styles.mineBadge}>
              <Text style={styles.mineBadgeText}>내 공고</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{detail.recruitmentTitle}</Text>

        <View style={styles.deadlineRow}>
          <Text style={styles.deadlineText}>
            {formatDeadline(detail.deadlineAt)}
          </Text>
          <View style={styles.deadlineDivider} />
          <Text style={styles.ddayText}>{formatDday(detail.dDay)}</Text>
        </View>
      </View>

      <View style={styles.thickDivider} />

      <View style={styles.contentWrap}>
        <DetailSection title="상세 요강">
          <Text style={styles.bodyText}>
            {detail.content || "상세 요강이 없습니다."}
          </Text>
        </DetailSection>

        <SectionDivider />

        <DetailSection title="모집 조건">
          <View style={styles.infoRows}>
            {infoRows.map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value || "-"}</Text>
              </View>
            ))}
          </View>
        </DetailSection>

        <SectionDivider />

        <DetailSection title="밴드 정보">
          <View style={styles.bandCard}>
            <Avatar
              imageUrl={detail.bandProfileImageUrl}
              label={detail.bandName}
              size={35}
            />
            <View style={styles.bandText}>
              <Text numberOfLines={1} style={styles.bandName}>
                {detail.bandName}
              </Text>
              <Text numberOfLines={1} style={styles.bandMeta}>
                {detail.bandGenre} · {detail.bandRegion}
              </Text>
            </View>
          </View>
        </DetailSection>
      </View>
    </>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SectionDivider() {
  return <View style={styles.sectionDivider} />;
}

function OwnerActions({
  isDeleting,
  onEdit,
  onDelete,
}: {
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.actionFooter}>
      <Pressable
        accessibilityRole="button"
        style={styles.outlineAction}
        onPress={onEdit}
      >
        <Text style={styles.outlineActionText}>수정하기</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={isDeleting}
        style={styles.filledAction}
        onPress={onDelete}
      >
        <Text style={styles.filledActionText}>
          {isDeleting ? "취소 중" : "취소하기"}
        </Text>
      </Pressable>
    </View>
  );
}

function VisitorActions({
  bandName,
  isMessaging,
  onMessage,
}: {
  bandName: string;
  isMessaging: boolean;
  onMessage: () => void;
}) {
  return (
    <View style={styles.actionFooter}>
      <Pressable
        accessibilityRole="button"
        disabled={isMessaging}
        style={styles.outlineAction}
        onPress={onMessage}
      >
        <Text style={styles.outlineActionText}>
          {isMessaging ? "생성 중" : "쪽지 보내기"}
        </Text>
      </Pressable>
      <View style={styles.filledAction}>
        <Text style={styles.filledActionText}>{bandName} 지원하기</Text>
      </View>
    </View>
  );
}

function ApplyRecruitmentCard({
  detail,
}: {
  detail: SessionRecruitmentDetailResponse;
}) {
  const summaryQuery =
    useMySessionApplicationSummaryQuery();

  const applyMutation =
    useApplySessionRecruitmentMutation();

  const applications =
    summaryQuery.data
      ?.applications ?? [];

  const [
    manualSelectedApplicationId,
    setManualSelectedApplicationId,
  ] = useState(0);

  const selectedApplicationId =
    manualSelectedApplicationId ||
    summaryQuery.data
      ?.sessionApplicationId ||
    applications[0]
      ?.sessionApplicationId ||
    0;

  const apply =
    async () => {
      if (
        selectedApplicationId <=
        0
      ) {
        Alert.alert(
          "세션 지원",
          "지원할 지원서를 선택해 주세요.",
        );

        return;
      }

      try {
        const result =
          await applyMutation.mutateAsync(
            {
              sessionRecruitmentId:
                detail.sessionRecruitmentId,

              body: {
                sessionApplicationId:
                  selectedApplicationId,
              },
            },
          );

        Alert.alert(
          "세션 지원 완료",
          `${result.bandName}에 ${result.applicationTitle} 지원서로 지원했어요.`,
        );
      } catch {
        Alert.alert(
          "세션 지원",
          "지원서를 제출하지 못했어요.",
        );
      }
    };

  if (
    summaryQuery.isLoading
  ) {
    return (
      <View style={styles.applyCard}>
        <Text style={styles.sectionTitle}>세션 지원</Text>
        <Text style={styles.bodyText}>내 지원서를 불러오는 중이에요.</Text>
      </View>
    );
  }

  if (
    summaryQuery.isError
  ) {
    return (
      <View style={styles.applyCard}>
        <Text style={styles.sectionTitle}>세션 지원</Text>
        <Text style={styles.bodyText}>내 지원서를 불러오지 못했어요.</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.applyPrimaryButton}
          onPress={() =>
            void summaryQuery.refetch()
          }
        >
          <Text style={styles.applyPrimaryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (
    applications.length === 0
  ) {
    return (
      <View style={styles.applyCard}>
        <Text style={styles.sectionTitle}>세션 지원</Text>
        <Text style={styles.bodyText}>
          아직 등록된 지원서가 없어요. 지원서를 먼저 작성해 주세요.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.applyPrimaryButton}
          onPress={() =>
            router.push(
              "/band/session/applications/form" as Parameters<
                typeof router.push
              >[0],
            )
          }
        >
          <Text style={styles.applyPrimaryText}>지원서 작성하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.applyCard}>
      <Text style={styles.sectionTitle}>세션 지원</Text>
      <Text style={styles.bodyText}>제출할 지원서를 선택해 주세요.</Text>

      <View style={styles.applicationChips}>
        {applications.map(
          (application) => (
            <Pressable
              key={
                application.sessionApplicationId
              }
              accessibilityRole="button"
              style={[
                styles.applicationChip,
                selectedApplicationId === application.sessionApplicationId
                  ? styles.applicationChipSelected
                  : styles.applicationChipIdle,
              ]}
              onPress={() =>
                setManualSelectedApplicationId(
                  application.sessionApplicationId,
                )
              }
            >
              <Text
                style={[
                  styles.applicationChipText,
                  selectedApplicationId === application.sessionApplicationId
                    ? styles.applicationChipTextSelected
                    : styles.applicationChipTextIdle,
                ]}
              >
                {application.title}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <View style={styles.applyButtons}>
        <Pressable
          accessibilityRole="button"
          disabled={applyMutation.isPending}
          style={styles.applyPrimaryButton}
          onPress={() =>
            void apply()
          }
        >
          <Text style={styles.applyPrimaryText}>
            {applyMutation.isPending ? "지원 중" : "지원하기"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.applySecondaryButton}
          onPress={() =>
            router.push(
              "/band/session/applications/manage" as Parameters<
                typeof router.push
              >[0],
            )
          }
        >
          <Text style={styles.applySecondaryText}>지원서 관리</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 104,
      backgroundColor: colors.white,
    },
    stateWrap: {
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    summarySection: {
      paddingHorizontal: 32,
      paddingTop: 16,
      paddingBottom: 20,
    },
    badgeLine: {
      flexDirection: "row",
      gap: 6,
      minHeight: 13,
      marginBottom: 8,
    },
    newBadge: {
      height: 13,
      borderRadius: 2,
      backgroundColor: colors.secondary500,
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    newBadgeText: {
      color: colors.white,
      fontSize: 8,
      fontWeight: "700",
      lineHeight: 10,
    },
    mineBadge: {
      height: 13,
      borderRadius: 2,
      backgroundColor: colors.secondary100,
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    mineBadgeText: {
      color: colors.secondary600,
      fontSize: 8,
      fontWeight: "700",
      lineHeight: 10,
    },
    title: {
      color: colors.neutral900,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 20,
    },
    deadlineRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 6,
    },
    deadlineText: {
      color: colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },
    deadlineDivider: {
      width: 1,
      height: 14,
      backgroundColor: colors.neutral300,
      marginHorizontal: 8,
    },
    ddayText: {
      color: colors.secondary500,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    thickDivider: {
      height: 2,
      backgroundColor: colors.neutral400,
    },
    contentWrap: {
      paddingHorizontal: 32,
    },
    detailSection: {
      paddingVertical: 24,
    },
    sectionTitle: {
      color: colors.neutral900,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    bodyText: {
      color: colors.neutral800,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: 12,
    },
    sectionDivider: {
      height: 2,
      backgroundColor: colors.neutral300,
      marginHorizontal: -8,
    },
    infoRows: {
      gap: 12,
      marginTop: 16,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 32,
    },
    infoLabel: {
      width: 52,
      color: colors.neutral700,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },
    infoValue: {
      flex: 1,
      color: colors.neutral800,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },
    bandCard: {
      minHeight: 60,
      borderRadius: 8,
      backgroundColor: colors.white,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      paddingLeft: 12,
      paddingRight: 15,
      paddingVertical: 12,
      shadowColor: colors.neutral900,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
    },
    bandText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 20,
    },
    bandName: {
      color: colors.neutral900,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
    },
    bandMeta: {
      color: colors.neutral600,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      marginTop: 1,
    },
    actionFooter: {
      backgroundColor: colors.white,
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 32,
      paddingTop: 16,
      paddingBottom: 20,
      shadowColor: colors.neutral900,
      shadowOpacity: 0.04,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 2,
    },
    outlineAction: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.secondary500,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    outlineActionText: {
      color: colors.secondary500,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    filledAction: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.secondary500,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    filledActionText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
      textAlign: "center",
    },
    interestButton: {
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 32,
      marginTop: 12,
    },
    interestButtonActive: {
      borderWidth: 1,
      borderColor: colors.secondary500,
      backgroundColor: colors.white,
    },
    interestButtonIdle: {
      backgroundColor: colors.secondary100,
    },
    interestButtonText: {
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    interestButtonTextActive: {
      color: colors.secondary500,
    },
    interestButtonTextIdle: {
      color: colors.secondary600,
    },
    applyCard: {
      borderRadius: 16,
      backgroundColor: colors.white,
      gap: 12,
      marginHorizontal: 32,
      marginTop: 16,
      padding: 18,
      shadowColor: colors.neutral900,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 2,
    },
    applicationChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    applicationChip: {
      minHeight: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    applicationChipSelected: {
      backgroundColor: colors.secondary500,
    },
    applicationChipIdle: {
      backgroundColor: colors.neutral300,
    },
    applicationChipText: {
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
    },
    applicationChipTextSelected: {
      color: colors.white,
    },
    applicationChipTextIdle: {
      color: colors.neutral600,
    },
    applyButtons: {
      flexDirection: "row",
      gap: 10,
    },
    applyPrimaryButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: colors.secondary500,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    applyPrimaryText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    applySecondaryButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.secondary500,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    applySecondaryText: {
      color: colors.secondary500,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
  });
