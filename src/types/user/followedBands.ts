import type { UserApiResponse } from "@/types/user/myPage";

export type { UserApiResponse };

export interface GetFollowedBandsParams {
  page?: number;
  size?: number;
}

export interface FollowedBandItem {
  band?: FollowedBandItem;
  bandId?: number;
  targetBandId?: number;
  followingBandId?: number;
  followedBandId?: number;
  followId?: number;
  id?: number | string;
  name?: string;
  bandName?: string;
  genre?: string | null;
  region?: string | null;
  profileImageUrl?: string | null;
  bandProfileImageUrl?: string | null;
  imageUrl?: string | null;
  followerCount?: number;
  followers?: number;
}

export interface FollowedBandsResponse {
  totalCount: number | null;
  items: FollowedBandItem[];
  page: number;
  hasNext: boolean;
}
