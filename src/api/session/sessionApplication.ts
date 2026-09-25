import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  ApplicationSubmissionDetailResponse,
  ApplicationSubmissionsParams,
  ApplicationSubmissionsResponse,
  ApplySessionRecruitmentRequest,
  ApplySessionRecruitmentResponse,
  CancelSessionApplicationSubmissionResponse,
  CreateSessionApplicationRequest,
  CreateSessionApplicationResponse,
  FinalizeApplicationSubmissionRequest,
  FinalizeApplicationSubmissionResponse,
  MySessionApplicationDetailResponse,
  SessionApiResponse,
  SessionApplicationSummaryResponse,
  UpdateSessionApplicationRequest,
  UpdateSessionApplicationResponse,
  UpdateSessionApplicationVisibilityRequest,
  UpdateSessionApplicationVisibilityResponse,
} from "@/types/session/sessionApplication";

const removeEmptyParams = (
  params: Record<string, unknown>,
) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return (
        value !== undefined &&
        value !== null &&
        value !== ""
      );
    }),
  );

const assertSuccess = <T>(
  response: Awaited<
    ReturnType<
      typeof axiosInstance.get<SessionApiResponse<T>>
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

const assertNullableSuccess = <T>(
  response: Awaited<
    ReturnType<
      typeof axiosInstance.get<SessionApiResponse<T>>
    >
  >,
) => {
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

export const getMySessionApplicationSummary =
  async () => {
    const response =
      await axiosInstance.get<
        SessionApiResponse<SessionApplicationSummaryResponse>
      >("/sessions/applications/summary");

    return assertSuccess(response);
  };

export const getMySessionApplicationDetail =
  async (
    sessionApplicationId: number,
  ) => {
    const response =
      await axiosInstance.get<
        SessionApiResponse<MySessionApplicationDetailResponse>
      >(
        `/sessions/applications/my/${sessionApplicationId}`,
      );

    return assertSuccess(response);
  };

export const createSessionApplication =
  async (
    body: CreateSessionApplicationRequest,
  ) => {
    const response =
      await axiosInstance.post<
        SessionApiResponse<CreateSessionApplicationResponse>
      >(
        "/sessions/applications",
        body,
      );

    return assertSuccess(response);
  };

export const updateSessionApplication =
  async (
    sessionApplicationId: number,
    body: UpdateSessionApplicationRequest,
  ) => {
    const response =
      await axiosInstance.patch<
        SessionApiResponse<UpdateSessionApplicationResponse>
      >(
        `/sessions/applications/${sessionApplicationId}`,
        body,
      );

    return assertSuccess(response);
  };

export const deleteSessionApplication =
  async (
    sessionApplicationId: number,
  ) => {
    const response =
      await axiosInstance.delete<
        SessionApiResponse<DeleteSessionApplicationResponse>
      >(
        `/sessions/applications/${sessionApplicationId}`,
      );

    return assertNullableSuccess(response);
  };

export const updateSessionApplicationVisibility =
  async (
    sessionApplicationId: number,
    body: UpdateSessionApplicationVisibilityRequest,
  ) => {
    const response =
      await axiosInstance.patch<
        SessionApiResponse<UpdateSessionApplicationVisibilityResponse>
      >(
        `/sessions/applications/${sessionApplicationId}/visibility`,
        body,
      );

    return assertSuccess(response);
  };

export const applySessionRecruitment =
  async (
    sessionRecruitmentId: number,
    body: ApplySessionRecruitmentRequest,
  ) => {
    const response =
      await axiosInstance.post<
        SessionApiResponse<ApplySessionRecruitmentResponse>
      >(
        `/sessions/recruitments/${sessionRecruitmentId}/applications`,
        body,
      );

    return assertSuccess(response);
  };

export const getApplicationSubmissionDetail =
  async (
    applicationSubmissionId: number,
  ) => {
    const response =
      await axiosInstance.get<
        SessionApiResponse<ApplicationSubmissionDetailResponse>
      >(
        `/sessions/recruitments/submissions/${applicationSubmissionId}`,
      );

    return assertSuccess(response);
  };

export const getApplicationSubmissions =
  async (
    params: ApplicationSubmissionsParams = {},
  ) => {
    const response =
      await axiosInstance.get<
        SessionApiResponse<ApplicationSubmissionsResponse>
      >(
        "/sessions/applications/submissions",
        {
          params: removeEmptyParams(
            params as Record<
              string,
              unknown
            >,
          ),
        },
      );

    return assertSuccess(response);
  };

export const cancelSessionApplicationSubmission =
  async (
    applicationSubmissionId: number,
  ) => {
    const response =
      await axiosInstance.delete<
        SessionApiResponse<CancelSessionApplicationSubmissionResponse>
      >(
        `/sessions/applications/submissions/${applicationSubmissionId}`,
      );

    return assertNullableSuccess(response);
  };

export const finalizeApplicationSubmission =
  async (
    applySubmissionId: number,
    body: FinalizeApplicationSubmissionRequest,
  ) => {
    const response =
      await axiosInstance.post<
        SessionApiResponse<
          FinalizeApplicationSubmissionResponse | null
        >
      >(
        `/users/me/${applySubmissionId}/final`,
        body,
      );

    return assertNullableSuccess(response);
  };