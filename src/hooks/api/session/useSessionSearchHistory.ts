import { useMutation, useQuery } from "@tanstack/react-query";

import {
  deleteSessionSearchHistory,
  getSessionSearchHistory,
} from "@/api/session/sessionSearchHistory";

const sessionSearchHistoryKey = ["sessionRecruitments", "searchHistory"] as const;

export const useSessionSearchHistoryQuery = () => {
  return useQuery({
    queryKey: sessionSearchHistoryKey,
    queryFn: getSessionSearchHistory,
    staleTime: 1000 * 30,
  });
};

export const useDeleteSessionSearchHistory = () => {
  return useMutation({
    mutationFn: deleteSessionSearchHistory,
  });
};
