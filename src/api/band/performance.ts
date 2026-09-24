import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  CreatePerformanceRequest,
  CreatePerformanceResponse,
  PerformanceListResponse,
  PerformanceResponse,
  UpdatePerformanceRequest,
  UpdatePerformanceResponse,
} from "@/types/band/performance";

export const createPerformance = async (
  bandId: number,
  body: CreatePerformanceRequest,
) => {
  const response = await axiosInstance.post<
    BandApiResponse<CreatePerformanceResponse>
  >(`/bands/${bandId}/performances`, body);
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

export const updatePerformance = async (
  performanceId: number,
  body: UpdatePerformanceRequest,
) => {
  const response = await axiosInstance.patch<
    BandApiResponse<UpdatePerformanceResponse>
  >(`/performances/${performanceId}`, body);
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

export const getPerformance = async (performanceId: number) => {
  const response = await axiosInstance.get<BandApiResponse<PerformanceResponse>>(
    `/performances/${performanceId}`,
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

export const deletePerformance = async (performanceId: number) => {
  const response = await axiosInstance.delete<BandApiResponse<null>>(
    `/performances/${performanceId}`,
  );
  const { data } = response;

  if (!data.isSuccess) {
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
