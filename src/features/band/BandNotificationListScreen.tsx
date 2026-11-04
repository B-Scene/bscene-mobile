import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import type { BandMemberPart } from "@/api/band/bandManagement";
import {
  ActionNotificationCard,
  BandInviteCard,
  getBandInviteBandId,
  getBandInviteBandName,
  isSelectablePart,
  RoleCompleteModal,
  RoleInputModal,
} from "@/features/notification/BandNotificationCards";
import {
  isBandNotification,
  NotificationList,
} from "@/features/notification/NotificationList";
import {
  useAcceptBandInviteMutation,
  useBandMemberProfileQuery,
  useRejectBandInviteMutation,
} from "@/hooks/api/band/useBandManagement";
import { useRespondCoHostInvitationMutation } from "@/hooks/api/live/useLive";
import {
  useMarkNotificationAsRead,
  useNotificationsInfiniteQuery,
} from "@/hooks/api/notification/useNotification";
import { useFinalizeApplicationSubmissionMutation } from "@/hooks/api/session/useSessionApplication";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationItem } from "@/types/notification";

type RoleActionKind = "bandInvite" | "sessionFinalize";

type PendingRoleAction = {
  kind: RoleActionKind;
  notification: NotificationItem;
};

const isCoHostInviteType = (type: string) =>
  (type.includes("CO_HOST") || type.includes("COHOST")) &&
  (type.includes("INVITE") || type.includes("INVITATION"));

const isCoHostInviteNotification = (notification: NotificationItem) => {
  const type = notification.type.toUpperCase();

  if (isCoHostInviteType(type)) return true;
  if (type !== "LIVE") return false;

  const content = `${notification.title} ${notification.body}`
    .trim()
    .toUpperCase();
  const hasCoHostKeyword =
    content.includes("CO_HOST") ||
    content.includes("COHOST") ||
    content.includes("공동 진행") ||
    content.includes("공동 송출");
  const hasInviteKeyword =
    content.includes("INVITE") ||
    content.includes("INVITATION") ||
    content.includes("초대");

  return hasCoHostKeyword && hasInviteKeyword;
};

