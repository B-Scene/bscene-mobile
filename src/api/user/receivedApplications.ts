import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  ApiResponse,
  GetReceivedApplicationsParams,
  ReceivedApplicationsResponse,
} from "@/types/user/receivedApplications";

const removeEmptyParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  );

const assertSuccess = <T>(
  response: Awaited<ReturnType<typeof axiosInstance.get<ApiResponse<T>>>>,
) => {
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

export const getReceivedApplications = async (
  params: GetReceivedApplicationsParams = {},
) => {
  const response = await axiosInstance.get<
    ApiResponse<ReceivedApplicationsResponse>
  >("/users/me/recruitments/receives", {
    params: removeEmptyParams(params as Record<string, unknown>),
  });

  return assertSuccess(response);
};
