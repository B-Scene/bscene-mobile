import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  applySessionRecruitment,
  cancelSessionApplicationSubmission,
  createSessionApplication,
  deleteSessionApplication,
  finalizeApplicationSubmission,
  getApplicationSubmissionDetail,
  getApplicationSubmissions,
  getMySessionApplicationDetail,
  getMySessionApplicationSummary,
  getSessionApplicationDetail,
  getSessionApplicationsSearch,
  updateSessionApplication,
  updateSessionApplicationVisibility,
} from "@/api/session/sessionApplication";

import {
  sessionRecruitmentKeys,
} from "@/hooks/api/session/useSessionRecruitment";

import type {
  ApplicationSubmissionsParams,
  ApplySessionRecruitmentRequest,
  CreateSessionApplicationRequest,
  FinalizeApplicationSubmissionRequest,
  SessionApplicationSearchParams,
  UpdateSessionApplicationRequest,
  UpdateSessionApplicationVisibilityRequest,
} from "@/types/session/sessionApplication";

export const sessionApplicationKeys = {
  all: [
    "sessionApplications",
  ] as const,

  searches: () => [
    ...sessionApplicationKeys.all,
    "search",
  ] as const,

  searchInfinite: (
    params: SessionApplicationSearchParams,
  ) => [
    ...sessionApplicationKeys.searches(),
    "infinite",
    params,
  ] as const,

  details: () => [
    ...sessionApplicationKeys.all,
    "detail",
  ] as const,

  detail: (
    sessionApplicationId: number,
  ) => [
    ...sessionApplicationKeys.details(),
    sessionApplicationId,
  ] as const,

  summary: () => [
    ...sessionApplicationKeys.all,
    "summary",
  ] as const,

  myDetails: () => [
    ...sessionApplicationKeys.all,
    "myDetail",
  ] as const,

  myDetail: (
    sessionApplicationId: number,
  ) => [
    ...sessionApplicationKeys.myDetails(),
    sessionApplicationId,
  ] as const,

  submissions: () => [
    ...sessionApplicationKeys.all,
    "submissions",
  ] as const,

  submissionsList: (
    params: ApplicationSubmissionsParams,
  ) => [
    ...sessionApplicationKeys.submissions(),
    params,
  ] as const,

  submissionDetail: (
    applicationSubmissionId: number,
  ) => [
    ...sessionApplicationKeys.submissions(),
    "detail",
    applicationSubmissionId,
  ] as const,
};

export const useSessionApplicationsSearchInfiniteQuery =
  (
    params: SessionApplicationSearchParams = {},
    enabled = true,
  ) => {
    return useInfiniteQuery({
      queryKey:
        sessionApplicationKeys.searchInfinite(
          params,
        ),

      queryFn: ({
        pageParam,
      }) =>
        getSessionApplicationsSearch({
          ...params,
          cursorId:
            pageParam,
        }),

      initialPageParam:
        undefined as number | undefined,

      getNextPageParam: (
        lastPage,
      ) =>
        lastPage.hasNext
          ? lastPage.nextCursor ??
            undefined
          : undefined,

      enabled,

      staleTime:
        1000 * 30,
    });
  };

export const useSessionApplicationDetailQuery =
  (
    sessionApplicationId: number,
  ) => {
    return useQuery({
      queryKey:
        sessionApplicationKeys.detail(
          sessionApplicationId,
        ),

      queryFn: () =>
        getSessionApplicationDetail(
          sessionApplicationId,
        ),

      enabled:
        sessionApplicationId >
        0,

      staleTime:
        1000 * 30,
    });
  };

export const useMySessionApplicationSummaryQuery =
  () => {
    return useQuery({
      queryKey:
        sessionApplicationKeys.summary(),

      queryFn:
        getMySessionApplicationSummary,

      staleTime:
        1000 * 30,
    });
  };