const getLiveIdFromDeepLink = (deepLink?: string | null) => {
  if (!deepLink) return null;

  const queryLiveId = deepLink.match(
    /[?&](?:coHostInviteLiveId|coHostInvitationLiveId|liveId|referenceId)=(\d+)/,
  )?.[1];

  return queryLiveId ?? deepLink.match(/\/lives?\/(\d+)(?=[/?#]|$)/i)?.[1] ?? null;
};

const getCoHostInviteLiveId = (notification: NotificationItem) => {
  const liveId = Number(
    getLiveIdFromDeepLink(notification.deepLink) ?? notification.referenceId,
  );

  return Number.isFinite(liveId) && liveId > 0 ? liveId : null;
};

const isSessionAcceptedNotification = (notification: NotificationItem) =>
  notification.type === "SESSION" &&
  notification.title === "세션 지원이 수락되었어요";

const getSubmissionId = (notification: NotificationItem) => {
  const submissionId = Number(notification.referenceId);

  return notification.referenceId != null && Number.isFinite(submissionId)
    ? submissionId
    : null;
};

export function BandNotificationListScreen() {
  const query = useNotificationsInfiniteQuery();
  const markAsReadMutation = useMarkNotificationAsRead();
  const acceptInvite = useAcceptBandInviteMutation();
  const rejectInvite = useRejectBandInviteMutation();
  const finalizeApplication = useFinalizeApplicationSubmissionMutation();
  const respondCoHostInvitation = useRespondCoHostInvitationMutation();
  const { activeBand } = useActiveBandId();
  const activeProfile = useBandMemberProfileQuery(
    activeBand?.bandMemberProfileId ?? null,
  ).data;
  const [pendingRoleAction, setPendingRoleAction] =
    useState<PendingRoleAction | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [completed, setCompleted] = useState<{
    kind: RoleActionKind;
    bandName: string;
  } | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const notifications =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter(isBandNotification) ?? [];
  const isActionPending =
    acceptInvite.isPending ||
    rejectInvite.isPending ||
    finalizeApplication.isPending ||
    respondCoHostInvitation.isPending;

  const markAsRead = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.notificationId);
    }
  };

  const openNotification = (notification: NotificationItem) => {
    markAsRead(notification);

    const targetPath = getNotificationDeepLink({ ...notification }, "band");

    if (!targetPath) return;

    if (/^https?:\/\//i.test(targetPath)) {
      Alert.alert("알림", "앱에서 열 수 없는 외부 링크예요.");
      return;
    }

    router.push(targetPath as Parameters<typeof router.push>[0]);
  };

  const openRoleModal = (action: PendingRoleAction) => {
    markAsRead(action.notification);
    setPendingRoleAction(action);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setPendingRoleAction(null);
  };

  const rejectBandInvite = async (notification: NotificationItem) => {
    const bandId = getBandInviteBandId(notification);

    if (bandId == null) return;

    markAsRead(notification);

    try {
      await rejectInvite.mutateAsync({ bandId });
      void query.refetch();
    } catch (error) {
      Alert.alert(
        "알림",
        getApiErrorMessage(
          error,
          "거절 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const rejectCoHostInvite = async (notification: NotificationItem) => {
    const liveId = getCoHostInviteLiveId(notification);

    if (liveId == null) return;

    markAsRead(notification);

    try {
      await respondCoHostInvitation.mutateAsync({ liveId, isAccepted: false });
      void query.refetch();
    } catch (error) {
      Alert.alert(
        "알림",
        getApiErrorMessage(
          error,
          "거절 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const acceptCoHostInvite = (notification: NotificationItem) => {
    const liveId = getCoHostInviteLiveId(notification);

    markAsRead(notification);

    if (liveId == null) return;

    router.push(
      `/band/live/room/${liveId}?coHostInvite=accept` as Parameters<
        typeof router.push
      >[0],
    );
  };

  const rejectSessionApplication = async (notification: NotificationItem) => {
    const applySubmissionId = getSubmissionId(notification);

    if (applySubmissionId == null) return;

    markAsRead(notification);

    try {
      await finalizeApplication.mutateAsync({
        applySubmissionId,
        body: { isAccepted: false },
      });
      void query.refetch();
    } catch (error) {
      Alert.alert(
        "알림",
        getApiErrorMessage(
          error,
          "거절 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
    }
  };

  const confirmRole = async (nickname: string, part: BandMemberPart) => {
    const action = pendingRoleAction;

    if (!action) return;

    const { kind, notification } = action;

    try {
      if (kind === "bandInvite") {
        const bandId = getBandInviteBandId(notification);

        if (bandId == null) return;

        await acceptInvite.mutateAsync({ bandId, body: { nickname, part } });
      } else {
        const applySubmissionId = getSubmissionId(notification);

        if (applySubmissionId == null) return;

        await finalizeApplication.mutateAsync({
          applySubmissionId,
          body: { isAccepted: true, nickname, part },
        });
      }
    } catch (error) {
      Alert.alert(
        "알림",
        getApiErrorMessage(
          error,
          kind === "bandInvite"
            ? "초대 수락에 실패했어요. 잠시 후 다시 시도해주세요."
            : "최종 확정에 실패했어요. 잠시 후 다시 시도해주세요.",
        ),
      );
      return;
    }

    void query.refetch();
    closeRoleModal();
    setCompleted({
      kind,
      bandName: kind === "bandInvite" ? getBandInviteBandName(notification) : "",
    });
    setIsCompleteModalOpen(true);
  };

  const renderCard = (notification: NotificationItem) => {
    if (notification.type === "BAND_INVITE" && notification.bandInvite) {
      return (
        <BandInviteCard
          notification={notification}
          disabled={isActionPending}
          onPress={() => openNotification(notification)}
          onReject={() => void rejectBandInvite(notification)}
          onAccept={() => openRoleModal({ kind: "bandInvite", notification })}
        />
      );
    }

    if (isCoHostInviteNotification(notification)) {
      return (
        <ActionNotificationCard
          notification={notification}
          disabled={isActionPending}
          onReject={() => void rejectCoHostInvite(notification)}
          onAccept={() => acceptCoHostInvite(notification)}
        />
      );
    }

    if (isSessionAcceptedNotification(notification)) {
      return (
        <ActionNotificationCard
          notification={notification}
          disabled={isActionPending}
          onReject={() => void rejectSessionApplication(notification)}
          onAccept={() =>
            openRoleModal({ kind: "sessionFinalize", notification })
          }
        />
      );
    }

    return null;
  };

  return (
    <NotificationList
      tone="band"
      query={query}
      notifications={notifications}
      onPressItem={openNotification}
      renderCard={renderCard}
    >
      <RoleInputModal
        open={isRoleModalOpen}
        initialActivityName={activeProfile?.nickname ?? ""}
        initialPart={
          isSelectablePart(activeProfile?.part) ? activeProfile.part : ""
        }
        submitting={isActionPending}
        onClose={closeRoleModal}
        onConfirm={(nickname, part) => void confirmRole(nickname, part)}
      />

      <RoleCompleteModal
        open={isCompleteModalOpen}
        kind={completed?.kind ?? "bandInvite"}
        bandName={completed?.bandName ?? ""}
        onClose={() => setIsCompleteModalOpen(false)}
      />
    </NotificationList>
  );
}
