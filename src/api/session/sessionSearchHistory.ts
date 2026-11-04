import { axiosInstance } from "@/api/axiosInstance";

export interface SessionSearchHistoryItem {
  keywordId: number;
  keyword: string;
}

interface SessionSearchHistoryResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

export const getSessionSearchHistory = async () => {
  const { data } = await axiosInstance.get<
    SessionSearchHistoryResponse<SessionSearchHistoryItem[]>
  >("/sessions/recruitments/search-history");

  return data.result;
};

export const deleteSessionSearchHistory = async (keywordId: number) => {
  const { data } = await axiosInstance.delete<
    SessionSearchHistoryResponse<null>
  >(`/sessions/recruitments/search-history/${keywordId}`);

  return data.result;
};
