import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getFanHome, getUpcomingPerformances } from "@/api/fan/home";
import type { UpcomingPerformanceSort } from "@/types/fan/home";

export const fanHomeKeys = {
  all: ["fanHome"] as const,
  main: () => [...fanHomeKeys.all, "main"] as const,
  upcomingPerformances: (sort: UpcomingPerformanceSort, size: number) =>
    [...fanHomeKeys.all, "upcomingPerformances", sort, size] as const,
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
