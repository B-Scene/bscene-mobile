import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addSessionRecruitmentInterest,
  createSessionRecruitment,
  deleteSessionRecruitment,
  getSessionRecruitmentEditInfo,
  getSessionRecruitmentDetail,
  getSessionRecruitments,
  removeSessionRecruitmentInterest,
  updateSessionRecruitment,
} from "@/api/session/sessionRecruitment";
import type {
  CreateSessionRecruitmentRequest,
  SessionRecruitmentListParams,
  UpdateSessionRecruitmentRequest,
} from "@/types/session/sessionRecruitment";

export const sessionRecruitmentKeys = {
  all: ["sessionRecruitments"] as const,
  lists: () => [...sessionRecruitmentKeys.all, "list"] as const,
  list: (params: SessionRecruitmentListParams) =>
    [...sessionRecruitmentKeys.lists(), params] as const,
  detail: (sessionRecruitmentId: number) =>
    [...sessionRecruitmentKeys.all, "detail", sessionRecruitmentId] as const,
  editInfo: (sessionRecruitmentId: number) =>
    [...sessionRecruitmentKeys.all, "editInfo", sessionRecruitmentId] as const,
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

export const useSessionRecruitmentEditInfoQuery = (
  sessionRecruitmentId: number,
) => {
  return useQuery({
    queryKey: sessionRecruitmentKeys.editInfo(sessionRecruitmentId),
    queryFn: () => getSessionRecruitmentEditInfo(sessionRecruitmentId),
    enabled: sessionRecruitmentId > 0,
    staleTime: 1000 * 30,
  });
};

export const useCreateSessionRecruitment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSessionRecruitmentRequest) =>
      createSessionRecruitment(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionRecruitmentKeys.lists() });
    },
  });
};

export const useUpdateSessionRecruitment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionRecruitmentId,
      body,
    }: {
      sessionRecruitmentId: number;
      body: UpdateSessionRecruitmentRequest;
    }) => updateSessionRecruitment(sessionRecruitmentId, body),
    onSuccess: (_data, { sessionRecruitmentId }) => {
      queryClient.invalidateQueries({ queryKey: sessionRecruitmentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: sessionRecruitmentKeys.detail(sessionRecruitmentId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionRecruitmentKeys.editInfo(sessionRecruitmentId),
      });
    },
  });
};

export const useDeleteSessionRecruitment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSessionRecruitment,
    onSuccess: (_data, sessionRecruitmentId) => {
      queryClient.invalidateQueries({ queryKey: sessionRecruitmentKeys.lists() });
      queryClient.removeQueries({
        queryKey: sessionRecruitmentKeys.detail(sessionRecruitmentId),
      });
      queryClient.removeQueries({
        queryKey: sessionRecruitmentKeys.editInfo(sessionRecruitmentId),
      });
    },
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
