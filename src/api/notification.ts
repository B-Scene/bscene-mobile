import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  NotificationApiResponse,
  RegisterPushTokenRequest,
} from "@/types/notification";

export const registerPushToken = async (body: RegisterPushTokenRequest) => {
  const response = await axiosInstance.post<NotificationApiResponse<unknown>>(
    "/notifications/tokens",
    body,
  );
  const { data } = response;

  if (data.isSuccess === false) {
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
