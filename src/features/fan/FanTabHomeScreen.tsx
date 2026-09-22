import { router } from "expo-router";
import { Bell, CalendarDays, Repeat2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/shared/components/AppCard";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";

export function FanTabHomeScreen() {
  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="모드 전환"
          hitSlop={12}
          style={styles.iconButton}
        >
          <Repeat2 size={23} color={colors.neutral900} />
        </Pressable>
        <Text style={styles.logo}>B:Scene</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="공연 캘린더"
            hitSlop={12}
            onPress={() =>
              router.push(
                "/fan/home/concerts/calendar" as Parameters<
                  typeof router.push
                >[0],
              )
            }
          >
            <CalendarDays size={22} color={colors.neutral900} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            hitSlop={12}
            onPress={() =>
              router.push(
                "/fan/home/notifications" as Parameters<typeof router.push>[0],
              )
            }
          >
            <Bell size={22} color={colors.neutral900} />
          </Pressable>
        </View>
      </View>

      <AppCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>팬 홈 API 연결 준비 완료</Text>
        <Text style={styles.heroDescription}>
          다음 체크포인트에서 웹 `/home`, `/performances/upcoming`, 팔로우 밴드 소식 API를
          연결해 실제 홈 피드를 표시합니다.
        </Text>
      </AppCard>

      <AppState
        title="팔로우한 밴드 소식을 기다리고 있어요"
        description="탐색 탭에서 밴드를 팔로우하면 공연과 뉴스가 이곳에 표시됩니다."
        actionLabel="밴드 탐색하기"
        onAction={() =>
          router.push("/fan/explore" as Parameters<typeof router.push>[0])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logo: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.sm,
    backgroundColor: colors.primary0,
    borderColor: colors.primary50,
  },
  heroTitle: {
    color: colors.neutral900,
    fontSize: 20,
    fontWeight: "900",
  },
  heroDescription: {
    color: colors.neutral700,
    fontSize: 14,
    lineHeight: 20,
  },
});
