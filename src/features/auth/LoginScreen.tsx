import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { config } from "@/shared/constants/config";
import { colors } from "@/shared/constants/theme";
import {
  secureTokenStorage,
  type RecentOAuthProvider,
} from "@/shared/utils/secureTokenStorage";

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = RecentOAuthProvider;

const NATIVE_OAUTH_REDIRECT_ORIGIN = "bscenemobile://";
const NATIVE_OAUTH_CALLBACK_URL = "bscenemobile://oauth/callback";

const createOAuthUrls = (provider: OAuthProvider) => {
  const callbackUrl =
    Platform.OS === "web"
      ? Linking.createURL("oauth/callback")
      : NATIVE_OAUTH_CALLBACK_URL;

  const redirectOrigin =
    Platform.OS === "web"
      ? callbackUrl.replace(/\/oauth\/callback\/?$/, "")
      : NATIVE_OAUTH_REDIRECT_ORIGIN;

  const apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const authorizationUrl =
    `${apiBaseUrl}/oauth2/authorization/${provider}` +
    `?redirect_origin=${encodeURIComponent(redirectOrigin)}`;

  return { authorizationUrl, callbackUrl };
};

export function LoginScreen() {
  const [recentProvider, setRecentProvider] =
    useState<RecentOAuthProvider | null>(null);

  useEffect(() => {
    void secureTokenStorage
      .getLastOAuthProvider()
      .then(setRecentProvider)
      .catch(() => setRecentProvider(null));
  }, []);

  const openOAuth = async (provider: OAuthProvider) => {
    if (!config.apiBaseUrl) {
      Alert.alert(
        "OAuth 설정 필요",
        "API 서버 주소가 설정되어 있지 않습니다.",
      );
      return;
    }

    const { authorizationUrl, callbackUrl } = createOAuthUrls(provider);

    try {
      const result = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        callbackUrl,
      );

      if (result.type !== "success") return;

      const parsed = Linking.parse(result.url);
      const code =
        typeof parsed.queryParams?.code === "string"
          ? parsed.queryParams.code
          : null;

      if (!code) {
        Alert.alert(
          "소셜 로그인",
          "로그인 인증 코드를 받지 못했어요.",
        );
        return;
      }

      router.replace(
        `/oauth/callback?code=${encodeURIComponent(code)}&provider=${provider}` as Parameters<
          typeof router.replace
        >[0],
      );
    } catch {
      Alert.alert(
        "소셜 로그인",
        "소셜 로그인 중 문제가 발생했어요.",
      );
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.logoFrame}>
          <Image
            source={require("../../../assets/images/auth/login-logo.svg")}
            style={styles.logo}
          />
        </View>

        <Text numberOfLines={1} style={styles.brandHeadline}>
          Be the Scene!
        </Text>
        <Text style={styles.brandDescription}>당신이 무대가 되는 순간</Text>

        <View style={styles.socialDivider}>
          <Image
            source={require("../../../assets/images/auth/login-divider-left.svg")}
            style={styles.dividerLeft}
          />
          <Text numberOfLines={1} style={styles.socialTitle}>
            SNS 계정으로 간편하게 시작하기
          </Text>
          <Image
            source={require("../../../assets/images/auth/login-divider-right.svg")}
            style={styles.dividerRight}
          />
        </View>

        {recentProvider === "kakao" ? (
          <RecentLoginBubble provider="kakao" />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="카카오로 로그인"
          style={({ pressed }) => [styles.kakaoButton, pressed && styles.pressed]}
          onPress={() => void openOAuth("kakao")}
        >
          <Image
            source={require("../../../assets/images/auth/kakao-login-button.svg")}
            style={styles.loginButtonImage}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apple로 로그인"
          style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}
          onPress={() => void openOAuth("apple")}
        >
          <Image
            source={require("../../../assets/images/auth/apple-login-button.svg")}
            style={styles.loginButtonImage}
          />
        </Pressable>

        {recentProvider === "apple" ? (
          <RecentLoginBubble provider="apple" />
        ) : null}
      </View>
    </ScrollView>
  );
}

function RecentLoginBubble({ provider }: { provider: RecentOAuthProvider }) {
  const isKakao = provider === "kakao";

  return (
    <View
      pointerEvents="none"
      style={[
        styles.recentBubble,
        isKakao ? styles.recentKakao : styles.recentApple,
      ]}
    >
      <Image
        source={
          isKakao
            ? require("../../../assets/images/auth/recent-login-pointer-down.svg")
            : require("../../../assets/images/auth/recent-login-pointer-up.svg")
        }
        style={styles.recentBubbleImage}
      />
      <Text
        style={[
          styles.recentBubbleText,
          isKakao ? styles.recentKakaoText : styles.recentAppleText,
        ]}
      >
        최근에 로그인했어요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  content: {
    position: "relative",
    width: "100%",
    maxWidth: 393,
    minHeight: 852,
    backgroundColor: colors.white,
  },
  logoFrame: {
    position: "absolute",
    top: 175,
    left: "50%",
    width: 128,
    height: 145,
    marginLeft: -64,
  },
  logo: {
    position: "absolute",
    top: -1.8,
    left: -5.8,
    width: 139.6,
    height: 156.6,
  },
  brandHeadline: {
    position: "absolute",
    top: 366,
    left: 60,
    width: 272,
    height: 50,
    color: "#F04579",
    fontFamily: "Satoshi-BlackItalic",
    fontSize: 42,
    lineHeight: 50,
    textAlign: "center",
  },
  brandDescription: {
    position: "absolute",
    top: 430,
    left: 68,
    width: 256,
    color: "#737373",
    fontFamily: "Satoshi-Medium",
    fontSize: 16,
    lineHeight: 30,
    textAlign: "center",
  },
  socialDivider: {
    position: "absolute",
    top: 550,
    left: 15,
    width: 362,
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLeft: {
    width: 74,
    height: 1.2,
    marginLeft: 5,
  },
  socialTitle: {
    width: 183,
    color: "#737373",
    fontFamily: "Pretendard-Medium",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  dividerRight: {
    width: 76.6,
    height: 1.2,
  },
  kakaoButton: {
    position: "absolute",
    top: 594,
    left: 24,
    width: 345,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
  },
  appleButton: {
    position: "absolute",
    top: 662,
    left: 24,
    width: 345,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
  },
  loginButtonImage: {
    width: 345,
    height: 52,
  },
  recentBubble: {
    position: "absolute",
    left: "50%",
    width: 106,
    height: 35,
    marginLeft: -53,
    zIndex: 2,
  },
  recentKakao: {
    top: 555,
  },
  recentApple: {
    top: 718,
  },
  recentBubbleImage: {
    position: "absolute",
    width: 106,
    height: 35,
  },
  recentBubbleText: {
    position: "absolute",
    left: 12,
    width: 82,
    color: "#FFFFFF",
    fontFamily: "Pretendard-Medium",
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
  },
  recentKakaoText: {
    top: 8,
  },
  recentAppleText: {
    top: 15,
  },
  pressed: {
    opacity: 0.82,
  },
});
