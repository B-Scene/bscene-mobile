import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApplicationSelectModal } from "@/features/session/ApplicationSelectModal";
import { ApplicationSubmittedScreen } from "@/features/session/RecruitmentCompleteScreens";
import { useApplySessionRecruitmentMutation } from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import {
  useDeleteSessionRecruitment,
  useSessionRecruitmentDetailQuery,
} from "@/hooks/api/session/useSessionRecruitment";
import { AppIcon } from "@/shared/components/AppIcon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import type { SessionRecruitmentDetailResponse } from "@/types/session/sessionRecruitment";

type RouterTarget = Parameters<typeof router.push>[0];

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatDday = (dDay: number) => {
  if (dDay < 0) return "마감";
  if (dDay === 0) return "오늘 마감";

  return `D-${dDay}`;
};

const formatDeadline = (value: string) => {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const [dateValue, timeValue = ""] = normalized.split("T");
  const time = timeValue.slice(0, 5);

  if (!dateValue || !time) return value;

  const [year, month, day] = dateValue.split("-");

  return `${year}.${month}.${day}. ${time} 마감`;
};

function DetailHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        hitSlop={12}
        style={styles.headerBack}
        onPress={() => router.back()}
      >
        <AppIcon name="arrowLeft" size={24} />
      </Pressable>
      <Text style={styles.headerTitle}>모집 공고</Text>
    </View>
  );
}

