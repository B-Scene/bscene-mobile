import axios from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import { config } from "@/shared/constants/config";
import type {
  AppleLoginChallengeResponse,
  AppleMobileLoginRequest,
  ApiResponse,
  CheckLoginIdResponse,
  KakaoMobileLoginRequest,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MobileOAuthResponse,
  OAuthExchangeResponse,
  OAuthSignupRequest,
  ReissueRequest,
  ReissueResponse,
  SendPhoneVerificationRequest,
  SendPhoneVerificationResponse,
  SignupRequest,
  SignupResponse,
  VerifyPhoneRequest,
} from "@/types/auth/auth";

const postPublicAuth = async <TResult, TBody = Record<string, never>>(
  path: string,
  body: TBody,
) => {
  const { data } = await axios.post<ApiResponse<TResult>>(
    `${config.apiBaseUrl.replace(/\/+$/, "")}${path}`,
    body,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return data.result;
};

export const checkLoginId = async (loginId: string) => {
  const { data } = await axiosInstance.get<ApiResponse<CheckLoginIdResponse>>(
    "/auth/login-id/check",
    { params: { loginId } },
  );

  return data.result;
};

export const signup = async (body: SignupRequest) => {
  const { data } = await axiosInstance.post<ApiResponse<SignupResponse>>(
    "/auth/signup",
    body,
  );

  return data.result;
};

export const sendPhoneVerification = async (
  body: SendPhoneVerificationRequest,
) => {
  const { data } = await axiosInstance.post<
    ApiResponse<SendPhoneVerificationResponse>
  >("/phone-verifications/send", body);

  return data.result;
};

export const verifyPhone = async (body: VerifyPhoneRequest) => {
  const { data } = await axiosInstance.post<ApiResponse<null>>(
    "/phone-verifications/verify",
    body,
  );

  return data.result;
};

export const login = async (body: LoginRequest) => {
  const { data } = await axiosInstance.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    body,
  );

  return data.result;
};

export const reissueToken = async (body: ReissueRequest) => {
  const { data } = await axiosInstance.post<ApiResponse<ReissueResponse>>(
    "/auth/reissue",
    body,
  );

  return data.result;
};

export const logout = async (body: LogoutRequest) => {
  const { data } = await axiosInstance.post<ApiResponse<null>>(
    "/auth/logout",
    body,
  );

  return data.result;
};

export const oauthSignup = async (body: OAuthSignupRequest) => {
  const { data } = await axiosInstance.post<ApiResponse<LoginResponse>>(
    "/auth/oauth/signup",
    body,
  );

  return data.result;
};

export const exchangeOAuthCode = async (code: string) => {
  const { data } = await axiosInstance.post<
    ApiResponse<OAuthExchangeResponse>
  >("/auth/oauth/exchange", { code });

  return data.result;
};

export const loginWithKakaoMobile = async (
  body: KakaoMobileLoginRequest,
) =>
  postPublicAuth<MobileOAuthResponse, KakaoMobileLoginRequest>(
    "/auth/oauth/mobile/kakao",
    body,
  );

export const issueAppleLoginChallenge = async () =>
  postPublicAuth<AppleLoginChallengeResponse>(
    "/auth/oauth/mobile/apple/challenge",
    {},
  );

export const loginWithAppleMobile = async (
  body: AppleMobileLoginRequest,
) =>
  postPublicAuth<MobileOAuthResponse, AppleMobileLoginRequest>(
    "/auth/oauth/mobile/apple",
    body,
  );
