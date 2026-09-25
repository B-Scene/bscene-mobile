import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { useAuthStore } from "@/stores/useAuthStore";
import {
  getHomePathForMode,
  useModeStore,
} from "@/stores/useModeStore";

const MIN_SPLASH_DURATION_MS = 1200;

export function SplashScreen() {
  const { restoreSession, status, user } = useAuthStore();
  const mode = useModeStore((state) => state.mode);

  const [minimumDurationElapsed, setMinimumDurationElapsed] =
    useState(false);

  useEffect(() => {
    void restoreSession();

    const timer = setTimeout(() => {
      setMinimumDurationElapsed(true);
    }, MIN_SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [restoreSession]);

  useEffect(() => {
    if (!minimumDurationElapsed) {
      return;
    }

    if (
      status === "idle" ||
      status === "loading"
    ) {
      return;
    }

    if (status === "guest") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated") {
      if (user?.onboardingCompleted === false) {
        router.replace("/onboarding/agreement");
        return;
      }

      router.replace(
        getHomePathForMode(
          user?.currentMode ?? mode,
        ) as Parameters<
          typeof router.replace
        >[0],
      );
    }
  }, [
    minimumDurationElapsed,
    mode,
    status,
    user,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient
            id="splashGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop
              offset="0%"
              stopColor="#FFE031"
            />

            <Stop
              offset="100%"
              stopColor="#F04579"
            />
          </LinearGradient>
        </Defs>

        <Rect
          width="100%"
          height="100%"
          fill="url(#splashGradient)"
        />
      </Svg>

      <SplashLogo />
    </View>
  );
}

function SplashLogo() {
  return (
    <Svg
      width={60}
      height={66}
      viewBox="0 0 94 104"
      fill="none"
    >
      <Path
        d="M62.8849 1.7998C76.6451 1.79989 87.7998 12.9387 87.7998 26.6789C87.7997 35.7643 82.9222 43.7117 75.6396 48.054C82.915 52.3186 87.7998 60.2122 87.7998 69.2451C87.7997 82.8063 76.7903 93.7997 63.2094 93.7998C63.1011 93.7998 62.9929 93.7987 62.8849 93.7973V93.7891C62.7992 93.7953 62.7127 93.7998 62.6254 93.7998C60.6903 93.7998 59.1217 92.2335 59.1217 90.3012C59.1217 88.369 60.6903 86.8027 62.6254 86.8027C62.7127 86.8027 62.7992 86.8068 62.8849 86.8131V86.7565C71.2264 85.2024 77.5409 77.8954 77.5409 69.1155C77.5409 60.4821 71.4356 53.2728 63.3012 51.5569C63.2922 51.5569 63.283 51.5576 63.2739 51.5576C63.2381 51.5576 63.2024 51.5558 63.1667 51.5547C63.0729 51.556 62.979 51.5576 62.8849 51.5576V51.5354C61.1329 51.3419 59.7703 49.8597 59.7703 48.059C59.7703 46.2583 61.1329 44.7758 62.8846 44.5823V44.5372C70.5055 43.4304 76.3592 36.8801 76.3592 28.9634C76.3591 21.1464 70.6519 14.6618 63.1714 13.4343C63.003 13.4489 62.8327 13.4572 62.6605 13.4572H29.9044V33.9352C29.9043 37.1555 27.2898 39.7659 24.0649 39.7659C20.8399 39.7659 18.2254 37.1555 18.2253 33.9352V7.63085C18.2253 4.4094 20.8399 1.7998 24.0649 1.7998H62.8849Z"
        fill="#FFFFFF"
      />

      <Path
        d="M37.5004 38.1952C39.9574 38.1953 41.949 40.1845 41.9491 42.6379V89.0428C41.9491 91.4963 39.9574 93.4854 37.5004 93.4855C35.0433 93.4855 33.0513 91.4964 33.0513 89.0428V42.6379C33.0514 40.1844 35.0433 38.1953 37.5004 38.1952Z"
        fill="#FFFFFF"
      />

      <Path
        d="M51.1263 47.8954C53.5833 47.8955 55.575 49.8846 55.575 52.338V79.4536C55.5749 81.907 53.5832 83.8958 51.1263 83.8959C48.6693 83.8959 46.6773 81.9071 46.6772 79.4536V52.338C46.6772 49.8845 48.6692 47.8954 51.1263 47.8954Z"
        fill="#FFFFFF"
      />

      <Path
        d="M23.8745 51.6431C26.3315 51.6432 28.3232 53.6323 28.3232 56.0858V75.5956C28.3231 78.0491 26.3315 80.0382 23.8745 80.0383C21.4175 80.0382 19.4255 78.0491 19.4254 75.5956V56.0858C19.4254 53.6323 21.4174 51.6432 23.8745 51.6431Z"
        fill="#FFFFFF"
      />

      <Path
        d="M10.2489 58.5873C12.7059 58.5874 14.6977 60.5765 14.6977 63.0299V68.6512C14.6976 71.1046 12.7059 73.0937 10.2489 73.0938C7.79181 73.0938 5.79983 71.1047 5.7998 68.6512V63.0299C5.7998 60.5764 7.7918 58.5873 10.2489 58.5873Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE031",
  },
});