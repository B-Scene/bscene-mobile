import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBand } from "@/api/band/band";
import { getMusicLinks } from "@/api/band/musicLink";
import {
  deletePerformance,
  getPerformance,
  getPerformances,
} from "@/api/band/performance";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "@/api/band/post";
import type {
  CreatePostRequest,
  UpdatePostRequest,
} from "@/types/band/post";

export const bandKeys = {
  all: ["band"] as const,
  detail: (bandId: number) => [...bandKeys.all, "detail", bandId] as const,
  performances: (bandId: number) =>
    [...bandKeys.all, "performances", bandId] as const,
  performanceDetail: (performanceId: number) =>
    [...bandKeys.all, "performanceDetail", performanceId] as const,
  posts: (bandId: number) => [...bandKeys.all, "posts", bandId] as const,
  postDetail: (postId: number) =>
    [...bandKeys.all, "postDetail", postId] as const,
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

export const useBandPerformanceQuery = (performanceId: number | null) => {
  return useQuery({
    queryKey: bandKeys.performanceDetail(performanceId ?? 0),
    queryFn: () => getPerformance(performanceId ?? 0),
    enabled: Boolean(performanceId && performanceId > 0),
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

export const useBandPostQuery = (postId: number | null) => {
  return useQuery({
    queryKey: bandKeys.postDetail(postId ?? 0),
    queryFn: () => getPost(postId ?? 0),
    enabled: Boolean(postId && postId > 0),
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

export const useCreateBandPost = (bandId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePostRequest) => createPost(bandId ?? 0, body),
    onSuccess: async () => {
      await Promise.all([
        bandId
          ? queryClient.invalidateQueries({ queryKey: bandKeys.posts(bandId) })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: bandKeys.all }),
      ]);
    },
  });
};

export const useUpdateBandPost = (postId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdatePostRequest) => updatePost(postId ?? 0, body),
    onSuccess: async () => {
      await Promise.all([
        postId
          ? queryClient.invalidateQueries({ queryKey: bandKeys.postDetail(postId) })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: bandKeys.all }),
      ]);
    },
  });
};

export const useDeleteBandPerformance = (bandId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePerformance,
    onSuccess: async (_data, performanceId) => {
      await Promise.all([
        bandId
          ? queryClient.invalidateQueries({
              queryKey: bandKeys.performances(bandId),
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({
          queryKey: bandKeys.performanceDetail(performanceId),
        }),
        queryClient.invalidateQueries({ queryKey: bandKeys.all }),
      ]);
    },
  });
};

export const useDeleteBandPost = (bandId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: async (_data, postId) => {
      await Promise.all([
        bandId
          ? queryClient.invalidateQueries({ queryKey: bandKeys.posts(bandId) })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: bandKeys.postDetail(postId) }),
        queryClient.invalidateQueries({ queryKey: bandKeys.all }),
      ]);
    },
  });
};
