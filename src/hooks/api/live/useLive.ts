import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    acceptCoHostUpgrade,
    closeLive,
    createLive,
    enterLive,
    getLiveHome,
    leaveLive,
    requestCoHostUpgrade,
    respondCoHostInvitation,
} from "@/api/live/live";

import type {
    CreateLiveRequest,
} from "@/types/live/live";

export const liveKeys = {
  all: [
    "live",
  ] as const,

  home: () => [
    ...liveKeys.all,
    "home",
  ] as const,

  room: (
    liveId: number,
  ) => [
    ...liveKeys.all,
    "room",
    liveId,
  ] as const,
};

export const useLiveHomeQuery =
  () => {
    return useQuery({
      queryKey:
        liveKeys.home(),

      queryFn:
        getLiveHome,

      staleTime:
        1000 * 10,

      refetchInterval:
        1000 * 15,
    });
  };

export const useCreateLiveMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        body: CreateLiveRequest,
      ) =>
        createLive(body),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            liveKeys.home(),
        });
      },
    });
  };

export const useEnterLiveMutation =
  () => {
    return useMutation({
      mutationFn:
        enterLive,
    });
  };

export const useLeaveLiveMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        leaveLive,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            liveKeys.home(),
        });
      },
    });
  };

export const useCloseLiveMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        closeLive,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            liveKeys.home(),
        });
      },
    });
  };

export const useRequestCoHostUpgradeMutation =
  () => {
    return useMutation({
      mutationFn:
        requestCoHostUpgrade,
    });
  };

export const useAcceptCoHostUpgradeMutation =
  () => {
    return useMutation({
      mutationFn: ({
        liveId,
        userId,
      }: {
        liveId: number;
        userId: number;
      }) =>
        acceptCoHostUpgrade(
          liveId,
          userId,
        ),
    });
  };

export const useRespondCoHostInvitationMutation =
  () => {
    return useMutation({
      mutationFn: ({
        liveId,
        isAccepted,
      }: {
        liveId: number;
        isAccepted: boolean;
      }) =>
        respondCoHostInvitation(
          liveId,
          isAccepted,
        ),
    });
  };