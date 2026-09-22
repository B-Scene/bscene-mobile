import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  followExploreBand,
  getFanExploreBandDetail,
  getRecommendedExploreBands,
  unfollowExploreBand,
} from "@/api/fan/explore";
import { followedBandsKeys } from "@/hooks/api/user/useFollowedBands";
import type { FanExploreRecommendationParams } from "@/types/fan/explore";

export const fanExploreKeys = {
  all: ["fanExplore"] as const,
  recommendedBands: (params: FanExploreRecommendationParams) =>
    [...fanExploreKeys.all, "recommendedBands", params] as const,
  bandDetail: (bandId: number) =>
    [...fanExploreKeys.all, "bandDetail", bandId] as const,
};

export const useRecommendedExploreBandsInfiniteQuery = (
  params: FanExploreRecommendationParams = {},
) => {
  return useInfiniteQuery({
    queryKey: fanExploreKeys.recommendedBands(params),
    queryFn: ({ pageParam }) =>
      getRecommendedExploreBands({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 30,
  });
};

export const useFanExploreBandDetailQuery = (bandId: number) => {
  return useQuery({
    queryKey: fanExploreKeys.bandDetail(bandId),
    queryFn: () => getFanExploreBandDetail(bandId),
    enabled: bandId > 0,
    staleTime: 1000 * 30,
  });
};

export const useFollowExploreBand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followExploreBand,
    onSuccess: (_data, bandId) => {
      queryClient.invalidateQueries({ queryKey: fanExploreKeys.all });
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.bandDetail(bandId),
      });
      queryClient.invalidateQueries({ queryKey: followedBandsKeys.all });
    },
  });
};

export const useUnfollowExploreBand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowExploreBand,
    onSuccess: (_data, bandId) => {
      queryClient.invalidateQueries({ queryKey: fanExploreKeys.all });
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.bandDetail(bandId),
      });
      queryClient.invalidateQueries({ queryKey: followedBandsKeys.all });
    },
  });
};
