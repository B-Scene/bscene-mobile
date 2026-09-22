import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  addPerformanceInterest,
  deletePerformanceAlarm,
  deletePerformanceInterest,
  getFanHome,
  getFanPerformanceDetail,
  getUpcomingPerformances,
  setPerformanceAlarm,
} from "@/api/fan/home";
import type { UpcomingPerformanceSort } from "@/types/fan/home";

export const fanHomeKeys = {
  all: ["fanHome"] as const,
  main: () => [...fanHomeKeys.all, "main"] as const,
  upcomingPerformances: (sort: UpcomingPerformanceSort, size: number) =>
    [...fanHomeKeys.all, "upcomingPerformances", sort, size] as const,
  upcomingPerformancesLists: () =>
    [...fanHomeKeys.all, "upcomingPerformances"] as const,
  performanceDetail: (performanceId: number) =>
    [...fanHomeKeys.all, "performanceDetail", performanceId] as const,
};

export const invalidatePerformanceInterestQueries = (
  queryClient: QueryClient,
  performanceId: number,
) => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: fanHomeKeys.main() }),
    queryClient.invalidateQueries({
      queryKey: fanHomeKeys.performanceDetail(performanceId),
    }),
    queryClient.invalidateQueries({
      queryKey: fanHomeKeys.upcomingPerformancesLists(),
    }),
  ]);
};

export const useFanHomeQuery = () => {
  return useQuery({
    queryKey: fanHomeKeys.main(),
    queryFn: getFanHome,
    staleTime: 1000 * 30,
  });
};

export const useUpcomingPerformancesInfiniteQuery = (
  sort: UpcomingPerformanceSort = "IMMINENT",
  size = 10,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: fanHomeKeys.upcomingPerformances(sort, size),
    queryFn: ({ pageParam }) =>
      getUpcomingPerformances({
        sort,
        page: pageParam,
        size,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasNext) return undefined;
      return lastPage.nextPage ?? pages.length;
    },
    enabled,
    staleTime: 1000 * 30,
  });
};

export const useFanPerformanceDetailQuery = (performanceId: number) => {
  return useQuery({
    queryKey: fanHomeKeys.performanceDetail(performanceId),
    queryFn: () => getFanPerformanceDetail(performanceId),
    enabled: performanceId > 0,
    staleTime: 1000 * 30,
  });
};

export const useSetPerformanceAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPerformanceAlarm,
    onSuccess: (_data, performanceId) =>
      invalidatePerformanceInterestQueries(queryClient, performanceId),
  });
};

export const useDeletePerformanceAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePerformanceAlarm,
    onSuccess: (_data, performanceId) =>
      invalidatePerformanceInterestQueries(queryClient, performanceId),
  });
};

export const useAddPerformanceInterest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPerformanceInterest,
    onSuccess: (_result, performanceId) =>
      invalidatePerformanceInterestQueries(queryClient, performanceId),
  });
};

export const useDeletePerformanceInterest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePerformanceInterest,
    onSuccess: (_result, performanceId) =>
      invalidatePerformanceInterestQueries(queryClient, performanceId),
  });
};
