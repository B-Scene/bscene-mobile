import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  ApplicationSubmissionDetailResponse,
  ApplySessionRecruitmentRequest,
  ApplySessionRecruitmentResponse,
  SessionApiResponse,
  SessionApplicationSummaryResponse,
} from "@/types/session/sessionApplication";

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

export const getMySessionApplicationSummary = async () => {
  const response = await axiosInstance.get<
    SessionApiResponse<SessionApplicationSummaryResponse>
  >("/sessions/applications/summary");

  return assertSuccess(response);
};

export const applySessionRecruitment = async (
  sessionRecruitmentId: number,
  body: ApplySessionRecruitmentRequest,
) => {
  const response = await axiosInstance.post<
    SessionApiResponse<ApplySessionRecruitmentResponse>
  >(`/sessions/recruitments/${sessionRecruitmentId}/applications`, body);

  return assertSuccess(response);
};

export const getApplicationSubmissionDetail = async (
  applicationSubmissionId: number,
) => {
  const response = await axiosInstance.get<
    SessionApiResponse<ApplicationSubmissionDetailResponse>
  >(`/sessions/recruitments/submissions/${applicationSubmissionId}`);

  return assertSuccess(response);
};
