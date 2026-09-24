export interface BandApiResponse<T> {
  isSuccess: boolean;
  status?: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
}

export interface BandDetailResponse {
  bandId: number;
  ownerId: number;
  name: string;
  genre: string;
  region: string;
  profileImageUrl: string | null;
  description: string | null;
  followerCount: number;
  memberCount: number;
  performanceCount: number;
}
