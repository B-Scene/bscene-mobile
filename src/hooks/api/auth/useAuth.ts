import { useMutation } from "@tanstack/react-query";

import {
  checkLoginId,
  exchangeOAuthCode,
  issueAppleLoginChallenge,
  login,
  loginWithAppleMobile,
  loginWithKakaoMobile,
  logout,
  oauthSignup,
  reissueToken,
  sendPhoneVerification,
  signup,
  verifyPhone,
} from "@/api/auth/auth";
import type {
  AppleMobileLoginRequest,
  KakaoMobileLoginRequest,
  LoginRequest,
  LogoutRequest,
  OAuthSignupRequest,
  ReissueRequest,
  SendPhoneVerificationRequest,
  SignupRequest,
  VerifyPhoneRequest,
} from "@/types/auth/auth";

export const useCheckLoginId = () => {
  return useMutation({
    mutationFn: checkLoginId,
  });
};

export const useSendPhoneVerification = () => {
  return useMutation({
    mutationFn: (body: SendPhoneVerificationRequest) =>
      sendPhoneVerification(body),
  });
};

export const useVerifyPhone = () => {
  return useMutation({
    mutationFn: (body: VerifyPhoneRequest) => verifyPhone(body),
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
  });
};

export const useReissueToken = () => {
  return useMutation({
    mutationFn: (body: ReissueRequest) => reissueToken(body),
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: (body: LogoutRequest) => logout(body),
  });
};

export const useOAuthSignup = () => {
  return useMutation({
    mutationFn: (body: OAuthSignupRequest) => oauthSignup(body),
  });
};

export const useOAuthExchange = () => {
  return useMutation({
    mutationFn: exchangeOAuthCode,
  });
};

export const useKakaoMobileLogin = () => {
  return useMutation({
    mutationFn: (body: KakaoMobileLoginRequest) =>
      loginWithKakaoMobile(body),
  });
};

export const useAppleLoginChallenge = () => {
  return useMutation({
    mutationFn: issueAppleLoginChallenge,
  });
};

export const useAppleMobileLogin = () => {
  return useMutation({
    mutationFn: (body: AppleMobileLoginRequest) =>
      loginWithAppleMobile(body),
  });
};
