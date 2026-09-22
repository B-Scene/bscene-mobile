import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useGenres, useRegions } from "@/hooks/api/onboarding/useOnboarding";
import { useFanInformationQuery } from "@/hooks/api/user/useFanInformation";
import { useFanMyPageQuery } from "@/hooks/api/user/useFanMyPage";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import type { CodeName } from "@/types/onboarding/onboarding";

const getCodeName = (codeNames: CodeName[] | undefined, code?: string) => {
  if (!code) return "";
  return codeNames?.find((item) => item.code === code)?.name ?? code;
};

const buildSubtitle = ({
  genre,
  additionalGenreCount,
  regions,
  genreCodes,
  regionCodes,
}: {
  genre?: string;
  additionalGenreCount?: number;
  regions?: string[];
  genreCodes?: CodeName[];
  regionCodes?: CodeName[];
}) => {
  const genreLabel = getCodeName(genreCodes, genre);
  const genreText =
    genreLabel && additionalGenreCount && additionalGenreCount > 0
      ? `${genreLabel} 외 ${additionalGenreCount}`
      : genreLabel;
  const regionText = (regions ?? [])
    .map((region) => getCodeName(regionCodes, region))
    .filter(Boolean)
    .join(", ");

  return [genreText, regionText].filter(Boolean).join(" · ");
};

export function FanMyScreen() {
  const myPageQuery = useFanMyPageQuery();
  const fanInformationQuery = useFanInformationQuery();
  const { data: genres = [] } = useGenres();
  const { data: regions = [] } = useRegions();
  const clearSession = useAuthStore((state) => state.clearSession);
  const data = myPageQuery.data;
  const fanInformation = fanInformationQuery.data;
  const isLoading = myPageQuery.isLoading || fanInformationQuery.isLoading;
  const isError = myPageQuery.isError || fanInformationQuery.isError;

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

  const retry = () => {
    void myPageQuery.refetch();
    void fanInformationQuery.refetch();
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="마이" showBack={false} />

      {isLoading ? (
        <AppState loading title="마이페이지를 불러오는 중이에요" />
      ) : isError ? (
        <AppState
          title="마이페이지를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={retry}
        />
      ) : data ? (
        <>
          <AppCard style={styles.profileCard}>
            <Avatar
              imageUrl={fanInformation?.profileImageUrl}
              label={data.nickname}
              size={76}
            />
            <View style={styles.profileText}>
              <Text style={styles.name}>{data.nickname || "팬"}</Text>
              <Text style={styles.subtitle}>
                {buildSubtitle({
                  genre: data.genre,
                  additionalGenreCount: data.additionalGenreCount,
                  regions: data.regions,
                  genreCodes: genres,
                  regionCodes: regions,
                }) || "관심 장르와 활동 지역을 설정해 보세요"}
              </Text>
            </View>
          </AppCard>

          <View style={styles.stats}>
            <StatItem label="팔로잉" value={data.followingCount} />
            <StatItem label="관심 공연" value={data.interestedPerformanceCount} />
            <StatItem label="참여 공연" value={data.participatedPerformanceCount} />
          </View>

          <MenuSection
            title="탐색 활동"
            items={["팔로우한 밴드", "관심 공연 목록", "공연 참여 기록"]}
          />
          <MenuSection
            title="알림"
            items={["공연 알림 설정", "라이브 알림 설정"]}
          />
          <MenuSection
            title="계정"
            items={["내 정보 수정"]}
            footerLabel="로그아웃"
            onFooterPress={logout}
          />
        </>
      ) : null}
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
  items: string[];
  footerLabel?: string;
  onFooterPress?: () => void;
}) {
  return (
    <AppCard style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.menuRow}>
          <Text style={styles.menuLabel}>{item}</Text>
          <Text style={styles.menuStatus}>준비 중</Text>
        </View>
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
    backgroundColor: colors.primary0,
    borderColor: colors.primary100,
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
    color: colors.primary600,
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
