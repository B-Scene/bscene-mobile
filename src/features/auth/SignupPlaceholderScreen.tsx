import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/shared/components/AppButton";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";

export function SignupPlaceholderScreen() {
  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.description}>
          웹의 약관, 아이디 중복 확인, 휴대폰 인증, 가입 API contract를 모바일 입력 컴포넌트로 옮기는 다음 기능 단위입니다.
        </Text>
      </View>
      <AppButton label="로그인으로 돌아가기" onPress={() => router.replace("/login")} />
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
