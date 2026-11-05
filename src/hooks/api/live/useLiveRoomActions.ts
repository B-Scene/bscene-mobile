import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  blockLiveUser,
  getLiveSummary,
  reportLiveUser,
  requestLiveReplay,
  unblockLiveUser,
  type BlockLiveUserRequest,
  type ReportLiveUserRequest,
} from "@/api/live/liveRoomActions";
import { liveKeys } from "@/hooks/api/live/useLive";

const liveSummaryKey = (liveId: number) =>
  [...liveKeys.all, "summary", liveId] as const;

export const useLiveSummaryQuery = (liveId: number) => {
  return useQuery({
    queryKey: liveSummaryKey(liveId),
    queryFn: () => getLiveSummary(liveId),
    enabled: liveId > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useRequestLiveReplayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestLiveReplay,
    onSuccess: (_result, liveId) => {
      void queryClient.invalidateQueries({
        queryKey: liveKeys.replayPlayback(liveId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...liveKeys.all, "replays"],
      });
      void queryClient.invalidateQueries({
        queryKey: liveSummaryKey(liveId),
      });
    },
  });
};

export const useReportLiveUserMutation = () => {
  return useMutation({
    mutationFn: ({
      liveId,
      request,
    }: {
      liveId: number;
      request: ReportLiveUserRequest;
    }) => reportLiveUser({ liveId, request }),
  });
};

const useInvalidateAfterBlock = () => {
  const queryClient = useQueryClient();

  return (_result: void, request: BlockLiveUserRequest) => {
    void queryClient.invalidateQueries({ queryKey: liveKeys.home() });
    void queryClient.invalidateQueries({
      queryKey: [...liveKeys.all, "members", request.liveId],
    });
  };
};

export const useBlockLiveUserMutation = () => {
  const onSuccess = useInvalidateAfterBlock();

  return useMutation({ mutationFn: blockLiveUser, onSuccess });
};

export const useUnblockLiveUserMutation = () => {
  const onSuccess = useInvalidateAfterBlock();

  return useMutation({ mutationFn: unblockLiveUser, onSuccess });
};
