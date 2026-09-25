import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  BSceneSignature,
  GoogleLoginIcon,
  KakaoLoginIcon,
} from "@/features/onboarding/BSceneBrandAssets";
import { useLogin } from "@/hooks/api/auth/useAuth";
import { config } from "@/shared/constants/config";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { getHomePathForMode } from "@/stores/useModeStore";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const setSession = useAuthStore((state) => state.setSession);
  const loginMutation = useLogin();
  const canSubmit = loginId.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    if (!canSubmit || loginMutation.isPending) return;

    loginMutation.mutate(
      {
        loginId: loginId.trim(),
        password,
      },
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
    const url = provider === "kakao" ? config.kakaoOAuthUrl : config.googleOAuthUrl;

    if (!url) {
      Alert.alert(
        "OAuth 설정 필요",
        `${provider === "kakao" ? "카카오" : "구글"} 로그인 URL 환경 변수가 필요합니다.`,
      );
      return;
    }

    const redirectUrl = Linking.createURL("oauth/callback");
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

    if (result.type !== "success") return;

    const parsed = Linking.parse(result.url);
    const code =
      typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;

    if (!code) {
      Alert.alert("소셜 로그인", "로그인 인증 코드를 받지 못했어요.");
      return;
    }

    router.replace(
      `/oauth/callback?code=${encodeURIComponent(code)}` as Parameters<
        typeof router.replace
      >[0],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <BSceneSignature width={151} height={37} />
        </View>

        <View style={styles.heroText}>
          <Text style={styles.heroLine}>Be the Scene!</Text>
          <Text style={styles.heroLine}>당신이 무대가 되는 순간</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            value={loginId}
            placeholder="아이디(이메일)를 입력해주세요"
            placeholderTextColor={colors.neutral400}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="username"
            style={styles.input}
            onChangeText={setLoginId}
          />
          <TextInput
            value={password}
            placeholder="비밀번호를 입력해주세요"
            placeholderTextColor={colors.neutral400}
            secureTextEntry
            textContentType="password"
            style={styles.input}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit || loginMutation.isPending}
            style={({ pressed }) => [
              styles.mainButton,
              canSubmit ? styles.mainButtonEnabled : styles.mainButtonDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
            onPress={handleLogin}
          >
            <Text
              style={[
                styles.mainButtonText,
                canSubmit ? styles.mainButtonTextEnabled : styles.mainButtonTextDisabled,
              ]}
            >
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.links}>
          <Pressable onPress={() => router.push("/signup")}>
            <Text style={styles.linkText}>회원가입</Text>
          </Pressable>
          <Text style={styles.separatorText}>|</Text>
          <Text style={styles.linkText}>아이디 찾기</Text>
          <Text style={styles.separatorText}>|</Text>
          <Text style={styles.linkText}>비밀번호 찾기</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>SNS 계정으로 간편 로그인</Text>
          <View style={styles.socialButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="카카오계정으로 로그인"
              onPress={() => void openOAuth("kakao")}
            >
              <KakaoLoginIcon width={46} height={45} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="구글 계정으로 로그인"
              onPress={() => void openOAuth("google")}
            >
              <GoogleLoginIcon width={44} height={44} />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 104,
  },
  logoWrap: {
    alignItems: "center",
  },
  heroText: {
    alignItems: "center",
    marginTop: 43,
  },
  heroLine: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    textAlign: "center",
  },
  form: {
    gap: 12,
    marginTop: 54,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 12,
    backgroundColor: colors.white,
    color: colors.neutral900,
    fontSize: 18,
    lineHeight: 20,
    paddingHorizontal: 19,
  },
  mainButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  mainButtonEnabled: {
    backgroundColor: colors.primary400,
    borderColor: colors.primary400,
  },
  mainButtonDisabled: {
    backgroundColor: colors.neutral300,
    borderColor: colors.neutral300,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  mainButtonTextEnabled: {
    color: colors.white,
  },
  mainButtonTextDisabled: {
    color: colors.neutral600,
  },
  links: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  linkText: {
    color: colors.neutral600,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  separatorText: {
    color: colors.neutral400,
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral400,
    opacity: 0.4,
    marginTop: 54,
  },
  socialSection: {
    alignItems: "center",
    marginTop: 29,
  },
  socialTitle: {
    color: colors.neutral700,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  socialButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 17,
  },
  pressed: {
    opacity: 0.82,
  },
});
