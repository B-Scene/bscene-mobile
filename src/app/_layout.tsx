import {
  Stack,
} from "expo-router";

import {
  useFonts,
} from "expo-font";

import * as SplashScreen from "expo-splash-screen";

import {
  useEffect,
} from "react";

import {
  AppProviders,
} from "@/providers/AppProviders";

import {
  NativeNotificationBridge,
} from "@/shared/components/NativeNotificationBridge";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Pretendard-Bold": require("../../assets/fonts/Pretendard-Bold.otf"),
    "Pretendard-Medium": require("../../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../../assets/fonts/Pretendard-SemiBold.otf"),
    "Satoshi-BlackItalic": require("../../assets/fonts/Satoshi-BlackItalic.otf"),
    "Satoshi-Medium": require("../../assets/fonts/Satoshi-Medium.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <NativeNotificationBridge />

      <Stack
        screenOptions={{
          headerShown:
            false,

          contentStyle: {
            backgroundColor:
              "#ffffff",
          },
        }}
      />
    </AppProviders>
  );
}
