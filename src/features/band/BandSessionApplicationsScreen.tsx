import { router } from "expo-router";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import {
  useApplicationSubmissionsQuery,
  useCancelApplicationSubmissionMutation,
  useFinalizeApplicationSubmissionMutation,
} from "@/hooks/api/session/useSessionApplication";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import type { ApplicationSubmissionItem } from "@/types/session/sessionApplication";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "지원 완료",
  BAND_ACCEPTED: "지원 수락",
  ACCEPTED: "참여 확정",
  REJECTED: "지원 거절",
  CANCELED: "지원 취소",
};

const formatAppliedAgo = (value: number) => {
  if (value <= 0) return "방금 전 지원";
  if (value < 24) return `${value}시간 전 지원`;
  return `${Math.floor(value / 24)}일 전 지원`;
};

export function BandSessionApplicationsScreen() {
  const query = useApplicationSubmissionsQuery({ size: 20 });
  const applications = query.data?.content ?? [];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="내 지원 현황" />

      {query.isLoading ? (
        <AppState loading title="내 지원 내역을 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="내 지원 내역을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : applications.length === 0 ? (
        <AppState
          title="지원한 공고가 없어요"
          description="세션 모집 공고에서 지원서를 제출하면 여기에 표시돼요."
          actionLabel="모집 공고 보기"
          onAction={() => router.back()}
        />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => String(item.applicationSubmissionId)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ApplicationCard application={item} />}
          ListFooterComponent={
            query.data?.hasNext ? (
              <Text style={styles.footerText}>
                더 많은 지원 내역은 다음 페이지 연동에서 이어집니다
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function ApplicationCard({
  application,
}: {
  application: ApplicationSubmissionItem;
}) {
  const cancelMutation = useCancelApplicationSubmissionMutation();
  const finalizeMutation = useFinalizeApplicationSubmissionMutation();
  const canCancel = application.status === "PENDING";
  const canFinalize = application.status === "BAND_ACCEPTED";
  const isPending = cancelMutation.isPending || finalizeMutation.isPending;

  const cancel = () => {
    Alert.alert("지원 취소", "이 지원을 취소할까요?", [
      { text: "아니요", style: "cancel" },
      {
        text: "취소하기",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await cancelMutation.mutateAsync(application.applicationSubmissionId);
            } catch {
              Alert.alert("지원 취소", "지원을 취소하지 못했어요.");
            }
          })();
        },
      },
    ]);
  };

  const finalize = () => {
    Alert.alert("참여 확정", "이 밴드 참여를 확정할까요?", [
      { text: "아니요", style: "cancel" },
      {
        text: "확정",
        onPress: () => {
          void (async () => {
            try {
              await finalizeMutation.mutateAsync({
                applySubmissionId: application.applicationSubmissionId,
                body: { isAccepted: true },
              });
            } catch {
              Alert.alert("참여 확정", "참여 확정에 실패했어요.");
            }
          })();
        },
      },
    ]);
  };

  return (
    <AppCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Badge label={STATUS_LABEL[application.status] ?? application.status} tone="yellow" />
        {application.checkedAt ? <Badge label="열람됨" /> : null}
      </View>

      <Text style={styles.title}>{application.recruitmentTitle}</Text>
      <Text style={styles.meta}>
        {application.bandName} · {formatAppliedAgo(application.appliedAgo)}
      </Text>

      {canCancel || canFinalize ? (
        <View style={styles.actions}>
          {canFinalize ? (
            <AppButton
              label="확정하기"
              loading={isPending}
              style={styles.actionButton}
              onPress={finalize}
            />
          ) : null}
          {canCancel ? (
            <AppButton
              label="지원 취소"
              variant="secondary"
              loading={isPending}
              style={styles.actionButton}
              onPress={cancel}
            />
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 12,
    paddingVertical: spacing.md,
    textAlign: "center",
  },
});
