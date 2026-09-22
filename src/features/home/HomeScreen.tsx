import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/shared/components/AppButton";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

export function HomeScreen() {
  const { clearSession, user } = useAuthStore();

  const handleLogout = async () => {
    await clearSession();
    router.replace("/login");
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{user?.currentMode ?? "B:Scene"}</Text>
        <Text style={styles.title}>모바일 홈 기반 준비 완료</Text>
        <Text style={styles.description}>
          다음 단계에서 웹의 팬 홈, 밴드 홈, Bottom Navigation을 실제 데이터 화면으로 세분화합니다.
        </Text>
      </View>
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
