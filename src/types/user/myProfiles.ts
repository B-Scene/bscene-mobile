import type { UserApiResponse } from "@/types/user/myPage";

export type { UserApiResponse };

export type MyProfileListType = "all" | "band";

export interface GetMyProfilesParams {
  type?: MyProfileListType;
}

export interface MyBandProfileSummary {
  bandId: number;
  bandMemberProfileId: number;
  profileImageUrl: string | null;
  bandName: string;
  genre: string;
  region: string;
  isActive: boolean;
}

export interface MyFanProfileSummary {
  fanProfileId: number;
  profileImageUrl: string | null;
  nickname: string;
  email: string;
  isActive: boolean;
}

export interface MyProfilesResponse {
  bandProfiles: MyBandProfileSummary[];
  fanProfile: MyFanProfileSummary | null;
}
