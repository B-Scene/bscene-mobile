import { router } from "expo-router";
import { useState, type ReactElement } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  useInterestedRecruitmentsQuery,
  useRecentlyViewedRecruitmentsQuery,
  type SessionRecruitmentHistoryItem,
} from "@/features/session/history/sessionHistoryApi";
import {
  useApplicationSubmissionsQuery,
  useCancelApplicationSubmissionMutation,
  useFinalizeApplicationSubmissionMutation,
} from "@/hooks/api/session/useSessionApplication";
import { useCreateChatRoomMutation } from "@/hooks/api/session/useSessionChat";
import {
  useAddSessionRecruitmentInterest,
  useRemoveSessionRecruitmentInterest,
} from "@/hooks/api/session/useSessionRecruitment";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import type { ApplicationSubmissionItem } from "@/types/session/sessionApplication";

type HistoryTab = "application" | "scrap" | "recent";
type StatusTone = "completed" | "accepted" | "rejected" | "canceled";

const HISTORY_SIZE = 20;
const SOFT_YELLOW = "#FFF6E5";
const PAGE_BACKGROUND = colors.neutral100;

const HISTORY_TABS: { id: HistoryTab; label: string }[] = [
  { id: "application", label: "지원" },
  { id: "scrap", label: "스크랩" },
  { id: "recent", label: "최근 본 글" },
];

const EMPTY_IMAGES = {
  application: {
    source: require("../../../assets/images/band/empty-application-history.png"),
    aspectRatio: 132 / 105,
  },
  scrap: {
    source: require("../../../assets/images/band/empty-scrap-history.png"),
    aspectRatio: 118 / 105,
  },
  recent: {
    source: require("../../../assets/images/band/empty-recent-history.png"),
    aspectRatio: 119 / 109,
  },
} satisfies Record<
  HistoryTab,
  { source: ImageSourcePropType; aspectRatio: number }
>;

const STATUS_STYLE: Record<string, { label: string; tone: StatusTone }> = {
  PENDING: { label: "지원 완료", tone: "completed" },
  "지원 완료": { label: "지원 완료", tone: "completed" },
  BAND_ACCEPTED: { label: "지원 수락", tone: "accepted" },
  "지원 수락": { label: "지원 수락", tone: "accepted" },
  ACCEPTED: { label: "참여 확정", tone: "accepted" },
  REJECTED: { label: "지원 거절", tone: "rejected" },
  "지원 거절": { label: "지원 거절", tone: "rejected" },
  CANCELED: { label: "지원 취소", tone: "canceled" },
  CANCELLED: { label: "지원 취소", tone: "canceled" },
  "지원 취소": { label: "지원 취소", tone: "canceled" },
};

const formatAppliedAgo = (value: number) =>
  value <= 0 ? "오늘 지원" : `${value}일 전 지원`;

const formatViewedAt = (checkedAt: string | null) => {
  if (!checkedAt) return null;

  const date = new Date(checkedAt);

  return Number.isNaN(date.getTime())
    ? "열람"
    : `${date.getMonth() + 1}월 ${date.getDate()}일 열람`;
};

const formatDeadline = (dDay: number) => {
  if (dDay < 0) return "마감";
  if (dDay === 0) return "오늘 마감";
  return `D-${dDay}`;
};

const canFinalizeStatus = (status: string) =>
  status === "BAND_ACCEPTED" || status === "지원 수락";

const isCompletedStatus = (status: string) =>
  STATUS_STYLE[status]?.tone === "completed";

