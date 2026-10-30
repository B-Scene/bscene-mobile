import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

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
        style={[StyleSheet.absoluteFill, styles.splashBackground]}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="splashGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFE031" />
            <Stop offset="100%" stopColor="#F04579" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#splashGradient)" />
      </Svg>
      <View style={styles.splashLogo}>
        <SplashLogo />
      </View>
    </View>
  );
}

function SplashLogo() {
  return (
    <Svg
      width={85}
      height={94}
      viewBox="0 0 85 94"
      fill="none"
    >
      <Defs>
        <LinearGradient
          id="splashLogoGradient"
          x1="42.2998"
          y1="1.80005"
          x2="42.2998"
          y2="156.4"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={"#FFFFFF"} />
          <Stop offset="1" stopColor={"#FFFFFF"} stopOpacity={0.62} />
        </LinearGradient>
      </Defs>
      <Path
        d="M56.6195 1.80005C68.8694 1.80013 78.7998 11.7282 78.7998 23.9749C78.7997 32.0727 74.4576 39.1563 67.9743 43.0266C74.4512 46.8277 78.7998 53.8633 78.7998 61.9143C78.7997 74.0014 68.9986 83.7999 56.9084 83.8C56.812 83.8 56.7156 83.7991 56.6195 83.7978V83.7905C56.5432 83.7961 56.4662 83.8 56.3884 83.8C54.6658 83.8 53.2693 82.404 53.2693 80.6818C53.2693 78.9596 54.6658 77.5635 56.3884 77.5635C56.4662 77.5635 56.5432 77.5672 56.6195 77.5727V77.5223C64.0454 76.1372 69.6668 69.6244 69.6669 61.7988C69.6669 54.1039 64.2317 47.6781 56.9901 46.1487C56.982 46.1488 56.9739 46.1494 56.9658 46.1494C56.9339 46.1494 56.9021 46.1478 56.8704 46.1468C56.7869 46.1479 56.7032 46.1494 56.6195 46.1494V46.1296C55.0598 45.9571 53.8467 44.6361 53.8467 43.0311C53.8467 41.4261 55.0597 40.1047 56.6192 39.9323V39.8921C63.4037 38.9056 68.6149 33.0673 68.6149 26.0111C68.6148 19.0437 63.534 13.264 56.8745 12.17C56.7246 12.183 56.573 12.1904 56.4197 12.1904H27.2588V30.4424C27.2587 33.3127 24.9312 35.6394 22.0602 35.6394C19.1891 35.6394 16.8616 33.3127 16.8616 30.4424V6.99729C16.8616 4.12706 19.1891 1.80005 22.0602 1.80005H56.6195Z"
        fill="url(#splashLogoGradient)"
      />
      <Path
        d="M34.0211 34.2395C36.2084 34.2395 37.9814 36.0125 37.9815 38.1992V79.5601C37.9815 81.7469 36.2084 83.5198 34.0211 83.5199C31.8336 83.5199 30.0603 81.747 30.0603 79.5601V38.1992C30.0603 36.0124 31.8337 34.2395 34.0211 34.2395Z"
        fill="url(#splashLogoGradient)"
      />
      <Path
        d="M46.1514 42.8853C48.3388 42.8853 50.1119 44.6582 50.1119 46.845V71.0133C50.1118 73.2 48.3387 74.9726 46.1514 74.9727C43.9641 74.9727 42.1908 73.2 42.1906 71.0133V46.845C42.1906 44.6581 43.964 42.8853 46.1514 42.8853Z"
        fill="url(#splashLogoGradient)"
      />
      <Path
        d="M21.8907 46.2256C24.0781 46.2257 25.8511 47.9986 25.8511 50.1854V67.5746C25.8511 69.7614 24.078 71.5343 21.8907 71.5343C19.7033 71.5343 17.93 69.7614 17.9299 67.5746V50.1854C17.9299 47.9986 19.7033 46.2257 21.8907 46.2256Z"
        fill="url(#splashLogoGradient)"
      />
      <Path
        d="M9.7606 52.415C11.9479 52.4151 13.7211 54.1879 13.7211 56.3747V61.3849C13.7211 63.5717 11.9479 65.3446 9.7606 65.3447C7.57318 65.3447 5.79982 63.5718 5.7998 61.3849V56.3747C5.7998 54.1878 7.57317 52.415 9.7606 52.415Z"
        fill="url(#splashLogoGradient)"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F49E4A",
  },
  splashBackground: {
    zIndex: 0,
  },
  splashLogo: {
    zIndex: 1,
  },
});
