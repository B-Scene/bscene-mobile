import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  GetPostsParams,
  PostDetailResponse,
  PostListResponse,
} from "@/types/band/post";

export const getPosts = async (
  bandId: number,
  params: GetPostsParams = {},
) => {
  const response = await axiosInstance.get<BandApiResponse<PostListResponse>>(
    `/bands/${bandId}/posts`,
    { params },
  );
  const { data } = response;

  if (!data.isSuccess || data.result == null) {
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

export const getPost = async (postId: number) => {
  const response = await axiosInstance.get<BandApiResponse<PostDetailResponse>>(
    `/posts/${postId}`,
  );
  const { data } = response;

  if (!data.isSuccess || data.result == null) {
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

export const deletePost = async (postId: number) => {
  const response = await axiosInstance.delete<BandApiResponse<null>>(
    `/posts/${postId}`,
  );
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
