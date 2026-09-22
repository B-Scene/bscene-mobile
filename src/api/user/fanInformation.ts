import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  FanInformationResponse,
  UserApiResponse,
} from "@/types/user/fanInformation";

export const getFanInformation = async () => {
  const response = await axiosInstance.get<
    UserApiResponse<FanInformationResponse>
  >("/users/me/information");
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
