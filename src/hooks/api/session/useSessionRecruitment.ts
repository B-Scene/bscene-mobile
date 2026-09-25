import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addSessionRecruitmentInterest,
  getSessionRecruitmentDetail,
  getSessionRecruitments,
  removeSessionRecruitmentInterest,
} from "@/api/session/sessionRecruitment";
import type { SessionRecruitmentListParams } from "@/types/session/sessionRecruitment";

export const sessionRecruitmentKeys = {
  all: ["sessionRecruitments"] as const,
  lists: () => [...sessionRecruitmentKeys.all, "list"] as const,
  list: (params: SessionRecruitmentListParams) =>
    [...sessionRecruitmentKeys.lists(), params] as const,
  detail: (sessionRecruitmentId: number) =>
    [...sessionRecruitmentKeys.all, "detail", sessionRecruitmentId] as const,
};

export const useSessionRecruitmentsQuery = (
  params: SessionRecruitmentListParams = {},
) => {
  return useQuery({
    queryKey: sessionRecruitmentKeys.list(params),
    queryFn: () => getSessionRecruitments(params),
    staleTime: 1000 * 30,
  });
};

export const useSessionRecruitmentDetailQuery = (
  sessionRecruitmentId: number,
) => {
  return useQuery({
    queryKey: sessionRecruitmentKeys.detail(sessionRecruitmentId),
    queryFn: () => getSessionRecruitmentDetail(sessionRecruitmentId),
    enabled: sessionRecruitmentId > 0,
    staleTime: 1000 * 30,
  });
};

export const useAddSessionRecruitmentInterest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSessionRecruitmentInterest,
    onSuccess: (_data, sessionRecruitmentId) => {
      queryClient.invalidateQueries({ queryKey: sessionRecruitmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: sessionRecruitmentKeys.detail(sessionRecruitmentId),
      });
    },
  });
};

export const useRemoveSessionRecruitmentInterest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeSessionRecruitmentInterest,
    onSuccess: (_data, sessionRecruitmentId) => {
      queryClient.invalidateQueries({ queryKey: sessionRecruitmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: sessionRecruitmentKeys.detail(sessionRecruitmentId),
      });
    },
  });
};
