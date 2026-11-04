import {
    AxiosError,
    type AxiosResponse,
} from "axios";

import {
    fetch as expoFetch,
} from "expo/fetch";

import {
    axiosInstance,
} from "@/api/axiosInstance";

import {
    config,
} from "@/shared/constants/config";

import {
    secureTokenStorage,
} from "@/shared/utils/secureTokenStorage";

import type {
    CloseLiveResponse,
    CreateLiveRequest,
    CreateLiveResponse,
    EnterLiveResponse,
    LiveApiResponse,
    LiveChatTicketResponse,
    LiveCoHostRequester,
    LiveCoPublisher,
    LiveHomeResponse,
    LiveNowListFilter,
    LiveNowListResponse,
    LiveReservationResponse,
    ReplayListFilter,
    ReplayListResponse,
    ReplayPlaybackResponse,
    ReplaySort,
    ScheduledLiveListResponse,
    ToggleLiveAlarmResponse,
    UpdateLiveReservationRequest,
    UpdateLiveReservationResponse,
} from "@/types/live/live";

type RawRecord =
  Record<string, unknown>;

const assertSuccess = <T>(
  response: AxiosResponse<
    LiveApiResponse<T>
  >,
) => {
  const { data } =
    response;

  if (
    !data.isSuccess ||
    data.result == null
  ) {
    throw new AxiosError(
      data.message,
      data.code,
      response.config,
      response.request,
      response,
    );
  }

  return data.result;
};

const assertNullableSuccess =
  <T>(
    response: AxiosResponse<
      LiveApiResponse<T>
    >,
  ) => {
    const { data } =
      response;

    if (!data.isSuccess) {
      throw new AxiosError(
        data.message,
        data.code,
        response.config,
        response.request,
        response,
      );
    }

    return data.result;
  };

const isRecord =
  (
    value: unknown,
  ): value is RawRecord =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);

const toNumberOrNull =
  (
    value: unknown,
  ) => {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (typeof value === "string") {
      const parsed =
        Number(value);

      return Number.isFinite(parsed)
        ? parsed
        : null;
    }

    return null;
  };

const getPaginatedItems =
  <T>(
    result: unknown,
  ): T[] => {
    if (Array.isArray(result)) {
      return result as T[];
    }

    if (!isRecord(result)) {
      return [];
    }

    const source =
      result.items ??
      result.content ??
      result.data ??
      result.list ??
      result.lives ??
      result.replays ??
      result.scheduled;

    return Array.isArray(source)
      ? source as T[]
      : [];
  };

const getPageInfo =
  (
    result: unknown,
  ) => {
    if (!isRecord(result)) {
      return {
        nextCursor:
          null,
        hasNext:
          false,
      };
    }

    return {
      nextCursor:
        toNumberOrNull(
          result.nextCursor ??
            result.nextPage ??
            result.cursor,
        ),
      hasNext:
        typeof result.hasNext === "boolean"
          ? result.hasNext
          : typeof result.last === "boolean"
            ? !result.last
            : false,
    };
  };

export const getLiveHome =
  async () => {
    const response =
      await axiosInstance.get<
        LiveApiResponse<
          Partial<LiveHomeResponse>
        >
      >(
        "/lives/home",
      );

    const result =
      assertSuccess(
        response,
      );

    return {
      liveNow:
        result.liveNow ??
        [],

      replays:
        result.replays ??
        [],

      scheduled:
        result.scheduled ??
        [],

      myNickname:
        result.myNickname ??
        null,

      myProfileImageUrl:
        result.myProfileImageUrl ??
        null,
    } satisfies LiveHomeResponse;
  };

export const createLive =
  async (
    body: CreateLiveRequest,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<CreateLiveResponse>
      >(
        "/lives",
        body,
      );

    return assertSuccess(
      response,
    );
  };

export const getLiveReservation =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.get<
        LiveApiResponse<LiveReservationResponse>
      >(
        `/lives/${liveId}/reservation`,
      );

    const result =
      assertSuccess(
        response,
      );

    return {
      ...result,

      cohostCandidates:
        result.cohostCandidates ??
        result.coHostCandidates ??
        [],
    };
  };

