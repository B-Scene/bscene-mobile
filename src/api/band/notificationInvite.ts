import { axiosInstance } from "@/api/axiosInstance";
import type { BandMemberPart } from "@/api/band/bandManagement";
import type { NotificationApiResponse } from "@/types/notification";

export type InviteProfile = { nickname: string; part: BandMemberPart };

export const respondBandNotificationInvite = async ({
  bandId, profile,
}: { bandId: number; profile?: InviteProfile }) => {
  const response = profile
    ? await axiosInstance.patch<NotificationApiResponse<unknown>>(
        `/bands/${bandId}/members/accept`, profile,
      )
    : await axiosInstance.delete<NotificationApiResponse<unknown>>(
        `/bands/${bandId}/members/reject`,
      );
  if (response.data.isSuccess === false) {
    throw new Error(response.data.message || "초대를 처리하지 못했어요.");
  }
  return response.data.result;
};
