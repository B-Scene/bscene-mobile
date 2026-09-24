import { useQuery } from "@tanstack/react-query";

import { getBand } from "@/api/band/band";
import { getMusicLinks } from "@/api/band/musicLink";
import { getPerformances } from "@/api/band/performance";
import { getPosts } from "@/api/band/post";

export const bandKeys = {
  all: ["band"] as const,
  detail: (bandId: number) => [...bandKeys.all, "detail", bandId] as const,
  performances: (bandId: number) =>
    [...bandKeys.all, "performances", bandId] as const,
  posts: (bandId: number) => [...bandKeys.all, "posts", bandId] as const,
  musicLinks: (bandId: number) =>
    [...bandKeys.all, "musicLinks", bandId] as const,
};

export const useBandQuery = (bandId: number | null) => {
  return useQuery({
    queryKey: bandKeys.detail(bandId ?? 0),
    queryFn: () => getBand(bandId ?? 0),
    enabled: Boolean(bandId && bandId > 0),
    staleTime: 1000 * 30,
  });
};

export const useBandPerformancesQuery = (bandId: number | null) => {
  return useQuery({
    queryKey: bandKeys.performances(bandId ?? 0),
    queryFn: () => getPerformances(bandId ?? 0),
    enabled: Boolean(bandId && bandId > 0),
    staleTime: 1000 * 30,
  });
};

export const useBandPostsQuery = (bandId: number | null) => {
  return useQuery({
    queryKey: bandKeys.posts(bandId ?? 0),
    queryFn: () => getPosts(bandId ?? 0, { size: 10 }),
    enabled: Boolean(bandId && bandId > 0),
    staleTime: 1000 * 30,
  });
};

export const useBandMusicLinksQuery = (bandId: number | null) => {
  return useQuery({
    queryKey: bandKeys.musicLinks(bandId ?? 0),
    queryFn: () => getMusicLinks(bandId ?? 0),
    enabled: Boolean(bandId && bandId > 0),
    staleTime: 1000 * 30,
  });
};
