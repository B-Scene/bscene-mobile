export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  kakaoNativeAppKey:
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? "",
  kakaoOAuthUrl: process.env.EXPO_PUBLIC_KAKAO_OAUTH_URL ?? "",
  googleOAuthUrl: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_URL ?? "",
} as const;
