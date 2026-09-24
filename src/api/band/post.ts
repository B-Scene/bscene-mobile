import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  BandApiResponse,
  GetPostsParams,
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
