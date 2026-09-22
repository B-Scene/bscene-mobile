import { useInfiniteQuery } from "@tanstack/react-query";

import { getInterestedPerformances } from "@/api/user/interestedPerformance";
import type { InterestedPerformanceFilter } from "@/types/user/interestedPerformance";

export const interestedPerformancesKeys = {
  all: ["interestedPerformances"] as const,
  list: (filter: InterestedPerformanceFilter) =>
    [...interestedPerformancesKeys.all, filter] as const,
};

export const useInterestedPerformancesQuery = (
  filter: InterestedPerformanceFilter = "ALL",
  pageSize = 10,
) => {
  return useInfiniteQuery({
    queryKey: interestedPerformancesKeys.list(filter),
    queryFn: ({ pageParam }) =>
      getInterestedPerformances({ filter, page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 30,
  });
};
