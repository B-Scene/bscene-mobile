import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useBandQuery } from "@/hooks/api/band/useBand";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

export function BandMyScreen() {
  const myPageQuery = useBandMyPageQuery();
  const activeBandQuery = useActiveBandId();
  const bandQuery = useBandQuery(activeBandQuery.activeBandId);
  const clearSession = useAuthStore((state) => state.clearSession);
  const data = myPageQuery.data;
  const band = bandQuery.data;
  const isLoading = myPageQuery.isLoading || activeBandQuery.isLoading;
  const isError = myPageQuery.isError || activeBandQuery.isError;
  const bandName = band?.name ?? data?.bandName ?? "내 밴드";
  const partsLabel = data?.parts?.length ? data.parts.join(" · ") : "파트 미정";

  const retry = () => {
    void myPageQuery.refetch();
    void activeBandQuery.refetch();
    void bandQuery.refetch();
  };

  const logout = () => {
    Alert.alert("로그아웃 할까요?", "언제든지 다시 로그인할 수 있어요.", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => {
          void clearSession().then(() => router.replace("/login"));
        },
      },
    ]);
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="마이" showBack={false} />

      {isLoading ? (
        <AppState loading title="밴드 마이페이지를 불러오는 중이에요" />
      ) : isError ? (
        <AppState
          title="밴드 마이페이지를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={retry}
        />
      ) : data?.isBandMember ? (
        <>
          <AppCard style={styles.profileCard}>
            <Avatar
              imageUrl={
                band?.profileImageUrl ?? activeBandQuery.activeBand?.profileImageUrl
              }
              label={bandName}
              size={76}
            />
            <View style={styles.profileText}>
              <Text style={styles.name}>{data.nickname || bandName}</Text>
              <Text style={styles.subtitle}>
                {[bandName, partsLabel].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </AppCard>

          <View style={styles.stats}>
            <StatItem label="팔로워" value={band?.followerCount ?? data.follower} />
            <StatItem label="지원자" value={data.applicant} />
            <StatItem
              label="공연"
              value={band?.performanceCount ?? data.performance}
            />
          </View>

          <MenuSection
            title="현재 선택된 밴드 관리"
            items={[
              { label: "밴드 프로필 관리" },
              { label: "멤버 관리" },
              { label: "모집 공고 관리" },
              { label: "받은 지원 관리" },
            ]}
          />

          <MenuSection
            title="알림"
            items={[
              {
                label: "모집 공고 알림 설정",
                href: "/band/my/recruit-alert",
              },
              { label: "라이브 알림 설정", href: "/band/my/live-alert" },
            ]}
          />

          <MenuSection
            title="계정"
            items={[]}
            footerLabel="로그아웃"
            onFooterPress={logout}
          />
        </>
      ) : (
        <AppState
          title="등록된 밴드가 없어요"
          description="밴드를 등록하면 모집, 공연, 라이브 활동을 관리할 수 있어요."
        />
      )}
    </Screen>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <AppCard style={styles.statCard}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AppCard>
  );
}

function MenuSection({
  title,
  items,
  footerLabel,
  onFooterPress,
}: {
  title: string;
  items: { label: string; href?: string }[];
  footerLabel?: string;
  onFooterPress?: () => void;
}) {
  return (
    <AppCard style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Pressable
          key={item.label}
          accessibilityRole={item.href ? "button" : "text"}
          disabled={!item.href}
          style={({ pressed }) => [
            styles.menuRow,
            pressed && item.href && styles.pressed,
          ]}
          onPress={() => {
            if (!item.href) return;
            router.push(item.href as Parameters<typeof router.push>[0]);
          }}
        >
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuStatus}>{item.href ? "보기" : "준비 중"}</Text>
        </Pressable>
      ))}
      {footerLabel ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.menuRow,
            styles.footerRow,
            pressed && styles.pressed,
          ]}
          onPress={onFooterPress}
        >
          <Text style={[styles.menuLabel, styles.logoutLabel]}>{footerLabel}</Text>
        </Pressable>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.secondary100,
    borderColor: colors.secondary200,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.neutral900,
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.neutral600,
    fontSize: 13,
    lineHeight: 19,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    color: colors.secondary600,
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "700",
  },
  menuSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  menuRow: {
    minHeight: 44,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  menuLabel: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "700",
  },
  menuStatus: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "700",
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral300,
    borderRadius: 0,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  logoutLabel: {
    color: colors.error,
  },
  pressed: {
    opacity: 0.7,
  },
});
