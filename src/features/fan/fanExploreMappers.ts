import type {
  FanExploreBand,
  FanExploreBandDetail,
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
