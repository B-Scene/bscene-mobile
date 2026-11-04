import { useInfiniteQuery } from "@tanstack/react-query";

import { getBandFollowers } from "@/api/band/follower";

const PAGE_SIZE = 10;

export const bandFollowersKeys = {
  all: ["bandFollowers"] as const,
  list: (size: number) => [...bandFollowersKeys.all, size] as const,
};

export const useBandFollowersQuery = (size = PAGE_SIZE) => {
  return useInfiniteQuery({
    queryKey: bandFollowersKeys.list(size),
    queryFn: ({ pageParam }) => getBandFollowers({ cursor: pageParam, size }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNext
        ? (lastPage.pageInfo.nextCursor ?? undefined)
        : undefined,
  });
};
