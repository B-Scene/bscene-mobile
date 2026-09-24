import type { BandApiResponse } from "@/types/band/band";

export type { BandApiResponse };

export type MusicEtcPlatform = "MELON" | "GENIE" | "BUGS" | "APPLE_MUSIC";

export interface MusicLinksResponse {
  spotifyUrl: string | null;
  youtubeUrl: string | null;
  soundcloudUrl: string | null;
  etcPlatform: MusicEtcPlatform | null;
  etcUrl: string | null;
  otherUrl: string | null;
}
