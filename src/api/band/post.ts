import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  CreatePostRequest,
  CreatePostResponse,
  GetPostsParams,
  PostDetailResponse,
  PostListResponse,
  UpdatePostRequest,
  UpdatePostResponse,
} from "@/types/band/post";

export const createPost = async (bandId: number, body: CreatePostRequest) => {
  const response = await axiosInstance.post<BandApiResponse<CreatePostResponse>>(
    `/bands/${bandId}/posts`,
    body,
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

export const updatePost = async (postId: number, body: UpdatePostRequest) => {
  const response = await axiosInstance.put<BandApiResponse<UpdatePostResponse>>(
    `/posts/${postId}`,
    body,
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
