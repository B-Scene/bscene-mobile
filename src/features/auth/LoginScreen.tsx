import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useLogin } from "@/hooks/api/auth/useAuth";
import { AppButton } from "@/shared/components/AppButton";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Screen } from "@/shared/components/Screen";
import { config } from "@/shared/constants/config";
import { colors, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { getHomePathForMode } from "@/stores/useModeStore";

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
          const nextPath = session.user.onboardingCompleted
            ? getHomePathForMode(session.user.currentMode)
            : "/onboarding/agreement";
          router.replace(nextPath as Parameters<typeof router.replace>[0]);
        },
        onError: () => {
          Alert.alert("로그인 실패", "아이디와 비밀번호를 확인해 주세요.");
        },
      },
    );
  };

  const openOAuth = async (provider: "kakao" | "google") => {
    const url =
      provider === "kakao" ? config.kakaoOAuthUrl : config.googleOAuthUrl;

    if (!url) {
      Alert.alert(
        "OAuth 설정 필요",
        `${provider === "kakao" ? "카카오" : "구글"} 로그인 URL 환경 변수가 필요합니다.`,
      );
      return;
    }

    await WebBrowser.openBrowserAsync(url);
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
        <View style={styles.oauthGroup}>
          <AppButton
            label="카카오로 계속"
            variant="secondary"
            onPress={() => void openOAuth("kakao")}
          />
          <AppButton
            label="구글로 계속"
            variant="secondary"
            onPress={() => void openOAuth("google")}
          />
        </View>
        <AppButton
          label="회원가입"
          variant="secondary"
          onPress={() => router.push("/signup")}
        />
        <Text style={styles.oauthNotice}>OAuth callback: /oauth/callback?code=...</Text>
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
  oauthGroup: {
    gap: spacing.sm,
  },
  oauthNotice: {
    color: colors.neutral500,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
