import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  ApplicationSubmissionDetailResponse,
  ApplicationSubmissionsParams,
  ApplicationSubmissionsResponse,
  ApplySessionRecruitmentRequest,
  ApplySessionRecruitmentResponse,
  CancelSessionApplicationSubmissionResponse,
  FinalizeApplicationSubmissionRequest,
  FinalizeApplicationSubmissionResponse,
  SessionApiResponse,
  SessionApplicationSummaryResponse,
} from "@/types/session/sessionApplication";

const removeEmptyParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
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

export const getApplicationSubmissions = async (
  params: ApplicationSubmissionsParams = {},
) => {
  const response = await axiosInstance.get<
    SessionApiResponse<ApplicationSubmissionsResponse>
  >("/sessions/applications/submissions", {
    params: removeEmptyParams(params as Record<string, unknown>),
  });

  return assertSuccess(response);
};

export const cancelSessionApplicationSubmission = async (
  applicationSubmissionId: number,
) => {
  const response = await axiosInstance.delete<
    SessionApiResponse<CancelSessionApplicationSubmissionResponse>
  >(`/sessions/applications/submissions/${applicationSubmissionId}`);

  return assertSuccess(response);
};

export const finalizeApplicationSubmission = async (
  applySubmissionId: number,
  body: FinalizeApplicationSubmissionRequest,
) => {
  const response = await axiosInstance.post<
    SessionApiResponse<FinalizeApplicationSubmissionResponse | null>
  >(`/users/me/${applySubmissionId}/final`, body);

  return assertSuccess(response);
};
