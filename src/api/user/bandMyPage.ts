import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandMyPageResponse,
  UserApiResponse,
} from "@/types/user/bandMyPage";

export const getBandMyPage = async () => {
  const response =
    await axiosInstance.get<UserApiResponse<BandMyPageResponse>>("/users/me");
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
