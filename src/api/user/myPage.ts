import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  FanMyPageResponse,
  UserApiResponse,
} from "@/types/user/myPage";

export const getFanMyPage = async () => {
  const response =
    await axiosInstance.get<UserApiResponse<FanMyPageResponse>>("/users/me");
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
