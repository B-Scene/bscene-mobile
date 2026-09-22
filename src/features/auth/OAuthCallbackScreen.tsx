import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { useOAuthExchange } from "@/hooks/api/auth/useAuth";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import { getHomePathForMode } from "@/stores/useModeStore";
import { useOAuthSignupStore } from "@/stores/useOAuthSignupStore";

export function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const exchangeMutation = useOAuthExchange();
  const setSession = useAuthStore((state) => state.setSession);
  const setOAuthSignup = useOAuthSignupStore((state) => state.setOAuthSignup);
  const hasExchanged = useRef(false);

  useEffect(() => {
    const exchange = async () => {
      if (hasExchanged.current) return;
      hasExchanged.current = true;

      if (!params.code) {
        router.replace("/login");
        return;
      }

      try {
        const data = await exchangeMutation.mutateAsync(params.code);

        if (data.isNewUser) {
          setOAuthSignup({
            signupToken: data.signupToken,
            socialEmail: data.email,
          });
          router.replace("/signup");
          return;
        }

        if (data.token) {
          await setSession(data.token);
          const nextPath = data.token.user.onboardingCompleted
            ? getHomePathForMode(data.token.user.currentMode)
            : "/onboarding/agreement";
          router.replace(nextPath as Parameters<typeof router.replace>[0]);
          return;
        }

        router.replace("/login");
      } catch {
        router.replace("/login");
      }
    };

    void exchange();
  }, [exchangeMutation, params.code, setOAuthSignup, setSession]);

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <ActivityIndicator color={colors.primary500} />
      <Text style={styles.text}>로그인 처리 중...</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  text: {
    color: colors.neutral700,
    fontSize: 15,
    fontWeight: "600",
  },
});