export const updateLiveReservation =
  async ({
    liveId,
    body,
  }: {
    liveId: number;
    body: UpdateLiveReservationRequest;
  }) => {
    const response =
      await axiosInstance.patch<
        LiveApiResponse<
          | UpdateLiveReservationResponse
          | null
        >
      >(
        `/lives/${liveId}/reservation`,
        body,
      );

    return assertNullableSuccess(
      response,
    );
  };

export const cancelLiveReservation =
  async (
    liveId: number,
  ) => {
    await axiosInstance.delete<
      LiveApiResponse<null>
    >(
      `/lives/${liveId}/reservation`,
    );
  };

export const enterLive =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<EnterLiveResponse>
      >(
        `/lives/${liveId}`,
      );

    const result =
      assertSuccess(
        response,
      );

    return {
      ...result,

      coPublishers:
        result.coPublishers ??
        result.coPublisher ??
        [],
    };
  };

export const leaveLive =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<null>
      >(
        `/lives/${liveId}/leave`,
      );

    return assertNullableSuccess(
      response,
    );
  };

export const closeLive =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<CloseLiveResponse | null>
      >(
        `/lives/${liveId}/close`,
      );

    return assertNullableSuccess(
      response,
    );
  };

export const requestCoHostUpgrade =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<null>
      >(
        `/lives/${liveId}/co-host`,
      );

    return assertNullableSuccess(
      response,
    );
  };

export const acceptCoHostUpgrade =
  async (
    liveId: number,
    userId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<null>
      >(
        `/lives/${liveId}/co-host/acceptance`,
        {
          userId,
        },
      );

    return assertNullableSuccess(
      response,
    );
  };

export const respondCoHostInvitation =
  async (
    liveId: number,
    isAccepted: boolean,
  ) => {
    const response =
      await axiosInstance.patch<
        LiveApiResponse<null>
      >(
        `/lives/${liveId}/co-host-invitation`,
        {
          isAccepted,
        },
      );

    return assertNullableSuccess(
      response,
    );
  };

export const getLiveChatTicket =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<LiveChatTicketResponse>
      >(
        `/lives/${liveId}/chat/ws-ticket`,
      );

    return assertSuccess(
      response,
    );
  };

export const toggleLiveAlarm =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.post<
        LiveApiResponse<ToggleLiveAlarmResponse>
      >(
        `/lives/${liveId}/alarm`,
      );

    return assertSuccess(
      response,
    );
  };

export const getLiveNowList =
  async ({
    filter,
    cursor,
    size = 10,
  }: {
    filter: LiveNowListFilter;
    cursor?: number;
    size?: number;
  }): Promise<LiveNowListResponse> => {
    const response =
      await axiosInstance.get<
        LiveApiResponse<unknown>
      >(
        `/lives/live-now/${filter}`,
        {
          params: {
            cursor,
            size,
          },
        },
      );

    const result =
      assertSuccess(
        response,
      );

    return {
      items:
        getPaginatedItems(
          result,
        ),
      pageInfo:
        getPageInfo(
          result,
        ),
    };
  };

export const getScheduledLiveList =
  async ({
    following,
    cursor,
    size = 10,
  }: {
    following: boolean;
    cursor?: number;
    size?: number;
  }): Promise<ScheduledLiveListResponse> => {
    const response =
      await axiosInstance.get<
        LiveApiResponse<unknown>
      >(
        "/lives/scheduled",
        {
          params: {
            following,
            cursor,
            size,
          },
        },
      );

    const result =
      assertSuccess(
        response,
      );

    return {
      items:
        getPaginatedItems(
          result,
        ),
      pageInfo:
        getPageInfo(
          result,
        ),
    };
  };