export function BandSessionRecruitmentDetailScreen() {
  const params = useLocalSearchParams<{ recruitmentId?: string }>();
  const recruitmentId = parseRouteId(params.recruitmentId);
  const query = useSessionRecruitmentDetailQuery(recruitmentId);
  const deleteMutation = useDeleteSessionRecruitment();
  const createChatMutation = useCreateChatRoomMutation();
  const applyMutation = useApplySessionRecruitmentMutation();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelErrorMessage, setCancelErrorMessage] = useState("");
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [completedApplication, setCompletedApplication] = useState<{
    sessionApplicationId: number;
    applicationTitle: string;
  } | null>(null);
  const detail = query.data;

  const openChat = async () => {
    if (!detail || detail.isMine || createChatMutation.isPending) return;

    try {
      const room = await createChatMutation.mutateAsync({
        contextType: "RECRUITMENT",
        sessionRecruitmentId: detail.sessionRecruitmentId,
      });

      router.push(`/band/session/messages/${room.chatRoomId}` as RouterTarget);
    } catch (error) {
      Alert.alert(
        "쪽지",
        getApiErrorMessage(
          error,
          "쪽지방 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const editRecruitment = () => {
    if (!detail) return;

    router.push(
      `/band/session/recruitments/form?recruitmentId=${detail.sessionRecruitmentId}` as RouterTarget,
    );
  };

  const openCancelModal = () => {
    setCancelErrorMessage("");
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (!deleteMutation.isPending) setIsCancelModalOpen(false);
  };

  const confirmCancel = async () => {
    if (!detail || deleteMutation.isPending) return;

    setCancelErrorMessage("");

    try {
      await deleteMutation.mutateAsync(detail.sessionRecruitmentId);
      setIsCancelModalOpen(false);
      router.replace("/band/session" as Parameters<typeof router.replace>[0]);
    } catch (error) {
      setCancelErrorMessage(
        getApiErrorMessage(
          error,
          "세션 모집 공고 취소에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const previewApplication = (sessionApplicationId: number) => {
    setIsApplicationModalOpen(false);
    router.push(`/band/session/find/${sessionApplicationId}?own=1` as RouterTarget);
  };

  const editApplication = (sessionApplicationId: number) => {
    setIsApplicationModalOpen(false);
    router.push(
      `/band/session/applications/form?applicationId=${sessionApplicationId}` as RouterTarget,
    );
  };

  const createApplication = () => {
    setIsApplicationModalOpen(false);
    router.push("/band/session/applications/form" as RouterTarget);
  };

  const applyApplication = async (sessionApplicationId: number) => {
    if (!detail) return;

    try {
      const result = await applyMutation.mutateAsync({
        sessionRecruitmentId: detail.sessionRecruitmentId,
        body: { sessionApplicationId },
      });

      setIsApplicationModalOpen(false);
      setCompletedApplication({
        sessionApplicationId,
        applicationTitle: result.applicationTitle,
      });
    } catch (error) {
      Alert.alert(
        "세션 지원",
        getApiErrorMessage(error, "지원에 실패했어요. 잠시 후 다시 시도해주세요."),
      );
    }
  };

  if (detail && completedApplication) {
    return (
      <ApplicationSubmittedScreen
        recruitmentTitle={detail.recruitmentTitle}
        bandName={detail.bandName}
        applicationTitle={completedApplication.applicationTitle}
        messaging={createChatMutation.isPending}
        onSendMessage={() => void openChat()}
        onViewApplication={() =>
          previewApplication(completedApplication.sessionApplicationId)
        }
        onGoToSessionHome={() => router.back()}
      />
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <DetailHeader />

      {query.isLoading ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>
            모집 공고 상세 정보를 불러오고 있어요
          </Text>
        </View>
      ) : query.isError || !detail ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>
            모집 공고 상세 정보를 불러오지 못했어요
          </Text>
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
          <ScrollView style={styles.scroll}>
            <RecruitmentDetailContent detail={detail} />
          </ScrollView>

          <View style={styles.footer}>
            {detail.isMine ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  style={styles.outlineAction}
                  onPress={editRecruitment}
                >
                  <Text style={styles.outlineActionText}>수정하기</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={deleteMutation.isPending}
                  style={[
                    styles.filledAction,
                    deleteMutation.isPending && styles.disabled,
                  ]}
                  onPress={openCancelModal}
                >
                  <Text style={styles.filledActionText}>
                    {deleteMutation.isPending ? "취소 중" : "취소하기"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={createChatMutation.isPending}
                  style={styles.outlineAction}
                  onPress={() => void openChat()}
                >
                  <Text style={styles.outlineActionText}>쪽지 보내기</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.filledAction}
                  onPress={() => setIsApplicationModalOpen(true)}
                >
                  <Text style={styles.filledActionText}>지원하기</Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}

      <ConfirmModal
        open={isCancelModalOpen}
        tone="orange"
        title="세션 모집 공고를 취소할까요?"
        description={
          <>
            {"취소한 모집 공고는\n다시 복구할 수 없어요."}
            {cancelErrorMessage ? (
              <Text style={styles.modalError}>{`\n${cancelErrorMessage}`}</Text>
            ) : null}
          </>
        }
        cancelLabel="닫기"
        confirmLabel={deleteMutation.isPending ? "취소 중" : "취소하기"}
        confirmDisabled={deleteMutation.isPending}
        onCancel={closeCancelModal}
        onConfirm={() => void confirmCancel()}
      />

      {detail && !detail.isMine ? (
        <ApplicationSelectModal
          open={isApplicationModalOpen}
          applying={applyMutation.isPending}
          onClose={() => setIsApplicationModalOpen(false)}
          onCreateApplication={createApplication}
          onPreviewApplication={previewApplication}
          onEditApplication={editApplication}
          onApplyApplication={(id) => void applyApplication(id)}
        />
      ) : null}
    </Screen>
  );
}

function RecruitmentDetailContent({
  detail,
}: {
  detail: SessionRecruitmentDetailResponse;
}) {
  const infoRows = [
    { label: "파트", value: detail.part },
    { label: "실력대", value: detail.skillLevel },
    { label: "장르", value: detail.genre },
    { label: "활동 지역", value: detail.region },
    { label: "연습 일정", value: detail.practiceSchedule },
    { label: "연습 장소", value: detail.practicePlace },
    { label: "지원 자격", value: detail.qualification },
  ];
  const shortLocation =
    detail.bandRegion.split(" ")[0] || detail.bandRegion;

  return (
    <>
      <View style={styles.summary}>
        {detail.isNew ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : null}

        <View style={styles.titleGroup}>
          <Text style={styles.title}>{detail.recruitmentTitle}</Text>
          <View style={styles.deadlineRow}>
            <Text style={styles.deadlineText}>
              {detail.deadlineAt
                ? formatDeadline(detail.deadlineAt)
                : "마감일 정보 없음"}
            </Text>
            <View style={styles.deadlineDivider} />
            <Text style={styles.ddayText}>{formatDday(detail.dDay)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.thickDivider} />

      <View style={styles.contentWrap}>
        <DetailSection title="상세 요강" bodyGap={16}>
          <Text style={styles.bodyText}>
            {detail.content || "상세 요강이 없습니다."}
          </Text>
        </DetailSection>

        <View style={styles.sectionDivider} />

        <DetailSection title="모집 조건" bodyGap={16}>
          <View style={styles.infoRows}>
            {infoRows.map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value || "-"}</Text>
              </View>
            ))}
          </View>
        </DetailSection>

        <View style={styles.sectionDivider} />

        <DetailSection title="밴드 정보" bodyGap={12} last>
          <View style={styles.bandCard}>
            <ProfileImage
              imageUrl={detail.bandProfileImageUrl}
              size={35}
              variant="band"
            />
            <View style={styles.bandText}>
              <Text numberOfLines={1} style={styles.bandName}>
                {detail.bandName}
              </Text>
              <Text numberOfLines={1} style={styles.bandMeta}>
                {detail.bandGenre} · {shortLocation}
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
  bodyGap,
  last = false,
  children,
}: {
  title: string;
  bodyGap: number;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.section, last && styles.sectionLast]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ marginTop: bodyGap }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  headerBack: {
    position: "absolute",
    left: 15,
    top: 12,
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  scroll: {
    flex: 1,
  },
  state: {
    flex: 1,
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
  summary: {
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
  },
  newBadge: {
    height: 13,
    justifyContent: "center",
    borderRadius: 2,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 3,
  },
  newBadgeText: {
    ...textStyles.label4,
    color: colors.white,
  },
  titleGroup: {
    gap: 2,
  },
  title: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  deadlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  deadlineText: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  deadlineDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.neutral300,
    marginHorizontal: 8,
  },
  ddayText: {
    ...textStyles.caption2,
    color: colors.secondary500,
  },
  thickDivider: {
    height: 2,
    backgroundColor: colors.neutral400,
  },
  contentWrap: {
    paddingHorizontal: 32,
  },
  section: {
    paddingVertical: 24,
  },
  sectionLast: {
    paddingBottom: 32,
  },
  sectionTitle: {
    ...textStyles.body6,
    color: colors.neutral900,
  },
  bodyText: {
    ...textStyles.caption2,
    color: colors.neutral800,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: colors.neutral300,
    marginHorizontal: -8,
  },
  infoRows: {
    gap: 12,
  },
  infoRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 32,
  },
  infoLabel: {
    ...textStyles.caption2,
    width: 52,
    color: colors.neutral700,
  },
  infoValue: {
    ...textStyles.caption2,
    flex: 1,
    minWidth: 0,
    color: colors.neutral800,
  },
  bandCard: {
    ...shadows.card,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingLeft: 12,
    paddingRight: 15,
    paddingVertical: 12,
  },
  bandText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 20,
  },
  bandName: {
    ...textStyles.caption3,
    color: colors.neutral900,
  },
  bandMeta: {
    ...textStyles.caption2,
    marginTop: 1,
    color: colors.neutral600,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
    boxShadow: "0px -4px 16px 0px rgba(0, 0, 0, 0.04)",
  },
  outlineAction: {
    height: 48,
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.secondary500,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  outlineActionText: {
    ...textStyles.body6,
    color: colors.secondary500,
  },
  filledAction: {
    height: 48,
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.secondary500,
  },
  filledActionText: {
    ...textStyles.body6,
    color: colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
  modalError: {
    color: colors.error,
  },
});
