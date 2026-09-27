import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    acceptCoHostUpgrade,
    closeLive,
    createLive,
    enterLive,
    getLiveNowList,
    getReplayList,
    getScheduledLiveList,
    getLiveHome,
    leaveLive,
    requestCoHostUpgrade,
    respondCoHostInvitation,
    toggleLiveAlarm,
} from "@/api/live/live";

import type {
    CreateLiveRequest,
    LiveNowListFilter,
    ReplayListFilter,
    ReplaySort,
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

  liveNow: (
    filter: LiveNowListFilter,
  ) => [
    ...liveKeys.all,
    "liveNow",
    filter,
  ] as const,

  scheduled: (
    following: boolean,
  ) => [
    ...liveKeys.all,
    "scheduled",
    following,
  ] as const,

  replays: (
    filter: ReplayListFilter,
    sort: ReplaySort,
  ) => [
    ...liveKeys.all,
    "replays",
    filter,
    sort,
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

export const useLiveNowInfiniteQuery =
  (
    filter: LiveNowListFilter =
      "all",
  ) => {
    return useInfiniteQuery({
      queryKey:
        liveKeys.liveNow(
          filter,
        ),

      queryFn: ({
        pageParam,
      }) =>
        getLiveNowList({
          filter,
          cursor:
            pageParam,
        }),

      initialPageParam:
        undefined as
          | number
          | undefined,

      getNextPageParam: (
        lastPage,
      ) =>
        lastPage.pageInfo
          .hasNext
          ? lastPage.pageInfo
              .nextCursor ??
            undefined
          : undefined,
    });
  };

export const useScheduledLiveInfiniteQuery =
  (
    following = false,
  ) => {
    return useInfiniteQuery({
      queryKey:
        liveKeys.scheduled(
          following,
        ),

      queryFn: ({
        pageParam,
      }) =>
        getScheduledLiveList({
          following,
          cursor:
            pageParam,
        }),

      initialPageParam:
        undefined as
          | number
          | undefined,

      getNextPageParam: (
        lastPage,
      ) =>
        lastPage.pageInfo
          .hasNext
          ? lastPage.pageInfo
              .nextCursor ??
            undefined
          : undefined,
    });
  };

export const useReplayListInfiniteQuery =
  (
    filter: ReplayListFilter =
      "all",
    sort: ReplaySort =
      "LATEST",
  ) => {
    return useInfiniteQuery({
      queryKey:
        liveKeys.replays(
          filter,
          sort,
        ),

      queryFn: ({
        pageParam,
      }) =>
        getReplayList({
          filter,
          sort,
          cursor:
            pageParam,
        }),

      initialPageParam:
        undefined as
          | number
          | undefined,

      getNextPageParam: (
        lastPage,
      ) =>
        lastPage.pageInfo
          .hasNext
          ? lastPage.pageInfo
              .nextCursor ??
            undefined
          : undefined,
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

export const useToggleLiveAlarmMutation =
  () => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        toggleLiveAlarm,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            liveKeys.home(),
        });
      },
    });
  };