export const getReplayList =
  async ({
    filter,
    sort,
    cursor,
    size = 10,
  }: {
    filter: ReplayListFilter;
    sort: ReplaySort;
    cursor?: number;
    size?: number;
  }): Promise<ReplayListResponse> => {
    const response =
      await axiosInstance.get<
        LiveApiResponse<unknown>
      >(
        `/lives/replays/${filter}`,
        {
          params: {
            sort,
            cursor,
            size,
          },
        },
      );

    const result =
      assertSuccess(
        response,
      );

    return {
      items:
        getPaginatedItems(
          result,
        ),
      pageInfo:
        getPageInfo(
          result,
        ),
    };
  };

export const getReplayPlayback =
  async (
    liveId: number,
  ) => {
    const response =
      await axiosInstance.get<
        LiveApiResponse<ReplayPlaybackResponse>
      >(
        `/lives/${liveId}/replay`,
      );

    return assertSuccess(
      response,
    );
  };

const toPositiveId = (
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

const toRecord = (
  value: unknown,
) =>
  value &&
  typeof value === "object"
    ? (value as RawRecord)
    : null;

const parseCoHostRequester = (
  rawData: string,
): LiveCoHostRequester | null => {
  const trimmedData =
    rawData.trim();

  const directUserId =
    toPositiveId(
      trimmedData,
    );

  if (directUserId) {
    return {
      userId: directUserId,
      nickname: null,
    };
  }

  try {
    const record =
      toRecord(
        JSON.parse(
          trimmedData,
        ),
      );

    const requester =
      toRecord(
        record?.requester,
      );

    const data =
      toRecord(
        record?.data,
      );

    const userId =
      [
        record?.userId,
        record?.requesterUserId,
        record?.targetUserId,
        record?.memberUserId,
        requester?.userId,
        data?.userId,
        data?.requesterUserId,
      ]
        .map(toPositiveId)
        .find(Boolean);

    if (!userId) {
      return null;
    }

    const nickname =
      [
        record?.nickname,
        record?.requesterNickname,
        requester?.nickname,
        data?.nickname,
        data?.requesterNickname,
      ].find(
        (value) =>
          typeof value ===
            "string" &&
          value.trim(),
      );

    return {
      userId,

      nickname:
        typeof nickname ===
        "string"
          ? nickname.trim()
          : null,
    };
  } catch {
    return null;
  }
};

const parseCoPublishers = (
  rawData: string,
): LiveCoPublisher[] | null => {
  try {
    const parsed =
      JSON.parse(
        rawData,
      ) as unknown;

    const items =
      Array.isArray(parsed)
        ? parsed
        : toRecord(parsed)
            ?.coPublishers;

    if (
      !Array.isArray(items)
    ) {
      return [];
    }

    const publishers =
      new Map<number, string>();

    items.forEach((item) => {
      const record =
        toRecord(item);

      const userId =
        toPositiveId(
          record?.userId,
        );

      const whepUrl =
        typeof record?.whepUrl ===
        "string"
          ? record.whepUrl.trim()
          : "";

      if (
        userId &&
        whepUrl
      ) {
        publishers.set(
          userId,
          whepUrl,
        );
      }
    });

    return Array.from(
      publishers,
      ([userId, whepUrl]) => ({
        userId,
        whepUrl,
      }),
    );
  } catch {
    return null;
  }
};

export type LiveEventHandlers = {
  onViewerCount: (
    viewerCount: number,
  ) => void;

  onCoPublishersChanged: (
    publishers: LiveCoPublisher[],
  ) => void;

  onCoHostUpgradeRequested: (
    requester: LiveCoHostRequester | null,
  ) => void;

  onCoHostUpgradeAccepted: () => void;
};

const handleLiveEvent = (
  eventText: string,
  handlers: LiveEventHandlers,
) => {
  const lines =
    eventText.split("\n");

  const eventName =
    lines
      .find((line) =>
        line.startsWith(
          "event:",
        ),
      )
      ?.replace(
        /^event:\s?/,
        "",
      )
      .trim();

  const data =
    lines
      .filter((line) =>
        line.startsWith(
          "data:",
        ),
      )
      .map((line) =>
        line.replace(
          /^data:\s?/,
          "",
        ),
      )
      .join("\n");

  // 명세의 이벤트 이름 표기(Requestd)도 함께 받는다.
  if (
    eventName ===
      "coHostUpgradeRequested" ||
    eventName ===
      "coHostUpgradeRequestd"
  ) {
    handlers.onCoHostUpgradeRequested(
      parseCoHostRequester(
        data,
      ),
    );

    return;
  }

  if (
    eventName ===
    "coHostUpgradeAccepted"
  ) {
    handlers.onCoHostUpgradeAccepted();

    return;
  }

  if (!data.trim()) {
    return;
  }

  if (
    !eventName ||
    eventName ===
      "viewerCount"
  ) {
    const viewerCount =
      Number(
        data.trim(),
      );

    if (
      Number.isFinite(
        viewerCount,
      )
    ) {
      handlers.onViewerCount(
        viewerCount,
      );
    }

    return;
  }

  if (
    eventName ===
    "coPublishersChanged"
  ) {
    const publishers =
      parseCoPublishers(
        data,
      );

    if (publishers) {
      handlers.onCoPublishersChanged(
        publishers,
      );
    }
  }
};

export const subscribeLiveEvents =
  async ({
    liveId,
    signal,
    handlers,
  }: {
    liveId: number;
    signal: AbortSignal;
    handlers: LiveEventHandlers;
  }) => {
    const token =
      await secureTokenStorage.getAccessToken();

    if (!token) {
      throw new Error(
        "로그인이 필요합니다.",
      );
    }

    const base =
      config.apiBaseUrl.replace(
        /\/$/,
        "",
      );

    const response =
      await expoFetch(
        `${base}/lives/${liveId}/viewers?watchOnly=false`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              "text/event-stream",
          },

          signal,
        },
      );

    if (!response.ok) {
      throw new Error(
        `라이브 이벤트 구독 실패: ${response.status}`,
      );
    }

    const reader =
      response.body?.getReader();

    if (!reader) {
      throw new Error(
        "라이브 이벤트 스트림을 읽을 수 없어요.",
      );
    }

    const decoder =
      new TextDecoder();

    let buffer = "";

    try {
      while (true) {
        const {
          value,
          done,
        } =
          await reader.read();

        if (done) {
          break;
        }

        buffer +=
          decoder
            .decode(value, {
              stream: true,
            })
            .replace(
              /\r\n/g,
              "\n",
            );

        const events =
          buffer.split("\n\n");

        buffer =
          events.pop() ?? "";

        events.forEach(
          (eventText) =>
            handleLiveEvent(
              eventText,
              handlers,
            ),
        );
      }
    } finally {
      reader.releaseLock();
    }
  };

