import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  useAddSessionRecruitmentInterest,
  useDeleteSessionRecruitment,
  useRemoveSessionRecruitmentInterest,
  useSessionRecruitmentDetailQuery,
} from "@/hooks/api/session/useSessionRecruitment";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";

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

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}.`;
};

export function BandSessionRecruitmentDetailScreen() {
  const params = useLocalSearchParams<{ recruitmentId?: string }>();
  const recruitmentId = parseRouteId(params.recruitmentId);
  const query = useSessionRecruitmentDetailQuery(recruitmentId);
  const addInterestMutation = useAddSessionRecruitmentInterest();
  const removeInterestMutation = useRemoveSessionRecruitmentInterest();
  const deleteMutation = useDeleteSessionRecruitment();
  const detail = query.data;
  const isInterested = detail?.isInterested ?? false;
  const isInterestPending =
    addInterestMutation.isPending || removeInterestMutation.isPending;

  const toggleInterest = async () => {
    if (!detail) return;

    try {
      if (isInterested) {
        await removeInterestMutation.mutateAsync(detail.sessionRecruitmentId);
        return;
      }

      await addInterestMutation.mutateAsync(detail.sessionRecruitmentId);
    } catch {
      Alert.alert("관심 공고", "관심 상태를 변경하지 못했어요.");
    }
  };

  const editRecruitment = () => {
    if (!detail) return;

    router.push(
      `/band/session/recruitments/form?recruitmentId=${detail.sessionRecruitmentId}` as Parameters<
        typeof router.push
      >[0],
    );
  };

  const deleteRecruitment = () => {
    if (!detail) return;

    Alert.alert("모집 공고 삭제", "이 모집 공고를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteMutation.mutateAsync(detail.sessionRecruitmentId);
              router.replace("/band/session" as Parameters<typeof router.replace>[0]);
            } catch {
              Alert.alert("모집 공고 삭제", "모집 공고를 삭제하지 못했어요.");
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="모집 공고 상세" />

      {query.isLoading ? (
        <AppState loading title="모집 공고를 불러오는 중이에요" />
      ) : query.isError || !detail ? (
        <AppState
          title="모집 공고를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <>
          <AppCard style={styles.heroCard}>
            <View style={styles.bandRow}>
              <Avatar
                imageUrl={detail.bandProfileImageUrl}
                label={detail.bandName}
                size={52}
              />
              <View style={styles.bandText}>
                <Text style={styles.bandName}>{detail.bandName}</Text>
                <Text style={styles.meta}>
                  {[detail.bandGenre, detail.bandRegion].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>
            <View style={styles.badges}>
              <Badge label={formatDday(detail.dDay)} tone="yellow" />
              {detail.isNew ? <Badge label="NEW" tone="pink" /> : null}
              {detail.isMine ? <Badge label="내 공고" /> : null}
            </View>
            <Text style={styles.title}>{detail.recruitmentTitle}</Text>
          </AppCard>

          <AppCard style={styles.infoCard}>
            <InfoRow label="모집 파트" value={detail.part} />
            <InfoRow label="실력" value={detail.skillLevel} />
            <InfoRow label="장르" value={detail.genre} />
            <InfoRow label="지역" value={detail.region} />
            <InfoRow label="연습 일정" value={detail.practiceSchedule} />
            <InfoRow label="연습 장소" value={detail.practicePlace} />
            <InfoRow label="마감일" value={formatDate(detail.deadlineAt)} />
          </AppCard>

          <Section title="모집 내용">
            <Text style={styles.body}>{detail.content}</Text>
          </Section>

          <Section title="지원 자격">
            <Text style={styles.body}>{detail.qualification}</Text>
          </Section>

          {detail.isMine ? (
            <View style={styles.ownerActions}>
              <AppButton
                label="수정"
                variant="secondary"
                style={styles.ownerButton}
                onPress={editRecruitment}
              />
              <AppButton
                label="삭제"
                variant="ghost"
                loading={deleteMutation.isPending}
                style={styles.ownerButton}
                onPress={deleteRecruitment}
              />
            </View>
          ) : null}

          <AppButton
            label={isInterested ? "관심 공고 해제" : "관심 공고 등록"}
            variant={isInterested ? "secondary" : "primary"}
            loading={isInterestPending}
            onPress={() => void toggleInterest()}
          />
        </>
      )}
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppCard style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.md,
  },
  bandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bandText: {
    flex: 1,
    gap: spacing.xs,
  },
  bandName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    color: colors.neutral900,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31,
  },
  infoCard: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  infoLabel: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  body: {
    color: colors.neutral800,
    fontSize: 14,
    lineHeight: 22,
  },
  ownerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ownerButton: {
    flex: 1,
  },
});
