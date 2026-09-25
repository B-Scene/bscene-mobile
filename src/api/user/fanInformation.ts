import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";

import type {
  FanInformationResponse,
  UpdateFanInformationRequest,
  UpdateFanInformationResponse,
  UserApiResponse,
} from "@/types/user/fanInformation";

const assertSuccess = <T>(
  response: Awaited<
    ReturnType<
      typeof axiosInstance.get<
        UserApiResponse<T>
      >
    >
  >,
) => {
  const { data } = response;

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

export const getFanInformation =
  async () => {
    const response =
      await axiosInstance.get<
        UserApiResponse<FanInformationResponse>
      >(
        "/users/me/information",
      );

    return assertSuccess(
      response,
    );
  };

export const updateFanInformation =
  async (
    body: UpdateFanInformationRequest,
  ) => {
    const response =
      await axiosInstance.patch<
        UserApiResponse<UpdateFanInformationResponse>
      >(
        "/users/me/information",
        body,
      );

    return assertSuccess(
      response,
    );
  };