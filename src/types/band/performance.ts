import type { BandApiResponse } from "@/types/band/band";

export type { BandApiResponse };

export type PerformanceGenre = string;
export type PerformanceAgeRating = "ALL" | "AGE_12" | "AGE_15" | "AGE_19";

export interface CreatePerformanceRequest {
  title: string;
  performanceDate: string;
  startTime: string;
  region: string;
  venue: string;
  description: string;
  ticketPrice: string;
  ticketLink?: string;
  posterImageUrl?: string;
  genre: PerformanceGenre;
  ageRating: PerformanceAgeRating;
  tags?: string[];
}

export interface PerformanceListItem {
  performanceId: number;
  title: string;
  performanceDate: string;
  venue: string;
  posterImageUrl: string | null;
}

export interface PerformanceListResponse {
  performances: PerformanceListItem[];
}

export interface PerformanceResponse {
  performanceId: number;
  title: string;
  genre: PerformanceGenre;
  performanceDate: string;
  startTime: string;
  region: string;
  venue: string;
  description: string;
  ticketPrice: string;
  ticketLink: string | null;
  posterImageUrl: string | null;
  ageRating: PerformanceAgeRating;
  tags: string[];
  interestCount: number;
  isInterested: boolean;
}

export type CreatePerformanceResponse = PerformanceResponse;

export interface UpdatePerformanceRequest {
  title?: string;
  genre?: PerformanceGenre;
  performanceDate?: string;
  startTime?: string;
  region?: string;
  venue?: string;
  description?: string;
  ticketPrice?: string;
  ticketLink?: string;
  posterImageUrl?: string;
  ageRating?: PerformanceAgeRating;
  tags?: string[];
}

export type UpdatePerformanceResponse = PerformanceResponse;
