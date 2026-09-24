import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  BandDetailResponse,
} from "@/types/band/band";

export const getBand = async (bandId: number) => {
  const response = await axiosInstance.get<BandApiResponse<BandDetailResponse>>(
    `/bands/${bandId}`,
  );
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
