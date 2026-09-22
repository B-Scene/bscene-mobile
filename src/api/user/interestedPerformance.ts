import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  GetInterestedPerformancesParams,
  InterestedPerformanceResponse,
  UserApiResponse,
} from "@/types/user/interestedPerformance";

export const getInterestedPerformances = async (
  params: GetInterestedPerformancesParams = {},
) => {
  const response = await axiosInstance.get<
    UserApiResponse<InterestedPerformanceResponse>
  >("/users/me/performance/interest", { params });
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
