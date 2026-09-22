import type {
  FanHomeConcert,
  FanPerformanceCastingBand,
  FanPerformanceDetailResponse,
} from "@/types/fan/home";

export type ConcertListItem = {
  id: string;
  performanceId: number | null;
  title: string;
  location: string;
  dateTime: string;
  status: string;
  isInterested: boolean;
  interestCount: number;
};

export const firstString = (
  ...values: (string | string[] | null | undefined)[]
) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value[0];
    if (typeof value === "string" && value.length > 0) return value;
  }

  return undefined;
};

export const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getConcertDate = (concert: FanHomeConcert | FanPerformanceDetailResponse) => {
  const dateValue =
    concert.startAt ??
    concert.startedAt ??
    concert.startDateTime ??
    concert.performanceDate ??
    concert.startDate;
  const timeValue = concert.performanceTime ?? concert.startTime ?? concert.time;

  if (dateValue && timeValue && !dateValue.includes("T")) {
    return toDate(`${dateValue}T${timeValue}`);
  }

  return toDate(dateValue);
};

export const formatDateTime = (date: Date | null) => {
  if (!date) return "일정 미정";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hour}:${minute}`;
};

export const formatDday = (
  concert: FanHomeConcert | FanPerformanceDetailResponse,
  date: Date | null,
) => {
  if ("dDay" in concert && typeof concert.dDay === "number") {
    if (concert.dDay < 0) return "종료";
    if (concert.dDay === 0) return "D-DAY";
    return `D-${concert.dDay}`;
  }

  if (!date) return "준비중";

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.ceil(
    (dateStart.getTime() - todayStart.getTime()) / 86_400_000,
  );

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-DAY";
  return `D-${diffDays}`;
};

export const getConcertTitle = (
  concert?: FanHomeConcert | FanPerformanceDetailResponse,
) => {
  return (
    concert?.performanceTitle ??
    concert?.performanceName ??
    concert?.concertTitle ??
    concert?.concertName ??
    concert?.showTitle ??
    concert?.showName ??
    concert?.name ??
    concert?.title ??
    "공연명"
  );
};

export const getConcertLocation = (
  concert?: FanHomeConcert | FanPerformanceDetailResponse,
) => {
  return concert?.location ?? concert?.venue ?? "공연 장소 미정";
};

export const mapPerformanceToConcert = (
  concert: FanHomeConcert,
  index: number,
): ConcertListItem => {
  const date = getConcertDate(concert);
  const performanceId = Number(
    concert.performanceId ?? concert.concertId ?? concert.id,
  );

  return {
    id: String(concert.performanceId ?? concert.concertId ?? concert.id ?? index),
    performanceId: Number.isFinite(performanceId) ? performanceId : null,
    title: getConcertTitle(concert),
    location: getConcertLocation(concert),
    dateTime: formatDateTime(date),
    status: concert.status ?? formatDday(concert, date),
    isInterested: concert.isInterested ?? concert.interested ?? false,
    interestCount: concert.interestCount ?? 0,
  };
};

export const getDetailPosterImageUrl = (detail?: FanPerformanceDetailResponse) => {
  if (!detail) return undefined;

  return firstString(
    detail.posterImageUrl,
    detail.posterUrl,
    detail.performanceImageUrl,
    detail.imageUrl,
    detail.mainImageUrl,
    detail.thumbnailUrl,
    detail.imageUrls,
  );
};

export const getCastingBandInfo = (band: FanPerformanceCastingBand) => {
  return band.band ?? band.profile ?? band.bandProfile ?? band.bandInfo ?? band;
};
