import {
  Stack,
} from "expo-router";

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
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

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