export interface FanApiResponse<T> {
  isSuccess: boolean;
  status?: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
}

export interface FanHomeNewsItem {
  newsId?: number;
  postId?: number;
  contentId?: number;
  id?: number | string;
  bandId?: number;
  bandName?: string;
  bandProfileImageUrl?: string | null;
  bandImageUrl?: string | null;
  profileImageUrl?: string | null;
  genre?: string | null;
  region?: string | null;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  contentImageUrl?: string | null;
  thumbnailUrl?: string | null;
  mediaUrl?: string[] | string;
  mediaUrls?: string[] | string;
  imageUrls?: string[] | string;
  tags?: string[];
  createdAt?: string | null;
  postedAgo?: number | null;
}

export interface FanHomeRecommendedBand {
  band?: FanHomeRecommendedBand;
  bandId?: number;
  targetBandId?: number;
  followingBandId?: number;
  followedBandId?: number;
  recommendedBandId?: number;
  id?: number | string;
  bandName?: string;
  name?: string;
  bandProfileImageUrl?: string | null;
  bandImageUrl?: string | null;
  profileImageUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  genre?: string | null;
  region?: string | null;
  description?: string | null;
  bandDescription?: string | null;
  introduction?: string | null;
  followerCount?: number;
  followersCount?: number;
  followers?: number;
  isFollowing?: boolean;
  following?: boolean;
  followed?: boolean;
}

export interface FanHomeConcert {
  performanceId?: number;
  concertId?: number;
  id?: number | string;
  performanceTitle?: string;
  performanceName?: string;
  concertName?: string;
  concertTitle?: string;
  showTitle?: string;
  showName?: string;
  name?: string;
  title?: string;
  location?: string | null;
  venue?: string | null;
  place?: string | null;
  performanceImageUrl?: string | null;
  posterImageUrl?: string | null;
  posterUrl?: string | null;
  imageUrl?: string | null;
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | string;
  startAt?: string | null;
  startedAt?: string | null;
  startDateTime?: string | null;
  performanceDate?: string | null;
  performanceTime?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  time?: string | null;
  dDay?: number | null;
  status?: string | null;
  isInterested?: boolean;
  interested?: boolean;
  interestCount?: number;
}

export type PerformanceParticipationStatus = "SCHEDULED" | "COMPLETED";

export interface FanPerformanceCastingBand {
  band?: FanPerformanceCastingBand;
  profile?: FanPerformanceCastingBand;
  bandProfile?: FanPerformanceCastingBand;
  bandInfo?: FanPerformanceCastingBand;
  bandId?: number | string;
  targetBandId?: number | string;
  id?: number | string;
  bandName?: string;
  name?: string;
  profileImageUrl?: string | null;
  bandProfileImageUrl?: string | null;
  bandImageUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  genre?: string | null;
  bandGenre?: string | null;
  region?: string | null;
  bandRegion?: string | null;
  description?: string | null;
  bandDescription?: string | null;
  introduction?: string | null;
}

export interface FanPerformanceDetailResponse {
  performanceId: number;
  performanceTitle?: string;
  performanceName?: string;
  concertTitle?: string;
  concertName?: string;
  showTitle?: string;
  showName?: string;
  name?: string;
  title?: string;
  genre?: string | null;
  region?: string | null;
  location?: string | null;
  venue?: string | null;
  performanceDate?: string | null;
  performanceTime?: string | null;
  startAt?: string | null;
  startedAt?: string | null;
  startDateTime?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  time?: string | null;
  ticketPrice?: string | number | null;
  price?: string | number | null;
  ageRating?: string | null;
  ticketLink?: string | null;
  introduction?: string | null;
  description?: string | null;
  content?: string | null;
  tags?: string[];
  posterImageUrl?: string | null;
  performanceImageUrl?: string | null;
  posterUrl?: string | null;
  imageUrl?: string | null;
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | string;
  isInterested?: boolean;
  interested?: boolean;
  interestCount?: number;
  notificationEnabled?: boolean;
  alarmSet?: boolean;
  isAlarmSet?: boolean;
  alarmEnabled?: boolean;
  participationStatus?: PerformanceParticipationStatus | null;
  casting?: FanPerformanceCastingBand[];
}

export interface FanHomeResponse {
  hasFollowingBands?: boolean;
  hasUnreadNotification?: boolean;
  hasUnreadNotifications?: boolean;
  performanceType?: "UPCOMING" | "RECOMMENDED";
  followingBandNews?: FanHomeNewsItem[];
  followedBandNews?: FanHomeNewsItem[];
  followedNews?: FanHomeNewsItem[];
  news?: FanHomeNewsItem[];
  recommendedBands?: FanHomeRecommendedBand[];
  recommendBands?: FanHomeRecommendedBand[];
  performances?: FanHomeConcert[];
  upcomingConcerts?: FanHomeConcert[];
  followedConcerts?: FanHomeConcert[];
  recommendedConcerts?: FanHomeConcert[];
  recommendConcerts?: FanHomeConcert[];
  popularConcerts?: FanHomeConcert[];
}

export type UpcomingPerformanceSort = "IMMINENT" | "LATEST" | "POPULAR";

export interface UpcomingPerformancesParams {
  sort?: UpcomingPerformanceSort;
  page?: number;
  size?: number;
}

export interface UpcomingPerformancesResponse {
  items?: FanHomeConcert[];
  content?: FanHomeConcert[];
  performances?: FanHomeConcert[];
  upcomingPerformances?: FanHomeConcert[];
  data?: FanHomeConcert[];
  list?: FanHomeConcert[];
  hasNext?: boolean;
  nextPage?: number | null;
  page?: number;
  size?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
  totalElements?: number;
  total?: number;
}

export interface NormalizedUpcomingPerformancesResponse
  extends UpcomingPerformancesResponse {
  items: FanHomeConcert[];
  hasNext: boolean;
  page: number;
}
