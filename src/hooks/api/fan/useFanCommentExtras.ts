import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    updateFanPostComment,
} from "@/api/fan/comments";

import {
    getFanExplorePostComments,
} from "@/api/fan/explore";

import {
    fanExploreKeys,
} from "@/hooks/api/fan/useFanExplore";

export const useFanExplorePostCommentsInfiniteQuery =
  (
    postId: number,
  ) => {
    return useInfiniteQuery({
      queryKey: [
        ...fanExploreKeys.postComments(
          postId,
        ),
        "infinite",
      ],

      queryFn: ({
        pageParam,
      }) =>
        getFanExplorePostComments(
          postId,
          {
            cursor:
              pageParam,
            size: 10,
          },
        ),

      initialPageParam:
        undefined as number | undefined,

      getNextPageParam: (
        lastPage,
      ) =>
        lastPage.hasNext
          ? lastPage.nextCursor ??
            undefined
          : undefined,

      enabled:
        postId > 0,

      staleTime:
        1000 * 30,
    });
  };

export const useUpdateFanPostComment =
  (
    postId: number,
  ) => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        commentId,
        content,
      }: {
        commentId: number;
        content: string;
      }) =>
        updateFanPostComment({
          postId,
          commentId,
          content,
        }),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            fanExploreKeys.postComments(
              postId,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            fanExploreKeys.postDetail(
              postId,
            ),
        });
      },
    });
  };