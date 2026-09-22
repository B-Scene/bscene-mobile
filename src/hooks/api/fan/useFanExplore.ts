import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getFanExploreBandDetail,
  getRecommendedExploreBands,
} from "@/api/fan/explore";
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
