import type {
    AppMode,
} from "@/stores/useModeStore";

type NotificationData =
  Record<
    string,
    unknown
  >;

const toPositiveNumber = (
  value: unknown,
) => {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  ) && parsed > 0
    ? parsed
    : null;
};

const getString = (
  value: unknown,
) =>
  typeof value ===
  "string"
    ? value.trim()
    : "";

const normalizeExplicitPath =
  (value: string) => {
    if (!value) {
      return null;
    }

    if (
      value.startsWith(
        "/",
      )
    ) {
      return value;
    }

    const schemeMatch =
      value.match(
        /^bscenemobile:\/\/(.+)$/i,
      );

    if (
      schemeMatch?.[1]
    ) {
      return `/${schemeMatch[1]
        .replace(
          /^\/+/,
          "",
        )
        .split("?")[0]}`;
    }

    return null;
  };

export const getNotificationDeepLink =
  (
    data:
      | NotificationData
      | undefined,

    mode: AppMode,
  ) => {
    if (!data) {
      return null;
    }

    const explicit =
      normalizeExplicitPath(
        getString(
          data.deepLink ??
            data.deeplink ??
            data.path ??
            data.url,
        ),
      );

    if (explicit) {
      return explicit;
    }

    const type =
      getString(
        data.type ??
          data.referenceType ??
          data.notificationType,
      ).toUpperCase();

    const liveId =
      toPositiveNumber(
        data.liveId ??
          data.referenceId,
      );

    if (
      liveId &&
      type.includes(
        "LIVE",
      )
    ) {
      const requesterUserId =
        toPositiveNumber(
          data.coHostRequesterUserId ??
            data.requesterUserId ??
            data.userId,
        );

      const isInvite =
        type.includes(
          "CO_HOST_INVITE",
        ) ||
        type.includes(
          "COHOST_INVITE",
        );

      const query =
        requesterUserId
          ? `?requesterUserId=${requesterUserId}`
          : isInvite
            ? "?coHostInvite=1"
            : "";

      return `/${mode}/live/room/${liveId}${query}`;
    }

    const chatRoomId =
      toPositiveNumber(
        data.chatRoomId,
      );

    if (chatRoomId) {
      return `/band/session/messages/${chatRoomId}`;
    }

    const recruitmentId =
      toPositiveNumber(
        data.sessionRecruitmentId,
      );

    if (recruitmentId) {
      return `/band/session/recruitments/${recruitmentId}`;
    }

    return null;
  };