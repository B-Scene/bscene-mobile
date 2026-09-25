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
} from "@/types/live/live";

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