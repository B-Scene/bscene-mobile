import type { NotificationItem } from "@/types/notification";

export type NotificationAction =
  | { kind: "bandInvite"; targetId: number }
  | { kind: "sessionFinalize"; targetId: number }
  | { kind: "coHostInvite"; targetId: number };

export const getBandNotificationAction = (item: NotificationItem): NotificationAction | null => {
  if (item.type === "BAND_INVITE" && item.actionable && item.bandInvite?.bandId) {
    return { kind: "bandInvite", targetId: item.bandInvite.bandId };
  }
  const id = Number(item.referenceId);
  if (!Number.isSafeInteger(id) || id <= 0 || item.isRead) return null;
  if (item.type === "SESSION" && item.title === "세션 지원이 수락되었어요") {
    return { kind: "sessionFinalize", targetId: id };
  }
  const type = item.type.toUpperCase();
  const explicitInvite = /CO_?HOST/.test(type) && /INVIT(E|ATION)/.test(type);
  if (explicitInvite || (type === "LIVE" && item.title === "공동 진행자로 초대됐어요")) {
    return { kind: "coHostInvite", targetId: id };
  }
  return null;
};

export const isBandNotification = (item: NotificationItem) => {
  if (item.mode) return item.mode === "BAND";
  if (item.deepLink?.startsWith("/fan/") || item.deepLink?.startsWith("bscenemobile://fan/")) return false;
  return !/^(POST|PERFORMANCE|CONCERT)$/.test(item.type.toUpperCase());
};
