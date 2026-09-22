import type { UserApiResponse } from "@/types/user/myPage";

export type { UserApiResponse };

export interface FanInformationResponse {
  nickname: string;
  profileImageUrl: string | null;
  genres: string[];
  regions: string[];
}
