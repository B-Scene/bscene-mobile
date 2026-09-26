import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useApplicationSubmissionsQuery,
  useCancelApplicationSubmissionMutation,
  useFinalizeApplicationSubmissionMutation,
} from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import type { ApplicationSubmissionItem } from "@/types/session/sessionApplication";

const STATUS_STYLE: Record<
  string,
  {
    label: string;
    tone: "completed" | "accepted" | "rejected" | "canceled";
  }
> = {
  PENDING: {
    label: "지원 완료",
    tone: "completed",
  },
  BAND_ACCEPTED: {
    label: "지원 수락",
    tone: "accepted",
  },
  ACCEPTED: {
    label: "참여 확정",
    tone: "accepted",
  },
  REJECTED: {
    label: "지원 거절",
    tone: "rejected",
  },
  CANCELED: {
    label: "지원 취소",
    tone: "canceled",
  },
};

const formatAppliedAgo = (value: number) => {
  if (value <= 0) {
    return "방금 전 지원";
  }

  if (value < 24) {
    return `${value}시간 전 지원`;
  }

  return `${Math.floor(value / 24)}일 전 지원`;
};

export function BandSessionApplicationsScreen() {
  const query = useApplicationSubmissionsQuery({
    size: 20,
  });

  const applications = query.data?.content ?? [];

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <AppHeader title="지원 내역" />

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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  const createChatMutation = useCreateChatRoomMutation();

  const canCancel = application.status === "PENDING";
  const canFinalize = application.status === "BAND_ACCEPTED";
  const isPending = cancelMutation.isPending || finalizeMutation.isPending;
  const status = STATUS_STYLE[application.status] ?? {
    label: application.status,
    tone: "rejected" as const,
  };

  const openChat = async () => {
    if (createChatMutation.isPending) {
      return;
    }

    try {
      const room = await createChatMutation.mutateAsync({
        contextType: "RECRUITMENT",
        sessionRecruitmentId: application.sessionRecruitmentId,
      });

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

  const cancel = () => {
    Alert.alert("지원 취소", "이 지원을 취소할까요?", [
      {
        text: "아니요",
        style: "cancel",
      },
      {
        text: "취소하기",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await cancelMutation.mutateAsync(
                application.applicationSubmissionId,
              );
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
      {
        text: "아니요",
        style: "cancel",
      },
      {
        text: "확정",
        onPress: () => {
          void (async () => {
            try {
              await finalizeMutation.mutateAsync({
                applySubmissionId: application.applicationSubmissionId,
                body: {
                  isAccepted: true,
                },
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.statusBadge,
            status.tone === "completed" && styles.statusCompleted,
            status.tone === "accepted" && styles.statusAccepted,
            status.tone === "rejected" && styles.statusRejected,
            status.tone === "canceled" && styles.statusCanceled,
          ]}
        >
          {status.label}
        </Text>

        {application.checkedAt ? (
          <Text style={styles.checkedText}>열람됨</Text>
        ) : null}
      </View>

      <View style={styles.mainRow}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {application.recruitmentTitle}
          </Text>
          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={styles.bandName}>
              {application.bandName}
            </Text>
            <View style={styles.metaDivider} />
            <Text style={styles.appliedAgo}>
              {formatAppliedAgo(application.appliedAgo)}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={createChatMutation.isPending}
          style={styles.messageButton}
          onPress={() => void openChat()}
        >
          <MessageSquare size={24} color={colors.neutral800} />
          <Text style={styles.messageText}>
            {createChatMutation.isPending ? "생성 중" : "채팅하기"}
          </Text>
        </Pressable>
      </View>

      {canCancel || canFinalize ? (
        <View style={styles.actions}>
          {canFinalize ? (
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              style={styles.confirmButton}
              onPress={finalize}
            >
              <Text style={styles.confirmButtonText}>
                {isPending ? "처리 중" : "확정하기"}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.actionPlaceholder} />
          )}

          {canCancel ? (
            <Pressable
              accessibilityRole="button"
              disabled={isPending}
              style={styles.cancelButton}
              onPress={cancel}
            >
              <Text style={styles.cancelButtonText}>
                {isPending ? "처리 중" : "지원 취소"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 14,
  },
  card: {
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 18,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusBadge: {
    minHeight: 22,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  statusCompleted: {
    backgroundColor: colors.secondary100,
    color: colors.secondary500,
  },
  statusAccepted: {
    backgroundColor: colors.secondary400,
    color: colors.white,
  },
  statusRejected: {
    backgroundColor: colors.neutral300,
    color: colors.neutral600,
  },
  statusCanceled: {
    borderWidth: 1,
    borderColor: colors.neutral400,
    backgroundColor: colors.white,
    color: colors.neutral400,
  },
  checkedText: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  mainRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  bandName: {
    maxWidth: "45%",
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.neutral400,
    marginHorizontal: 8,
  },
  appliedAgo: {
    color: colors.secondary500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  messageButton: {
    width: 52,
    alignItems: "center",
  },
  messageText: {
    color: colors.neutral800,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 18,
  },
  actionPlaceholder: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  cancelButton: {
    flex: 1,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.neutral300,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  footerText: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    paddingVertical: 16,
    textAlign: "center",
  },
});
