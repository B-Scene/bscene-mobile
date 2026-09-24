import type {
  FanExploreBand,
  FanExploreBandDetail,
  FanExploreContent,
  FanExplorePerformance,
} from "@/types/fan/explore";

export type ExploreBandItem = {
  id: string;
  bandId: number | null;
  name: string;
  meta: string;
  description?: string | null;
  imageUrl?: string | null;
  followerCount: number;
  isFollowing: boolean;
};

export type ExplorePerformanceItem = {
  id: string;
  performanceId: number | null;
  title: string;
  meta: string;
  dateLabel: string;
  imageUrl?: string | null;
  status?: string | null;
};

export type ExploreContentItem = {
  id: string;
  postId: number | null;
  bandId: number | null;
  title: string;
  meta: string;
  description?: string | null;
  imageUrl?: string | null;
  likeCount: number;
  commentCount: number;
};

const toNumber = (value?: number | string | null) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const mapExploreBand = (
  band: FanExploreBand | FanExploreBandDetail,
  index = 0,
): ExploreBandItem => {
  const bandInfo = band.band ?? band;
  const bandId = toNumber(bandInfo.bandId) ?? toNumber(bandInfo.id);
  const name = bandInfo.name ?? bandInfo.bandName ?? band.name ?? band.bandName ?? "밴드명";
  const genre = bandInfo.genre ?? band.genre;
  const region = bandInfo.region ?? band.region;

  return {
    id: String(bandId ?? bandInfo.id ?? band.id ?? `${name}-${index}`),
    bandId,
    name,
    meta: [genre, region].filter(Boolean).join(" · ") || "장르 · 지역",
    description:
      bandInfo.description ??
      bandInfo.bandDescription ??
      bandInfo.introduction ??
      band.description ??
      band.bandDescription ??
      band.introduction,
    imageUrl:
      bandInfo.profileImageUrl ??
      bandInfo.bandProfileImageUrl ??
      bandInfo.imageUrl ??
      band.profileImageUrl ??
      band.bandProfileImageUrl ??
      band.imageUrl,
    followerCount:
      bandInfo.followerCount ??
      bandInfo.followersCount ??
      bandInfo.followerCnt ??
      bandInfo.followCount ??
      bandInfo.followers ??
      band.followerCount ??
      band.followersCount ??
      band.followerCnt ??
      band.followCount ??
      band.followers ??
      0,
    isFollowing:
      bandInfo.isFollowing ??
      bandInfo.following ??
      bandInfo.followed ??
      band.isFollowing ??
      band.following ??
      band.followed ??
    false,
  };
};

const toDate = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (date: Date | null) => {
  if (!date) return "일정 미정";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hour}:${minute}`;
};

const getPerformanceDate = (performance: FanExplorePerformance) => {
  const dateValue =
    performance.startAt ??
    performance.startedAt ??
    performance.startDateTime ??
    performance.performanceDate ??
    performance.startDate;
  const timeValue =
    performance.performanceTime ?? performance.startTime ?? performance.time;

  if (dateValue && timeValue && !dateValue.includes("T")) {
    return toDate(`${dateValue}T${timeValue}`);
  }

  return toDate(dateValue);
};

export const mapExplorePerformance = (
  performance: FanExplorePerformance,
  index = 0,
): ExplorePerformanceItem => {
  const performanceId =
    toNumber(performance.performanceId) ??
    toNumber(performance.concertId) ??
    toNumber(performance.id);
  const title =
    performance.performanceTitle ??
    performance.performanceName ??
    performance.concertTitle ??
    performance.concertName ??
    performance.title ??
    performance.name ??
    "공연명";
  const location =
    performance.location ?? performance.venue ?? performance.place ?? "장소 미정";

  return {
    id: String(performanceId ?? performance.id ?? `${title}-${index}`),
    performanceId,
    title,
    meta: location,
    dateLabel: formatDateTime(getPerformanceDate(performance)),
    imageUrl:
      performance.posterImageUrl ??
      performance.posterUrl ??
      performance.posterImage ??
      performance.performancePosterUrl ??
      performance.performanceImageUrl ??
      performance.imageUrl ??
      performance.thumbnailUrl,
    status: performance.status,
  };
};

const normalizeStringList = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
};

export const mapExploreContent = (
  content: FanExploreContent,
  index = 0,
): ExploreContentItem => {
  const contentInfo =
    typeof content.content === "object" && content.content != null
      ? content.content
      : content.post ?? content.detail ?? content;
  const bandInfo = contentInfo.band ?? content.band;
  const postId =
    toNumber(contentInfo.postId) ??
    toNumber(contentInfo.contentId) ??
    toNumber(contentInfo.id);
  const bandId = toNumber(contentInfo.bandId) ?? toNumber(bandInfo?.bandId);
  const title = contentInfo.title ?? "콘텐츠";
  const bandName =
    contentInfo.bandName ?? contentInfo.name ?? bandInfo?.bandName ?? bandInfo?.name;
  const mediaUrls = [
    ...normalizeStringList(contentInfo.mediaUrls),
    ...normalizeStringList(contentInfo.mediaUrl),
    ...normalizeStringList(contentInfo.imageUrls),
    ...normalizeStringList(contentInfo.images),
  ];

  return {
    id: String(postId ?? contentInfo.id ?? `${title}-${index}`),
    postId,
    bandId,
    title,
    meta:
      [bandName, contentInfo.type ?? contentInfo.mediaType ?? contentInfo.contentType]
        .filter(Boolean)
        .join(" · ") || "콘텐츠",
    description:
      typeof contentInfo.content === "string"
        ? contentInfo.content
        : contentInfo.contentText ?? contentInfo.body ?? contentInfo.text,
    imageUrl:
      contentInfo.thumbnailUrl ??
      contentInfo.videoThumbnailUrl ??
      contentInfo.imageUrl ??
      mediaUrls[0] ??
      bandInfo?.profileImageUrl ??
      bandInfo?.bandProfileImageUrl,
    likeCount: contentInfo.likeCount ?? contentInfo.likes ?? 0,
    commentCount: contentInfo.commentCount ?? contentInfo.comments ?? 0,
  };
};
