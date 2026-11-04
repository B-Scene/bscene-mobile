import { useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@/api/axiosInstance";
import { sessionRecruitmentKeys } from "@/hooks/api/session/useSessionRecruitment";

export interface SessionRecruitmentHistoryItem {
  sessionRecruitmentId: number;
  dDay: number;
  isClosed: boolean;
  isInterested: boolean;
  recruitmentTitle: string;
  bandName: string;
  bandGenre: string;
  bandRegion: string;
  postedAgo: number;
  summary: string;
  part: string;
  skillLevel: string;
}

interface SessionRecruitmentHistoryResponse {
  content: SessionRecruitmentHistoryItem[];
}

const getRecruitmentHistory = async (path: string, size: number) => {
  const { data } = await axiosInstance.get<{
    result: SessionRecruitmentHistoryResponse;
  }>(path, { params: { size } });

  return data.result;
};

export const useInterestedRecruitmentsQuery = (size: number) =>
  useQuery({
    queryKey: [...sessionRecruitmentKeys.all, "interests", size],
    queryFn: () =>
      getRecruitmentHistory("/sessions/recruitments/interests", size),
    staleTime: 1000 * 30,
  });

export const useRecentlyViewedRecruitmentsQuery = (size: number) =>
  useQuery({
    queryKey: [...sessionRecruitmentKeys.all, "recentlyViewed", size],
    queryFn: () =>
      getRecruitmentHistory("/sessions/recruitments/recently-viewed", size),
    staleTime: 1000 * 30,
  });