export const resolveLiveMediaUrl =
  (
    pathOrUrl: string,
  ) => {
    if (
      /^https?:\/\//i.test(
        pathOrUrl,
      )
    ) {
      return pathOrUrl;
    }

    const base =
      config.apiBaseUrl.replace(
        /\/$/,
        "",
      );

    if (!base) {
      return pathOrUrl;
    }

    const mediaBase =
      base.replace(
        /\/api$/,
        "",
      );

    const path =
      pathOrUrl.startsWith(
        "/",
      )
        ? pathOrUrl
        : `/${pathOrUrl}`;

    return `${mediaBase}${path}`;
  };

export const getLiveChatWebSocketUrl =
  ({
    liveId,
    ticket,
  }: {
    liveId: number;
    ticket: string;
  }) => {
    const base =
      config.apiBaseUrl.replace(
        /\/$/,
        "",
      );

    if (
      !/^https?:\/\//i.test(
        base,
      )
    ) {
      throw new Error(
        "EXPO_PUBLIC_API_BASE_URL 설정이 필요합니다.",
      );
    }

    const url =
      new URL(base);

    const basePath =
      url.pathname.replace(
        /\/$/,
        "",
      );

    url.protocol =
      url.protocol ===
      "https:"
        ? "wss:"
        : "ws:";

    url.pathname =
      `${basePath}/ws/lives/${liveId}/chat`;

    url.search =
      new URLSearchParams({
        ticket,
      }).toString();

    return url.toString();
  };
