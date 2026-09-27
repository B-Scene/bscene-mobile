import {
    AxiosError,
    type AxiosResponse,
} from "axios";

import {
    axiosInstance,
} from "@/api/axiosInstance";

import {
    config,
} from "@/shared/constants/config";

import type {
    CloseLiveResponse,
    CreateLiveRequest,
    CreateLiveResponse,
    EnterLiveResponse,
    LiveApiResponse,
    LiveChatTicketResponse,
    LiveHomeResponse,
    LiveNowListFilter,
    LiveNowListResponse,
    ReplayListFilter,
    ReplayListResponse,
    ReplayPlaybackResponse,
    ReplaySort,
    ScheduledLiveListResponse,
    ToggleLiveAlarmResponse,
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

    return assertSuccess(
      response,
    );
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
        LiveApiResponse<CloseLiveResponse>
      >(
        `/lives/${liveId}/close`,
      );

    return assertSuccess(
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
