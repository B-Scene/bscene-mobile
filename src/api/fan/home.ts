import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  FanApiResponse,
  FanHomeConcert,
  FanHomeResponse,
  FanPerformanceDetailResponse,
  NormalizedUpcomingPerformancesResponse,
  UpcomingPerformancesParams,
  UpcomingPerformancesResponse,
} from "@/types/fan/home";

export const getFanHome = async () => {
  const response =
    await axiosInstance.get<FanApiResponse<FanHomeResponse>>("/home");
  const { data } = response;

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

export const getFanPerformanceDetail = async (performanceId: number) => {
  const { data } = await axiosInstance.get<
    FanApiResponse<FanPerformanceDetailResponse>
  >(`/performances/${performanceId}/detail`);

  return data.result;
};

const resolveHasNext = ({
  explicitHasNext,
  page,
  pageSize,
  totalPages,
  totalCount,
}: {
  explicitHasNext?: boolean;
  page: number;
  pageSize: number;
  totalPages?: number;
  totalCount?: number;
}) => {
  if (typeof explicitHasNext === "boolean") return explicitHasNext;
  if (typeof totalPages === "number") return page + 1 < totalPages;
  if (typeof totalCount === "number") return (page + 1) * pageSize < totalCount;
  return false;
};

export const getUpcomingPerformances = async ({
  sort = "IMMINENT",
  page = 0,
  size = 10,
}: UpcomingPerformancesParams = {}): Promise<NormalizedUpcomingPerformancesResponse> => {
  const response = await axiosInstance.get<
    FanApiResponse<UpcomingPerformancesResponse | FanHomeConcert[] | null>
  >("/performances/upcoming", {
    params: {
      sort,
      page,
      size,
    },
  });
  const { data } = response;

  if (!data.isSuccess || data.result == null) {
    throw new AxiosError(
      data.message,
      data.code,
      response.config,
      response.request,
      response,
    );
  }

  const result = data.result;

  if (Array.isArray(result)) {
    return {
      items: result,
      hasNext: false,
      nextPage: null,
      page,
    };
  }

  const items =
    result.items ??
    result.content ??
    result.performances ??
    result.upcomingPerformances ??
    result.data ??
    result.list ??
    [];
  const currentPage = result.page ?? page;
  const pageSize = result.size ?? result.pageSize ?? size;
  const totalCount = result.totalCount ?? result.totalElements ?? result.total;

  return {
    ...result,
    items,
    page: currentPage,
    hasNext: resolveHasNext({
      explicitHasNext: result.hasNext,
      page: currentPage,
      pageSize,
      totalPages: result.totalPages,
      totalCount,
    }),
  };
};

const unwrapFanMutationResult = <T>(
  response: AxiosResponse<FanApiResponse<T>>,
) => {
  const { data } = response;

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

export const setPerformanceAlarm = async (performanceId: number) => {
  const response = await axiosInstance.post<FanApiResponse<null>>(
    `/performances/${performanceId}/alarm`,
  );

  return unwrapFanMutationResult(response);
};

export const deletePerformanceAlarm = async (performanceId: number) => {
  const response = await axiosInstance.delete<FanApiResponse<null>>(
    `/performances/${performanceId}/alarm`,
  );

  return unwrapFanMutationResult(response);
};

export const addPerformanceInterest = async (performanceId: number) => {
  const response = await axiosInstance.post<FanApiResponse<null>>(
    `/performances/${performanceId}/interest`,
  );

  return unwrapFanMutationResult(response);
};

export const deletePerformanceInterest = async (performanceId: number) => {
  const response = await axiosInstance.delete<FanApiResponse<null>>(
    `/performances/${performanceId}/interest`,
  );

  return unwrapFanMutationResult(response);
};

export const isAlreadyInterestedPerformanceError = (error: unknown) => {
  const axiosError = error as AxiosError<FanApiResponse<unknown>>;

  return (
    axiosError.response?.status === 409 &&
    axiosError.response.data?.code === "SHOW409_2"
  );
};

export const isAlreadySetPerformanceAlarmError = (error: unknown) => {
  const axiosError = error as AxiosError<FanApiResponse<unknown>>;

  return (
    axiosError.response?.status === 409 &&
    axiosError.response.data?.code === "SHOW409_1"
  );
};
