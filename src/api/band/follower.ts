import { axiosInstance } from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/auth/auth";
import type {
  BandFollowersResponse,
  GetBandFollowersParams,
} from "@/types/band/follower";

export const getBandFollowers = async (params: GetBandFollowersParams = {}) => {
  const { data } = await axiosInstance.get<ApiResponse<BandFollowersResponse>>(
    "/bands/follower",
    { params },
  );

  return data.result;
};
