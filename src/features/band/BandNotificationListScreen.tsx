import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "react-native";

import type { BandMemberPart } from "@/api/band/bandManagement";
import {
  ActionNotificationCard,
  BandInviteCard,
  getBandInviteBandName,
  isSelectablePart,
  RoleCompleteModal,
  RoleInputModal,
} from "@/features/notification/BandNotificationCards";
import { NotificationList } from "@/features/notification/NotificationList";
import { useBandMemberProfileQuery } from "@/hooks/api/band/useBandManagement";
import { liveKeys, useRespondCoHostInvitationMutation } from "@/hooks/api/live/useLive";
import {
  notificationKeys,
  useMarkNotificationAsRead,
  useNotificationsInfiniteQuery,
  useRespondBandNotificationInvite,
} from "@/hooks/api/notification/useNotification";
import { useFinalizeApplicationSubmissionMutation } from "@/hooks/api/session/useSessionApplication";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { getNotificationDeepLink } from "@/shared/utils/notificationDeepLink";
import type { NotificationItem } from "@/types/notification";

import {
  getBandNotificationAction,
  isBandNotification,
  type NotificationAction,
} from "./notificationActions";

type PendingRoleAction = {
  item: NotificationItem;
  action: NotificationAction;
};

type CompletedRoleAction = {
  kind: "bandInvite" | "sessionFinalize";
  bandName: string;
};

export function BandNotificationListScreen() {
  const query = useNotificationsInfiniteQuery();
  const queryClient = useQueryClient();
  const read = useMarkNotificationAsRead();
  const bandInvite = useRespondBandNotificationInvite();
  const coHost = useRespondCoHostInvitationMutation();
  const finalize = useFinalizeApplicationSubmissionMutation();
  const { activeBand } = useActiveBandId();
  const activeProfile = useBandMemberProfileQuery(
    activeBand?.bandMemberProfileId ?? null,
  ).data;
  const [selected, setSelected] = useState<PendingRoleAction | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [completedRole, setCompletedRole] = useState<CompletedRoleAction | null>(null);
  const items = query.data?.pages.flatMap((page) => page.items).filter(isBandNotification) ?? [];

  const respond = async (
    item: NotificationItem,
    action: NotificationAction,
    accept: boolean,
    nickname = "",
    part?: BandMemberPart,
  ) => {
    if (inFlight.current || completedIds.includes(item.notificationId)) return;
    if (accept && action.kind !== "coHostInvite" && (!nickname.trim() || !part)) return;

    inFlight.current = true;
    setBusy(true);
    try {
      if (action.kind === "bandInvite") {
        await bandInvite.mutateAsync({
          bandId: action.targetId,
          profile: accept && part ? { nickname: nickname.trim(), part } : undefined,
        });
      } else if (action.kind === "coHostInvite") {
        await coHost.mutateAsync({ liveId: action.targetId, isAccepted: accept });
        void queryClient.invalidateQueries({ queryKey: liveKeys.all });
      } else {
        await finalize.mutateAsync({
          applySubmissionId: action.targetId,
          body: accept && part
            ? { isAccepted: true, nickname: nickname.trim(), part }
            : { isAccepted: false },
        });
      }

      setCompletedIds((current) => [...current, item.notificationId]);
      setSelected(null);
      try {
        await read.mutateAsync(item.notificationId);
      } catch {
        Alert.alert("처리는 완료됐어요", "읽음 상태를 저장하지 못했어요. 새로고침 후 확인해주세요.");
      }
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      void query.refetch();

      if (accept && action.kind !== "coHostInvite") {
        setCompletedRole({
          kind: action.kind,
          bandName: action.kind === "bandInvite" ? getBandInviteBandName(item) : "",
        });
      } else {
        Alert.alert("알림", accept ? "수락했어요." : "거절했어요.");
      }
    } catch (error) {
      Alert.alert("처리 실패", error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const openNotification = (item: NotificationItem) => {
    if (getBandNotificationAction(item) && !completedIds.includes(item.notificationId)) return;
    if (!item.isRead) {
      read.mutate(item.notificationId, {
        onError: () => Alert.alert("알림", "읽음 상태를 저장하지 못했어요."),
      });
    }
    const target = getNotificationDeepLink({ ...item }, "band");
    if (target && target.split(/[?#]/)[0] !== "/band/notifications") {
      router.push(target as Parameters<typeof router.push>[0]);
    }
  };

  const confirmReject = (item: NotificationItem, action: NotificationAction) => {
    if (inFlight.current) return;
    Alert.alert("거절", "이 요청을 거절할까요?", [
      { text: "취소", style: "cancel" },
      { text: "거절", style: "destructive", onPress: () => void respond(item, action, false) },
    ]);
  };

  const accept = (item: NotificationItem, action: NotificationAction) => {
    if (inFlight.current) return;
    if (action.kind === "coHostInvite") {
      Alert.alert("공동 진행 초대", "초대를 수락할까요?", [
        { text: "취소", style: "cancel" },
        { text: "수락", onPress: () => void respond(item, action, true) },
      ]);
    } else {
      setSelected({ item, action });
    }
  };

  const renderCard = (item: NotificationItem) => {
    const action = completedIds.includes(item.notificationId)
      ? null
      : getBandNotificationAction(item);

    if (item.type === "BAND_INVITE" && item.bandInvite) {
      return (
        <BandInviteCard
          notification={{ ...item, actionable: action?.kind === "bandInvite" }}
          disabled={busy}
          onPress={() => openNotification(item)}
          onReject={() => { if (action) confirmReject(item, action); }}
          onAccept={() => { if (action) accept(item, action); }}
        />
      );
    }
    if (!action) return null;

    return (
      <ActionNotificationCard
        notification={item}
        disabled={busy}
        onReject={() => confirmReject(item, action)}
        onAccept={() => accept(item, action)}
      />
    );
  };

  return (
    <NotificationList
      tone="band"
      query={query}
      notifications={items}
      onPressItem={openNotification}
      renderCard={renderCard}
      onBack={() => router.canGoBack() ? router.back() : router.replace("/band/home")}
    >
      <RoleInputModal
        open={selected !== null}
        initialActivityName={activeProfile?.nickname ?? ""}
        initialPart={isSelectablePart(activeProfile?.part) ? activeProfile.part : ""}
        submitting={busy}
        onClose={() => { if (!inFlight.current) setSelected(null); }}
        onConfirm={(nickname, part) => {
          if (selected) void respond(selected.item, selected.action, true, nickname, part);
        }}
      />
      <RoleCompleteModal
        open={completedRole !== null}
        kind={completedRole?.kind ?? "bandInvite"}
        bandName={completedRole?.bandName ?? ""}
        onClose={() => setCompletedRole(null)}
      />
    </NotificationList>
  );
}
