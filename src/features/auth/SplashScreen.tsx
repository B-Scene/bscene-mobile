import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

export function SplashScreen() {
  const { restoreSession, status, user } = useAuthStore();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated") {
      if (user?.onboardingCompleted === false) {
        router.replace("/onboarding/agreement");
        return;
      }

      router.replace("/home");
    }
  }, [status, user]);

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <View style={styles.logoMark}>
        <Text style={styles.logoText}>B</Text>
      </View>
      <Text style={styles.title}>B:Scene</Text>
      <Text style={styles.subtitle}>밴드와 팬이 만나는 라이브 씬</Text>
      <ActivityIndicator color={colors.primary500} style={styles.loader} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary500,
  },
  logoText: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "900",
  },
  title: {
    color: colors.neutral900,
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.neutral600,
    fontSize: 15,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
