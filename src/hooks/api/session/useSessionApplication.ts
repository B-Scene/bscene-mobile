import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applySessionRecruitment,
  getApplicationSubmissionDetail,
  getMySessionApplicationSummary,
} from "@/api/session/sessionApplication";
import { sessionRecruitmentKeys } from "@/hooks/api/session/useSessionRecruitment";
import type { ApplySessionRecruitmentRequest } from "@/types/session/sessionApplication";

export const sessionApplicationKeys = {
  all: ["sessionApplications"] as const,
  summary: () => [...sessionApplicationKeys.all, "summary"] as const,
  submissions: () => [...sessionApplicationKeys.all, "submissions"] as const,
  submissionDetail: (applicationSubmissionId: number) =>
    [
      ...sessionApplicationKeys.submissions(),
      "detail",
      applicationSubmissionId,
    ] as const,
};

export const useMySessionApplicationSummaryQuery = () => {
  return useQuery({
    queryKey: sessionApplicationKeys.summary(),
    queryFn: getMySessionApplicationSummary,
    staleTime: 1000 * 30,
  });
};

export const useApplySessionRecruitmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionRecruitmentId,
      body,
    }: {
      sessionRecruitmentId: number;
      body: ApplySessionRecruitmentRequest;
    }) => applySessionRecruitment(sessionRecruitmentId, body),
    onSuccess: (_result, { sessionRecruitmentId }) => {
      queryClient.invalidateQueries({
        queryKey: sessionApplicationKeys.summary(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionRecruitmentKeys.detail(sessionRecruitmentId),
      });
    },
  });
};

export const useApplicationSubmissionDetailQuery = (
  applicationSubmissionId: number,
) => {
  return useQuery({
    queryKey: sessionApplicationKeys.submissionDetail(applicationSubmissionId),
    queryFn: () => getApplicationSubmissionDetail(applicationSubmissionId),
    enabled: applicationSubmissionId > 0,
    staleTime: 1000 * 30,
  });
};
