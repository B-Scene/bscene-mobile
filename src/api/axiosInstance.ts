import axios, { AxiosError, create, type InternalAxiosRequestConfig } from "axios";

import { config } from "@/shared/constants/config";
import { secureTokenStorage } from "@/shared/utils/secureTokenStorage";
import type { ApiResponse, ReissueResponse } from "@/types/auth/auth";

export const axiosInstance = create({
  baseURL: config.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

let reissueRequest: Promise<ReissueResponse> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

const clearAuth = async () => {
  await secureTokenStorage.clearTokens();
  unauthorizedHandler?.();
};

export const reissueAccessToken = async (): Promise<ReissueResponse> => {
  if (reissueRequest) return reissueRequest;

  const refreshToken = await secureTokenStorage.getRefreshToken();

  if (!refreshToken) {
    await clearAuth();
    throw new Error("refreshToken이 없습니다.");
  }

  const request = axios
    .post<ApiResponse<ReissueResponse>>(
      `${config.apiBaseUrl}/auth/reissue`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    .then(async ({ data }) => {
      await secureTokenStorage.setTokens({
        accessToken: data.result.accessToken,
        refreshToken: data.result.refreshToken,
      });

      return data.result;
    })
    .catch(async (error: unknown) => {
      await clearAuth();
      throw error;
    });

  reissueRequest = request.finally(() => {
    reissueRequest = null;
  });

  return reissueRequest;
};

axiosInstance.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    const accessToken = await secureTokenStorage.getAccessToken();

    if (accessToken) {
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;
    }

    return requestConfig;
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _tokenRetry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const authorization =
      originalRequest.headers.Authorization ??
      originalRequest.headers.get?.("Authorization");
    const requestAccessToken =
      typeof authorization === "string"
        ? authorization.replace(/^Bearer\s+/i, "").trim()
        : "";
    const currentAccessToken = await secureTokenStorage.getAccessToken();

    if (
      currentAccessToken &&
      requestAccessToken &&
      currentAccessToken !== requestAccessToken &&
      !originalRequest._tokenRetry
    ) {
      originalRequest._tokenRetry = true;
      originalRequest.headers.Authorization = `Bearer ${currentAccessToken}`;
      return axiosInstance(originalRequest);
    }

    originalRequest._retry = true;

    try {
      const { accessToken } = await reissueAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (reissueError) {
      return Promise.reject(reissueError);
    }
  },
);
