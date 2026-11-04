import { axiosInstance } from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/auth/auth";
import type {
  GetPostingManagementParams,
  PostingManagementResponse,
} from "@/types/user/postingManagement";

export const getPostingManagement = async (
  params: GetPostingManagementParams,
) => {
  const { data } = await axiosInstance.get<
    ApiResponse<PostingManagementResponse>
  >("/sessions/recruitments/manage", { params });

  return data.result;
};
