import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  FollowedBandsResponse,
  GetFollowedBandsParams,
  UserApiResponse,
} from "@/types/user/followedBands";

export const getFollowedBands = async (
  params: GetFollowedBandsParams = {},
) => {
  const response = await axiosInstance.get<
    UserApiResponse<FollowedBandsResponse>
  >("/users/me/follows", { params });
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
