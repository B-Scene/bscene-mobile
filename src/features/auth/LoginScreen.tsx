import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useLogin } from "@/hooks/api/auth/useAuth";
import { AppButton } from "@/shared/components/AppButton";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

export function LoginScreen() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const setSession = useAuthStore((state) => state.setSession);
  const loginMutation = useLogin();

  const canSubmit = loginId.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    loginMutation.mutate(
      { loginId: loginId.trim(), password },
      {
        onSuccess: async (session) => {
          await setSession(session);
          router.replace(
            session.user.onboardingCompleted ? "/home" : "/onboarding/agreement",
          );
        },
        onError: () => {
          Alert.alert("로그인 실패", "아이디와 비밀번호를 확인해 주세요.");
        },
      },
    );
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>B:Scene</Text>
        <Text style={styles.title}>다시 무대 가까이</Text>
        <Text style={styles.description}>
          기존 B:Scene 계정으로 로그인하면 팬 모드와 밴드 모드를 이어서 사용할 수 있습니다.
        </Text>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label="아이디"
          placeholder="아이디를 입력하세요"
          value={loginId}
          onChangeText={setLoginId}
          returnKeyType="next"
        />
        <AppTextInput
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={canSubmit ? handleLogin : undefined}
        />
        <AppButton
          label="로그인"
          disabled={!canSubmit}
          loading={loginMutation.isPending}
          onPress={handleLogin}
        />
      </View>

      <View style={styles.footer}>
        <AppButton
          label="회원가입"
          variant="secondary"
          onPress={() => router.push("/signup")}
        />
        <Text style={styles.oauthNotice}>
          OAuth 로그인은 웹 구현의 `/auth/oauth/exchange` contract를 기준으로 다음 체크포인트에서 연결합니다.
        </Text>
      </View>
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
  brand: {
    color: colors.primary500,
    fontSize: 18,
    fontWeight: "900",
  },
  title: {
    color: colors.neutral900,
    fontSize: 30,
    fontWeight: "900",
  },
  description: {
    color: colors.neutral600,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    gap: spacing.md,
  },
  oauthNotice: {
    color: colors.neutral500,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
