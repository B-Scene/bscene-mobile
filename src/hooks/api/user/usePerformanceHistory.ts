import { useInfiniteQuery } from "@tanstack/react-query";

import { getPerformanceHistory } from "@/api/user/performanceHistory";
import type { PerformanceHistoryFilter } from "@/types/user/performanceHistory";

export const performanceHistoryKeys = {
  all: ["performanceHistory"] as const,
  list: (filter: PerformanceHistoryFilter) =>
    [...performanceHistoryKeys.all, filter] as const,
};

export const usePerformanceHistoryQuery = (
  filter: PerformanceHistoryFilter = "ALL",
  pageSize = 10,
) => {
  return useInfiniteQuery({
    queryKey: performanceHistoryKeys.list(filter),
    queryFn: ({ pageParam }) =>
      getPerformanceHistory({ filter, page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 30,
  });
};
