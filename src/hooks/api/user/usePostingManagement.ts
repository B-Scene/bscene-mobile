import { useInfiniteQuery } from "@tanstack/react-query";

import { getPostingManagement } from "@/api/user/postingManagement";

const PAGE_SIZE = 10;

export const postingManagementKeys = {
  all: ["postingManagement"] as const,
  list: (bandId: number) => [...postingManagementKeys.all, bandId] as const,
};

export const usePostingManagementQuery = (bandId: number | null) => {
  return useInfiniteQuery({
    queryKey: postingManagementKeys.list(bandId ?? 0),
    queryFn: ({ pageParam }) =>
      getPostingManagement({
        bandId: bandId ?? 0,
        cursorId: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: Boolean(bandId && bandId > 0),
  });
};
