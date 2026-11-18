import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const kakaoNativeAppKey =
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim();
  const plugins = [...(config.plugins ?? [])];

  if (kakaoNativeAppKey) {
    plugins.push([
      "@react-native-kakao/core",
      {
        nativeAppKey: kakaoNativeAppKey,
        android: {
          authCodeHandlerActivity: true,
        },
        ios: {
          handleKakaoOpenUrl: true,
        },
      },
    ]);
  }

  return {
    ...config,
    plugins,
  } as ExpoConfig;
};
