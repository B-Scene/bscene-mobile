import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  MusicLinksResponse,
} from "@/types/band/musicLink";

export const getMusicLinks = async (bandId: number) => {
  const response = await axiosInstance.get<BandApiResponse<MusicLinksResponse>>(
    `/bands/${bandId}/music-links`,
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
