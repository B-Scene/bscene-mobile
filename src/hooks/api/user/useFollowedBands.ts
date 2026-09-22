import { useInfiniteQuery } from "@tanstack/react-query";

import { getFollowedBands } from "@/api/user/followedBands";

export const followedBandsKeys = {
  all: ["followedBands"] as const,
  list: (pageSize: number) => [...followedBandsKeys.all, pageSize] as const,
};

export const useFollowedBandsQuery = (pageSize = 10, enabled = true) => {
  return useInfiniteQuery({
    queryKey: followedBandsKeys.list(pageSize),
    queryFn: ({ pageParam }) =>
      getFollowedBands({ page: pageParam, size: pageSize }),
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 30,
  });
};
