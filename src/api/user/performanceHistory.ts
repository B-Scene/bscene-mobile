import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  GetPerformanceHistoryParams,
  PerformanceHistoryResponse,
  UserApiResponse,
} from "@/types/user/performanceHistory";

export const getPerformanceHistory = async (
  params: GetPerformanceHistoryParams = {},
) => {
  const response = await axiosInstance.get<
    UserApiResponse<PerformanceHistoryResponse>
  >("/users/me/performance/history", { params });
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

  return data.result;
};