export function BandSessionApplicationsScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("application");
  const [finalizeTarget, setFinalizeTarget] =
    useState<ApplicationSubmissionItem | null>(null);
  const applicationsQuery = useApplicationSubmissionsQuery({
    size: HISTORY_SIZE,
  });
  const scrapQuery = useInterestedRecruitmentsQuery(HISTORY_SIZE);
  const recentQuery = useRecentlyViewedRecruitmentsQuery(HISTORY_SIZE);
  const cancelMutation = useCancelApplicationSubmissionMutation();
  const finalizeMutation = useFinalizeApplicationSubmissionMutation();
  const createChatMutation = useCreateChatRoomMutation();
  const addInterestMutation = useAddSessionRecruitmentInterest();
  const removeInterestMutation = useRemoveSessionRecruitmentInterest();
  const isActionPending = cancelMutation.isPending || finalizeMutation.isPending;

  const openChat = async (application: ApplicationSubmissionItem) => {
    if (createChatMutation.isPending) return;

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

  const cancelApplication = (application: ApplicationSubmissionItem) => {
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

  const decideFinalize = async (isAccepted: boolean) => {
    if (!finalizeTarget || finalizeMutation.isPending) return;

    try {
      await finalizeMutation.mutateAsync({
        applySubmissionId: finalizeTarget.applicationSubmissionId,
        body: { isAccepted },
      });
      setFinalizeTarget(null);
    } catch (error) {
      Alert.alert(
        "지원 확정",
        getApiErrorMessage(
          error,
          isAccepted
            ? "최종 확정에 실패했어요. 잠시 후 다시 시도해주세요."
            : "거절 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const toggleBookmark = async (item: SessionRecruitmentHistoryItem) => {
    try {
      if (item.isInterested) {
        await removeInterestMutation.mutateAsync(item.sessionRecruitmentId);
      } else {
        await addInterestMutation.mutateAsync(item.sessionRecruitmentId);
      }

      void scrapQuery.refetch();
      void recentQuery.refetch();
    } catch (error) {
      Alert.alert(
        "스크랩",
        getApiErrorMessage(
          error,
          "스크랩 변경에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const renderRecruitment = (item: SessionRecruitmentHistoryItem) => (
    <RecruitmentCard
      recruitment={item}
      onToggleBookmark={() => void toggleBookmark(item)}
      onOpen={() =>
        router.push(
          `/band/session/recruitments/${item.sessionRecruitmentId}` as Parameters<
            typeof router.push
          >[0],
        )
      }
    />
  );

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader
        title="지원 내역"
        style={styles.header}
        rightContent={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지원 내역 닫기"
            hitSlop={8}
            onPress={() => router.back()}
          >
            <AppIcon name="closeHeader" size={24} />
          </Pressable>
        }
      />

      <View style={styles.tabs}>
        {HISTORY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={styles.tab}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[styles.tabText, isActive && styles.tabTextActive]}
              >
                {tab.label}
              </Text>
              {isActive ? <View style={styles.tabIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>

      {activeTab === "application" ? (
        <HistoryList
          tab="application"
          query={applicationsQuery}
          items={applicationsQuery.data?.content ?? []}
          loadingText="지원 내역을 불러오고 있어요"
          errorText="지원 내역을 불러오지 못했어요"
          emptyTitle="지원한 내역이 없어요"
          emptyDescription={"마음에 드는 공고를 찾아\n지원해보세요"}
          keyOf={(item) => String(item.applicationSubmissionId)}
          renderCard={(item) => (
            <ApplicationCard
              application={item}
              actionDisabled={isActionPending}
              chatDisabled={createChatMutation.isPending}
              onChat={() => void openChat(item)}
              onCancel={() => cancelApplication(item)}
              onFinalize={() => setFinalizeTarget(item)}
            />
          )}
        />
      ) : null}

      {activeTab === "scrap" ? (
        <HistoryList
          tab="scrap"
          query={scrapQuery}
          items={scrapQuery.data?.content ?? []}
          loadingText="스크랩한 공고를 불러오고 있어요"
          errorText="스크랩한 공고를 불러오지 못했어요"
          emptyTitle="스크랩한 공고가 없어요"
          emptyDescription={
            "마음에 드는 공고를\n스크랩해보세요\n여기서 모아 볼 수 있어요"
          }
          keyOf={(item) => String(item.sessionRecruitmentId)}
          renderCard={renderRecruitment}
        />
      ) : null}

      {activeTab === "recent" ? (
        <HistoryList
          tab="recent"
          query={recentQuery}
          items={recentQuery.data?.content ?? []}
          loadingText="최근 본 공고를 불러오고 있어요"
          errorText="최근 본 공고를 불러오지 못했어요"
          emptyTitle="최근 본 공고가 없어요"
          emptyDescription={"모집공고 탭에서 본 공고가\n여기에 표시돼요"}
          keyOf={(item) => String(item.sessionRecruitmentId)}
          renderCard={renderRecruitment}
        />
      ) : null}

      <ConfirmModal
        open={finalizeTarget !== null}
        tone="orange"
        title="세션 지원을 최종 확정할까요?"
        description={`${finalizeTarget?.bandName ?? ""}의 '${
          finalizeTarget?.recruitmentTitle ?? ""
        }'\n지원을 확정하면 밴드 멤버로 등록돼요`}
        cancelLabel="거절"
        confirmLabel="수락"
        confirmDisabled={finalizeMutation.isPending}
        onCancel={() => void decideFinalize(false)}
        onConfirm={() => void decideFinalize(true)}
        onBackdropPress={() => setFinalizeTarget(null)}
      />
    </Screen>
  );
}

function HistoryList<T>({
  tab,
  query,
  items,
  loadingText,
  errorText,
  emptyTitle,
  emptyDescription,
  keyOf,
  renderCard,
}: {
  tab: HistoryTab;
  query: { isLoading: boolean; isError: boolean; refetch: () => unknown };
  items: T[];
  loadingText: string;
  errorText: string;
  emptyTitle: string;
  emptyDescription: string;
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactElement;
}) {
  if (query.isLoading) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>{loadingText}</Text>
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>{errorText}</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.retryButton}
          onPress={() => void query.refetch()}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    const image = EMPTY_IMAGES[tab];

    return (
      <View style={styles.empty}>
        <Image
          source={image.source}
          resizeMode="contain"
          style={[styles.emptyImage, { aspectRatio: image.aspectRatio }]}
        />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDescription}>{emptyDescription}</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.emptyButton}
          onPress={() => router.back()}
        >
          <Text style={styles.emptyButtonText}>공고 보러가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={keyOf}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => renderCard(item)}
    />
  );
}

function ApplicationCard({
  application,
  actionDisabled,
  chatDisabled,
  onChat,
  onCancel,
  onFinalize,
}: {
  application: ApplicationSubmissionItem;
  actionDisabled: boolean;
  chatDisabled: boolean;
  onChat: () => void;
  onCancel: () => void;
  onFinalize: () => void;
}) {
  const status = STATUS_STYLE[application.status] ?? {
    label: application.status,
    tone: "rejected" as const,
  };
  const isCompleted = isCompletedStatus(application.status);
  const canFinalize = canFinalizeStatus(application.status);
  const canMessage = status.tone === "completed" || status.tone === "accepted";
  const viewedAt = formatViewedAt(application.checkedAt);

  return (
    <View style={[styles.card, styles.applicationCard]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            status.tone === "completed" && styles.statusCompleted,
            status.tone === "accepted" && styles.statusAccepted,
            status.tone === "rejected" && styles.statusRejected,
            status.tone === "canceled" && styles.statusCanceled,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              status.tone === "completed" && styles.statusTextCompleted,
              status.tone === "accepted" && styles.statusTextAccepted,
              status.tone === "rejected" && styles.statusTextRejected,
              status.tone === "canceled" && styles.statusTextCanceled,
            ]}
          >
            {status.label}
          </Text>
        </View>

        {viewedAt ? <Text style={styles.viewedAt}>{viewedAt}</Text> : null}
      </View>

      <View style={styles.mainRow}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {application.recruitmentTitle}
          </Text>
          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={styles.metaText}>
              {application.bandName}
            </Text>
            <View style={styles.metaDivider} />
            <Text style={styles.metaAccent}>
              {formatAppliedAgo(application.appliedAgo)}
            </Text>
          </View>
        </View>

        {canMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${application.bandName}에게 채팅하기`}
            disabled={chatDisabled}
            style={styles.messageButton}
            onPress={onChat}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 4.75h14A1.25 1.25 0 0 1 20.25 6v9A1.25 1.25 0 0 1 19 16.25h-1.5v3.25l-4.3-3.25H5A1.25 1.25 0 0 1 3.75 15V6A1.25 1.25 0 0 1 5 4.75Z"
                stroke={colors.neutral800}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <Path
                d="M7.5 9h9M7.5 12h6"
                stroke={colors.neutral800}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.messageText}>채팅하기</Text>
          </Pressable>
        ) : null}
      </View>

      {isCompleted || canFinalize ? (
        <View style={styles.actions}>
          {isCompleted ? (
            <Pressable
              accessibilityRole="button"
              style={[styles.actionButton, styles.viewButton]}
              onPress={() =>
                router.push(
                  `/band/session/find/${application.sessionApplicationId}` as Parameters<
                    typeof router.push
                  >[0],
                )
              }
            >
              <Text style={styles.actionText}>지원서 보기</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={actionDisabled}
              style={[styles.actionButton, styles.finalizeButton]}
              onPress={onFinalize}
            >
              <Text style={styles.finalizeText}>확정하기</Text>
            </Pressable>
          )}

          {isCompleted ? (
            <Pressable
              accessibilityRole="button"
              disabled={actionDisabled}
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.actionText}>지원 취소</Text>
            </Pressable>
          ) : (
            <View style={styles.actionButton} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function RecruitmentCard({
  recruitment,
  onToggleBookmark,
  onOpen,
}: {
  recruitment: SessionRecruitmentHistoryItem;
  onToggleBookmark: () => void;
  onOpen: () => void;
}) {
  const starColor = recruitment.isInterested
    ? colors.secondary500
    : colors.neutral400;

  return (
    <View style={[styles.card, styles.recruitmentCard]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            recruitment.isClosed ? styles.statusRejected : styles.deadlineOpen,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              recruitment.isClosed
                ? styles.statusTextRejected
                : styles.statusTextAccepted,
            ]}
          >
            {formatDeadline(recruitment.dDay)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            recruitment.isInterested ? "스크랩 취소" : "스크랩"
          }
          accessibilityState={{ selected: recruitment.isInterested }}
          hitSlop={8}
          onPress={onToggleBookmark}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="m12 3.75 2.45 4.97 5.49.8-3.97 3.87.94 5.47L12 16.28l-4.91 2.58.94-5.47-3.97-3.87 5.49-.8L12 3.75Z"
              fill={recruitment.isInterested ? starColor : "none"}
              stroke={starColor}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        style={styles.recruitmentBody}
        onPress={onOpen}
      >
        <Text numberOfLines={1} style={styles.title}>
          {recruitment.recruitmentTitle}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={[styles.metaText, styles.metaShrink]}>
            {`${recruitment.bandName} · ${recruitment.bandGenre} · ${recruitment.bandRegion}`}
          </Text>
          <View style={styles.metaDivider} />
          <Text style={styles.metaAccent}>
            {recruitment.postedAgo <= 0
              ? "오늘"
              : `${recruitment.postedAgo}일 전`}
          </Text>
        </View>

        <Text numberOfLines={2} style={styles.summary}>
          {recruitment.summary}
        </Text>

        <Text style={styles.partText}>
          {`${recruitment.part} · ${recruitment.skillLevel}`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: PAGE_BACKGROUND,
  },
  header: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  tabs: {
    height: 48,
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral300,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    ...textStyles.body1,
    color: colors.neutral400,
  },
  tabTextActive: {
    color: colors.secondary500,
  },
  tabIndicator: {
    position: "absolute",
    bottom: -2,
    width: 116,
    height: 2,
    backgroundColor: colors.secondary500,
  },
  list: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  stateText: {
    ...textStyles.caption2,
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
    ...textStyles.caption3,
    color: colors.white,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyImage: {
    height: 88,
  },
  emptyTitle: {
    ...textStyles.label1,
    marginTop: 16,
    color: colors.neutral900,
    textAlign: "center",
  },
  emptyDescription: {
    ...textStyles.caption1,
    marginTop: 8,
    color: colors.neutral600,
    textAlign: "center",
  },
  emptyButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.secondary500,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  emptyButtonText: {
    ...textStyles.body6,
    color: colors.white,
  },
  card: {
    ...shadows.card,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  applicationCard: {
    gap: 10,
    paddingVertical: 18,
  },
  recruitmentCard: {
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusBadge: {
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  statusText: {
    ...textStyles.caption3,
  },
  statusCompleted: {
    backgroundColor: SOFT_YELLOW,
  },
  statusAccepted: {
    backgroundColor: colors.secondary400,
  },
  statusRejected: {
    backgroundColor: colors.neutral300,
  },
  statusCanceled: {
    borderWidth: 1,
    borderColor: colors.neutral400,
    backgroundColor: colors.white,
  },
  deadlineOpen: {
    backgroundColor: colors.secondary500,
  },
  statusTextCompleted: {
    color: colors.secondary500,
  },
  statusTextAccepted: {
    color: colors.white,
  },
  statusTextRejected: {
    color: colors.neutral600,
  },
  statusTextCanceled: {
    color: colors.neutral400,
  },
  viewedAt: {
    ...textStyles.caption3,
    color: colors.neutral500,
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
    ...textStyles.label1,
    color: colors.neutral900,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  metaShrink: {
    flexShrink: 1,
  },
  metaDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 8,
    backgroundColor: colors.neutral400,
  },
  metaAccent: {
    ...textStyles.caption2,
    color: colors.secondary500,
  },
  messageButton: {
    width: 44,
    alignItems: "center",
  },
  messageText: {
    ...textStyles.caption4,
    marginTop: 2,
    color: colors.neutral800,
  },
  actions: {
    flexDirection: "row",
    gap: 18,
  },
  actionButton: {
    height: 30,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  viewButton: {
    backgroundColor: SOFT_YELLOW,
  },
  finalizeButton: {
    backgroundColor: colors.secondary500,
  },
  cancelButton: {
    backgroundColor: colors.neutral300,
  },
  actionText: {
    ...textStyles.caption3,
    color: colors.neutral600,
  },
  finalizeText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  recruitmentBody: {
    marginTop: 12,
  },
  summary: {
    ...textStyles.body3,
    marginTop: 12,
    color: colors.neutral800,
  },
  partText: {
    ...textStyles.caption2,
    marginTop: 8,
    color: colors.secondary500,
  },
});
