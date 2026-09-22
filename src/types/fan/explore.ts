export interface FanExploreApiResponse<T> {
  isSuccess: boolean;
  status?: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
}

export interface FanExploreRecommendationParams {
  cursor?: number;
  size?: number;
  withDummy?: boolean;
}

export interface FanExploreBand {
  band?: FanExploreBand;
  bandId?: number;
  id?: number | string;
  name?: string;
  bandName?: string;
  genre?: string | null;
  region?: string | null;
  profileImageUrl?: string | null;
  bandProfileImageUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  bandDescription?: string | null;
  introduction?: string | null;
  followerCount?: number;
  followersCount?: number;
  followCount?: number;
  followerCnt?: number;
  followers?: number;
  isFollowing?: boolean;
  following?: boolean;
  followed?: boolean;
  score?: number;
  recommendationScore?: number;
  contentTypes?: string[];
}

export interface FanExploreBandDetail extends FanExploreBand {
  profile?: FanExploreBandDetail;
  bandProfile?: FanExploreBandDetail;
  bandDetail?: FanExploreBandDetail;
  bandInfo?: FanExploreBandDetail;
  isOfficial?: boolean;
  official?: boolean;
  isLive?: boolean;
  live?: boolean;
  liveId?: number | string | null;
}

export interface FanExplorePageResponse<T> {
  items?: T[];
  content?: T[];
  data?: T[];
  list?: T[];
  results?: T[];
  recommendations?: T[];
  recommendedBands?: T[];
  recommendBands?: T[];
  bandRecommendations?: T[];
  hasNext?: boolean;
  nextCursor?: number | string | null;
  page?: number;
}

export interface NormalizedFanExploreBandsResponse
  extends FanExplorePageResponse<FanExploreBand> {
  items: FanExploreBand[];
  hasNext: boolean;
  page: number;
  nextCursor: number | null;
}
