import { axiosInstance } from "@/api/axiosInstance";
import { secureTokenStorage } from "@/shared/utils/secureTokenStorage";
import type { ApiResponse } from "@/types/auth/auth";
import type {
  ChangeUserModeRequest,
  ChangeUserModeResponse,
} from "@/types/user/mode";

const persistModeTokens = async (result: ChangeUserModeResponse | null) => {
  const accessToken = result?.accessToken ?? result?.token?.accessToken;
  const refreshToken =
    result?.refreshToken ??
    result?.token?.refreshToken ??
    (await secureTokenStorage.getRefreshToken());

  if (!accessToken || !refreshToken) return;

  await secureTokenStorage.setTokens({ accessToken, refreshToken });
};

export const changeUserMode = async (body: ChangeUserModeRequest) => {
  const { data } = await axiosInstance.patch<
    ApiResponse<ChangeUserModeResponse | null>
  >("/users/me/mode", body);

  if (!data.isSuccess) {
    throw new Error(data.message || "모드 전환에 실패했어요.");
  }

  await persistModeTokens(data.result);

  return data.result;
};

export const toggleUserMode = async () => {
  const { data } = await axiosInstance.put<
    ApiResponse<ChangeUserModeResponse | null>
  >("/users/me/mode");

  if (!data.isSuccess) {
    throw new Error(data.message || "모드 전환에 실패했어요.");
  }

  await persistModeTokens(data.result);

  return data.result;
};
