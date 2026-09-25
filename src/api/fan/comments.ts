import {
    AxiosError,
    type AxiosResponse,
} from "axios";

import { axiosInstance } from "@/api/axiosInstance";

import type {
    FanExploreApiResponse,
    FanExplorePostComment,
    UpsertFanExplorePostCommentRequest,
} from "@/types/fan/explore";

const assertMutationSuccess = <T>(
  response: AxiosResponse<
    FanExploreApiResponse<T>
  >,
) => {
  const { data } = response;

  if (!data.isSuccess) {
    throw new AxiosError(
      data.message,
      data.code,
      response.config,
      response.request,
      response,
    );
  }

  return data.result;
};

export const updateFanPostComment =
  async ({
    postId,
    commentId,
    content,
  }: {
    postId: number;
    commentId: number;
    content: string;
  }) => {
    const body: UpsertFanExplorePostCommentRequest =
      {
        content,
      };

    const response =
      await axiosInstance.patch<
        FanExploreApiResponse<FanExplorePostComment | null>
      >(
        `/posts/${postId}/comments/${commentId}`,
        body,
      );

    return assertMutationSuccess(
      response,
    );
  };