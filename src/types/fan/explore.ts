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

export type FanExploreSearchSort = "POPULAR" | "LATEST";

export interface FanExploreSearchParams {
  keyword: string;
  sort?: FanExploreSearchSort;
  cursor?: string;
  size?: number;
  genre?: string;
  region?: string;
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

export interface FanExplorePerformance {
  performanceId?: number;
  concertId?: number;
  id?: number | string;
  performanceTitle?: string;
  performanceName?: string;
  concertTitle?: string;
  concertName?: string;
  title?: string;
  name?: string;
  location?: string | null;
  venue?: string | null;
  place?: string | null;
  posterImageUrl?: string | null;
  posterUrl?: string | null;
  posterImage?: string | null;
  performancePosterUrl?: string | null;
  performanceImageUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  startAt?: string | null;
  startedAt?: string | null;
  startDateTime?: string | null;
  performanceDate?: string | null;
  performanceTime?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  time?: string | null;
  status?: string | null;
}

export interface FanExploreContent {
  post?: FanExploreContent;
  content?: FanExploreContent | string | null;
  detail?: FanExploreContent;
  band?: FanExploreBand;
  contentId?: number;
  postId?: number;
  id?: number | string;
  bandId?: number;
  bandName?: string | null;
  name?: string | null;
  genre?: string | null;
  region?: string | null;
  profileImageUrl?: string | null;
  bandProfileImageUrl?: string | null;
  type?: string | null;
  title?: string | null;
  contentText?: string | null;
  body?: string | null;
  text?: string | null;
  mediaType?: string | null;
  contentType?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  videoThumbnailUrl?: string | null;
  mediaUrl?: string[] | string;
  mediaUrls?: string[] | string;
  imageUrls?: string[] | string;
  images?: string[] | string;
  tags?: string[] | string | null;
  likes?: number;
  comments?: number;
  liked?: boolean;
  createdAt?: string | null;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
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
  bands?: T[];
  performances?: T[];
  concerts?: T[];
  posts?: T[];
  contents?: T[];
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

export interface NormalizedFanExplorePerformancesResponse
  extends FanExplorePageResponse<FanExplorePerformance> {
  items: FanExplorePerformance[];
  hasNext: boolean;
  page: number;
  nextCursor: number | null;
}

export interface NormalizedFanExploreContentsResponse
  extends FanExplorePageResponse<FanExploreContent> {
  items: FanExploreContent[];
  hasNext: boolean;
  page: number;
  nextCursor: number | null;
}
