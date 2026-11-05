import { axiosInstance } from "@/api/axiosInstance";

type LiveActionResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type LiveReportType =
  | "SPAM"
  | "ABUSE"
  | "SEXUAL"
  | "VIOLENCE"
  | "COPYRIGHT"
  | "ETC";

export interface ReportLiveUserRequest {
  targetUserId: number;
  reportType: LiveReportType;
  chatMessage?: string | null;
  comment?: string | null;
}

export interface BlockLiveUserRequest {
  liveId: number;
  targetUserId: number;
}

export interface LiveSummaryResponse {
  title: string;
  durationSec: number;
  closedViewerCount: number;
}

export const reportLiveUser = async ({
  liveId,
  request,
}: {
  liveId: number;
  request: ReportLiveUserRequest;
}) => {
  const { data } = await axiosInstance.post<
    LiveActionResponse<{ targetUserId: number }>
  >(`/lives/${liveId}/reports`, request);

  return data.result;
};

export const blockLiveUser = async (request: BlockLiveUserRequest) => {
  await axiosInstance.post("/users/blocks", request);
};

export const unblockLiveUser = async (request: BlockLiveUserRequest) => {
  await axiosInstance.delete("/users/blocks", { data: request });
};

export const requestLiveReplay = async (liveId: number) => {
  await axiosInstance.post(`/lives/${liveId}/replay`);
};

export const getLiveSummary = async (liveId: number) => {
  const { data } = await axiosInstance.get<
    LiveActionResponse<LiveSummaryResponse>
  >(`/lives/${liveId}/summary`);

  return data.result;
};
