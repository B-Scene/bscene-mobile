import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFanExplorePostComment,
  deleteFanExplorePostComment,
  followExploreBand,
  getFanExploreBandDetail,
  getFanExplorePostComments,
  getFanExplorePostDetail,
  getRecommendedExploreBands,
  likeFanExplorePost,
  searchFanExploreBands,
  searchFanExploreContents,
  searchFanExplorePerformances,
  unlikeFanExplorePost,
  unfollowExploreBand,
} from "@/api/fan/explore";
import { followedBandsKeys } from "@/hooks/api/user/useFollowedBands";
import type {
  FanExploreRecommendationParams,
  FanExploreSearchParams,
  UpsertFanExplorePostCommentRequest,
} from "@/types/fan/explore";

export const fanExploreKeys = {
  all: ["fanExplore"] as const,
  recommendedBands: (params: FanExploreRecommendationParams) =>
    [...fanExploreKeys.all, "recommendedBands", params] as const,
  searchBands: (params: Omit<FanExploreSearchParams, "cursor">) =>
    [...fanExploreKeys.all, "searchBands", params] as const,
  searchPerformances: (params: Omit<FanExploreSearchParams, "cursor">) =>
    [...fanExploreKeys.all, "searchPerformances", params] as const,
  searchContents: (params: Omit<FanExploreSearchParams, "cursor">) =>
    [...fanExploreKeys.all, "searchContents", params] as const,
  bandDetail: (bandId: number) =>
    [...fanExploreKeys.all, "bandDetail", bandId] as const,
  postDetail: (postId: number) =>
    [...fanExploreKeys.all, "postDetail", postId] as const,
  postComments: (postId: number) =>
    [...fanExploreKeys.all, "postComments", postId] as const,
};

export const useRecommendedExploreBandsInfiniteQuery = (
  params: FanExploreRecommendationParams = {},
) => {
  return useInfiniteQuery({
    queryKey: fanExploreKeys.recommendedBands(params),
    queryFn: ({ pageParam }) =>
      getRecommendedExploreBands({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 30,
  });
};

export const useFanExploreBandDetailQuery = (bandId: number) => {
  return useQuery({
    queryKey: fanExploreKeys.bandDetail(bandId),
    queryFn: () => getFanExploreBandDetail(bandId),
    enabled: bandId > 0,
    staleTime: 1000 * 30,
  });
};

export const useFanExplorePostDetailQuery = (postId: number) => {
  return useQuery({
    queryKey: fanExploreKeys.postDetail(postId),
    queryFn: () => getFanExplorePostDetail(postId),
    enabled: postId > 0,
    staleTime: 1000 * 30,
  });
};

export const useFanExplorePostCommentsQuery = (postId: number) => {
  return useQuery({
    queryKey: fanExploreKeys.postComments(postId),
    queryFn: () => getFanExplorePostComments(postId),
    enabled: postId > 0,
    staleTime: 1000 * 30,
  });
};

export const useFanExploreBandSearchQuery = (
  params: Omit<FanExploreSearchParams, "cursor">,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: fanExploreKeys.searchBands(params),
    queryFn: ({ pageParam }) =>
      searchFanExploreBands({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? String(lastPage.nextCursor ?? "") || undefined : undefined,
    enabled: enabled && params.keyword.trim().length > 0,
    staleTime: 1000 * 30,
  });
};

export const useFanExplorePerformanceSearchQuery = (
  params: Omit<FanExploreSearchParams, "cursor">,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: fanExploreKeys.searchPerformances(params),
    queryFn: ({ pageParam }) =>
      searchFanExplorePerformances({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? String(lastPage.nextCursor ?? "") || undefined : undefined,
    enabled: enabled && params.keyword.trim().length > 0,
    staleTime: 1000 * 30,
  });
};

export const useFanExploreContentSearchQuery = (
  params: Omit<FanExploreSearchParams, "cursor">,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: fanExploreKeys.searchContents(params),
    queryFn: ({ pageParam }) =>
      searchFanExploreContents({
        ...params,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? String(lastPage.nextCursor ?? "") || undefined : undefined,
    enabled: enabled && params.keyword.trim().length > 0,
    staleTime: 1000 * 30,
  });
};

export const useFollowExploreBand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followExploreBand,
    onSuccess: (_data, bandId) => {
      queryClient.invalidateQueries({ queryKey: fanExploreKeys.all });
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.bandDetail(bandId),
      });
      queryClient.invalidateQueries({ queryKey: followedBandsKeys.all });
    },
  });
};

export const useUnfollowExploreBand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowExploreBand,
    onSuccess: (_data, bandId) => {
      queryClient.invalidateQueries({ queryKey: fanExploreKeys.all });
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.bandDetail(bandId),
      });
      queryClient.invalidateQueries({ queryKey: followedBandsKeys.all });
    },
  });
};

export const useLikeFanExplorePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likeFanExplorePost,
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.postDetail(postId),
      });
      queryClient.invalidateQueries({ queryKey: fanExploreKeys.all });
    },
  });
};

export const useUnlikeFanExplorePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlikeFanExplorePost,
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.postDetail(postId),
      });
      queryClient.invalidateQueries({ queryKey: fanExploreKeys.all });
    },
  });
};

export const useCreateFanExplorePostComment = (postId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertFanExplorePostCommentRequest) =>
      createFanExplorePostComment(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.postComments(postId),
      });
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.postDetail(postId),
      });
    },
  });
};

export const useDeleteFanExplorePostComment = (postId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) =>
      deleteFanExplorePostComment({ postId, commentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.postComments(postId),
      });
      queryClient.invalidateQueries({
        queryKey: fanExploreKeys.postDetail(postId),
      });
    },
  });
};
