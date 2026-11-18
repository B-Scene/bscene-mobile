import { useQuery } from "@tanstack/react-query";

import { getFanMyPage } from "@/api/user/myPage";

export const fanMyPageKeys = {
  all: ["fanMyPage"] as const,
};

export const useFanMyPageQuery = (enabled = true) => {
  return useQuery({
    queryKey: fanMyPageKeys.all,
    queryFn: getFanMyPage,
    enabled,
    staleTime: 1000 * 30,
  });
};