export const useMySessionApplicationDetailQuery =
  (
    sessionApplicationId: number,
  ) => {
    return useQuery({
      queryKey:
        sessionApplicationKeys.myDetail(
          sessionApplicationId,
        ),

      queryFn: () =>
        getMySessionApplicationDetail(
          sessionApplicationId,
        ),

      enabled:
        sessionApplicationId >
        0,

      staleTime:
        1000 * 30,
    });
  };

export const useCreateSessionApplicationMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        body: CreateSessionApplicationRequest,
      ) =>
        createSessionApplication(
          body,
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.searches(),
        });
      },
    });
  };

export const useUpdateSessionApplicationMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        sessionApplicationId,
        body,
      }: {
        sessionApplicationId: number;
        body: UpdateSessionApplicationRequest;
      }) =>
        updateSessionApplication(
          sessionApplicationId,
          body,
        ),

      onSuccess: (
        _result,
        variables,
      ) => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.searches(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.myDetail(
              variables.sessionApplicationId,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.detail(
              variables.sessionApplicationId,
            ),
        });
      },
    });
  };

export const useDeleteSessionApplicationMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        sessionApplicationId: number,
      ) =>
        deleteSessionApplication(
          sessionApplicationId,
        ),

      onSuccess: (
        _result,
        sessionApplicationId,
      ) => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.searches(),
        });

        queryClient.removeQueries({
          queryKey:
            sessionApplicationKeys.myDetail(
              sessionApplicationId,
            ),
        });

        queryClient.removeQueries({
          queryKey:
            sessionApplicationKeys.detail(
              sessionApplicationId,
            ),
        });
      },
    });
  };

export const useUpdateSessionApplicationVisibilityMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        sessionApplicationId,
        body,
      }: {
        sessionApplicationId: number;
        body: UpdateSessionApplicationVisibilityRequest;
      }) =>
        updateSessionApplicationVisibility(
          sessionApplicationId,
          body,
        ),

      onSuccess: (
        result,
      ) => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.searches(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.myDetail(
              result.sessionApplicationId,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.detail(
              result.sessionApplicationId,
            ),
        });
      },
    });
  };

export const useApplySessionRecruitmentMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        sessionRecruitmentId,
        body,
      }: {
        sessionRecruitmentId: number;
        body: ApplySessionRecruitmentRequest;
      }) =>
        applySessionRecruitment(
          sessionRecruitmentId,
          body,
        ),

      onSuccess: (
        _result,
        {
          sessionRecruitmentId,
        },
      ) => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionRecruitmentKeys.detail(
              sessionRecruitmentId,
            ),
        });
      },
    });
  };

export const useApplicationSubmissionDetailQuery =
  (
    applicationSubmissionId: number,
  ) => {
    return useQuery({
      queryKey:
        sessionApplicationKeys.submissionDetail(
          applicationSubmissionId,
        ),

      queryFn: () =>
        getApplicationSubmissionDetail(
          applicationSubmissionId,
        ),

      enabled:
        applicationSubmissionId >
        0,

      staleTime:
        1000 * 30,
    });
  };

export const useApplicationSubmissionsQuery =
  (
    params: ApplicationSubmissionsParams = {},
  ) => {
    return useQuery({
      queryKey:
        sessionApplicationKeys.submissionsList(
          params,
        ),

      queryFn: () =>
        getApplicationSubmissions(
          params,
        ),

      staleTime:
        1000 * 30,
    });
  };

export const useCancelApplicationSubmissionMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        cancelSessionApplicationSubmission,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.submissions(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });
      },
    });
  };

export const useFinalizeApplicationSubmissionMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        applySubmissionId,
        body,
      }: {
        applySubmissionId: number;
        body: FinalizeApplicationSubmissionRequest;
      }) =>
        finalizeApplicationSubmission(
          applySubmissionId,
          body,
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.submissions(),
        });

        queryClient.invalidateQueries({
          queryKey:
            sessionApplicationKeys.summary(),
        });
      },
    });
  };