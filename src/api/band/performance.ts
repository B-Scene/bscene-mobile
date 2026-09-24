import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  PerformanceListResponse,
} from "@/types/band/performance";

export const getPerformances = async (bandId: number) => {
  const response = await axiosInstance.get<
    BandApiResponse<PerformanceListResponse>
  >(`/bands/${bandId}/performances`);
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
