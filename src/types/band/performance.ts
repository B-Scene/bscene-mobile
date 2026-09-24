import type { BandApiResponse } from "@/types/band/band";

export type { BandApiResponse };

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
