import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/shared/components/AppButton";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { getHomePathForMode, useModeStore } from "@/stores/useModeStore";

export function HomeScreen() {
  const { clearSession, user } = useAuthStore();
  const mode = useModeStore((state) => state.mode);

  useEffect(() => {
    router.replace(
      getHomePathForMode(user?.currentMode ?? mode) as Parameters<
        typeof router.replace
      >[0],
    );
  }, [mode, user?.currentMode]);

  const handleLogout = async () => {
    await clearSession();
    router.replace("/login");
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{user?.currentMode ?? "B:Scene"}</Text>
        <Text style={styles.title}>홈으로 이동 중</Text>
        <Text style={styles.description}>
          선택된 모드에 맞는 B:Scene 모바일 홈으로 연결하고 있습니다.
        </Text>
      </View>
      <ActivityIndicator color={colors.primary500} />
      <AppButton label="로그아웃" variant="secondary" onPress={handleLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary500,
    fontSize: 14,
    fontWeight: "900",
  },
  title: {
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "900",
  },
  description: {
    color: colors.neutral600,
    fontSize: 15,
    lineHeight: 22,
  },
});
