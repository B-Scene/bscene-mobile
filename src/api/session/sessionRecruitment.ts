import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  SessionApiResponse,
  SessionRecruitmentDetailResponse,
  SessionRecruitmentInterestResponse,
  SessionRecruitmentListParams,
  SessionRecruitmentListResponse,
} from "@/types/session/sessionRecruitment";

const removeEmptyParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim().length === 0) return false;
      return true;
    }),
  );

const assertSuccess = <T>(
  response: Awaited<ReturnType<typeof axiosInstance.get<SessionApiResponse<T>>>>,
) => {
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

export const getSessionRecruitments = async (
  params: SessionRecruitmentListParams = {},
) => {
  const response = await axiosInstance.get<
    SessionApiResponse<SessionRecruitmentListResponse>
  >("/sessions/recruitments", {
    params: removeEmptyParams(params as Record<string, unknown>),
  });

  return assertSuccess(response);
};

export const getSessionRecruitmentDetail = async (
  sessionRecruitmentId: number,
) => {
  const response = await axiosInstance.get<
    SessionApiResponse<SessionRecruitmentDetailResponse>
  >(`/sessions/recruitments/${sessionRecruitmentId}`);

  return assertSuccess(response);
};

export const addSessionRecruitmentInterest = async (
  sessionRecruitmentId: number,
) => {
  const response = await axiosInstance.post<
    SessionApiResponse<SessionRecruitmentInterestResponse>
  >(`/sessions/recruitments/${sessionRecruitmentId}/interest`);

  return assertSuccess(response);
};

export const removeSessionRecruitmentInterest = async (
  sessionRecruitmentId: number,
) => {
  const response = await axiosInstance.delete<
    SessionApiResponse<SessionRecruitmentInterestResponse>
  >(`/sessions/recruitments/${sessionRecruitmentId}/interest`);

  return assertSuccess(response);
};
