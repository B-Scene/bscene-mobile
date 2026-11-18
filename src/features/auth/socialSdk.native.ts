import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { login as kakaoLogin } from "@react-native-kakao/user";

import type { AppleSdkCredential } from "@/features/auth/socialSdk";

export const loginWithKakaoSdk = async () => {
  const token = await kakaoLogin();

  if (!token.accessToken) {
    throw new Error("카카오 Access Token을 받지 못했습니다.");
  }

  return token.accessToken;
};

export const loginWithAppleSdk = async (
  nonce: string,
): Promise<AppleSdkCredential> => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple SDK 로그인은 iOS에서만 지원합니다.");
  }

  const available = await AppleAuthentication.isAvailableAsync();

  if (!available) {
    throw new Error("이 기기에서는 Apple 로그인을 사용할 수 없습니다.");
  }

  const credential = await AppleAuthentication.signInAsync({
    nonce,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken || !credential.authorizationCode) {
    throw new Error("Apple 로그인 인증 정보를 받지 못했습니다.");
  }

  return {
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
  };
};

export const isSocialSdkCancellation = (error: unknown) => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  const code = String(error.code);

  return (
    code === "ERR_REQUEST_CANCELED" ||
    code.toLowerCase().includes("cancel")
  );
};
