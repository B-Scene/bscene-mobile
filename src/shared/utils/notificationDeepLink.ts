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
      return `/${schemeMatch[1].replace(
        /^\/+/,
        "",
      )}`;
    }

    return null;
  };

const getReferenceId =
  (
    data: NotificationData,
    ...keys: string[]
  ) => {
    for (const key of keys) {
      const id =
        toPositiveNumber(
          data[key],
        );

      if (id) {
        return id;
      }
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
      getReferenceId(
        data,
        "liveId",
        "referenceId",
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
      getReferenceId(
        data,
        "chatRoomId",
        "roomId",
        "referenceId",
      );

    if (
      chatRoomId &&
      (
        type.includes(
          "CHAT",
        ) ||
        type.includes(
          "MESSAGE",
        ) ||
        type.includes(
          "DM",
        )
      )
    ) {
      return `/band/session/messages/${chatRoomId}`;
    }

    const recruitmentId =
      getReferenceId(
        data,
        "sessionRecruitmentId",
        "recruitmentId",
        "referenceId",
      );

    if (
      recruitmentId &&
      type.includes(
        "RECRUIT",
      )
    ) {
      return `/band/session/recruitments/${recruitmentId}`;
    }

    const applicationId =
      getReferenceId(
        data,
        "applicationSubmissionId",
        "applySubmissionId",
        "applicationId",
        "referenceId",
      );

    if (
      applicationId &&
      type.includes(
        "APPLICATION",
      )
    ) {
      return `/band/my/applications/${applicationId}`;
    }

    const performanceId =
      getReferenceId(
        data,
        "performanceId",
        "concertId",
        "referenceId",
      );

    if (
      performanceId &&
      (
        type.includes(
          "PERFORMANCE",
        ) ||
        type.includes(
          "CONCERT",
        )
      )
    ) {
      return mode === "fan"
        ? `/fan/home/concerts/${performanceId}`
        : `/band/home/concerts/${performanceId}`;
    }

    const postId =
      getReferenceId(
        data,
        "postId",
        "contentId",
        "newsId",
        "referenceId",
      );

    if (
      postId &&
      (
        type.includes(
          "POST",
        ) ||
        type.includes(
          "CONTENT",
        ) ||
        type.includes(
          "NEWS",
        )
      )
    ) {
      return mode === "fan"
        ? `/fan/explore/contents/${postId}`
        : `/band/home/contents/${postId}`;
    }

    const bandId =
      getReferenceId(
        data,
        "bandId",
        "referenceId",
      );

    if (
      bandId &&
      type.includes(
        "BAND",
      )
    ) {
      return mode === "fan"
        ? `/fan/bands/${bandId}`
        : "/band/home";
    }

    return null;
  };
