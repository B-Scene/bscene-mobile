export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  kakaoOAuthUrl: process.env.EXPO_PUBLIC_KAKAO_OAUTH_URL ?? "",
  googleOAuthUrl: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_URL ?? "",
} as const;
