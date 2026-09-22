import type { UserApiResponse } from "@/types/user/myPage";

export type { UserApiResponse };

export interface BandMyPageResponse {
  bandMemberProfileId: number;
  nickname: string;
  bandName: string;
  parts: string[];
  currentMode: "BAND" | "FAN";
  follower: number;
  applicant: number;
  performance: number;
  isBandMember: boolean;
}
