import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useGenres, useRegions } from "@/hooks/api/onboarding/useOnboarding";
import { useFanInformationQuery } from "@/hooks/api/user/useFanInformation";
import { useFanMyPageQuery } from "@/hooks/api/user/useFanMyPage";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";
import type { CodeName } from "@/types/onboarding/onboarding";

type MenuItem = {
  label: string;
  href?: Parameters<typeof router.push>[0];
  onPress?: () => void;
};

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
          <View style={styles.profileBand}>
            <View style={styles.profileRow}>
              <Avatar
                imageUrl={fanInformation?.profileImageUrl}
                label={data.nickname || "팬"}
                size={62}
              />
              <View style={styles.profileText}>
                <Text numberOfLines={1} style={styles.nickname}>
                  {data.nickname || "팬"}
                </Text>
                <Text numberOfLines={1} style={styles.profileSubtitle}>
                  {buildSubtitle({
                    genre: data.genre,
                    additionalGenreCount: data.additionalGenreCount,
                    regions: data.regions,
                    genreCodes: genres,
                    regionCodes: regions,
                  }) || "관심 장르와 활동 지역을 설정해 보세요"}
                </Text>
              </View>
            </View>

            <StatRow
              stats={[
                {
                  label: "팔로잉",
                  value: data.followingCount,
                  href: "/fan/my/followed-bands" as Parameters<typeof router.push>[0],
                },
                {
                  label: "관심 공연",
                  value: data.interestedPerformanceCount,
                  href: "/fan/my/interested-concerts" as Parameters<typeof router.push>[0],
                },
                {
                  label: "참여 공연",
                  value: data.participatedPerformanceCount,
                  href: "/fan/my/attended-concerts" as Parameters<typeof router.push>[0],
                },
              ]}
            />
          </View>

          <View style={styles.menuContent}>
            <MenuSection
              title="탐색 활동"
              items={[
                {
                  label: "팔로우한 밴드",
                  href: "/fan/my/followed-bands" as Parameters<typeof router.push>[0],
                },
                {
                  label: "관심 공연 목록",
                  href: "/fan/my/interested-concerts" as Parameters<typeof router.push>[0],
                },
                {
                  label: "공연 참여 기록",
                  href: "/fan/my/attended-concerts" as Parameters<typeof router.push>[0],
                },
              ]}
            />

            <Divider />

            <MenuSection
              title="알림"
              items={[
                {
                  label: "공연 알림 설정",
                  href: "/fan/my/concert-alert" as Parameters<typeof router.push>[0],
                },
                {
                  label: "라이브 알림 설정",
                  href: "/fan/my/live-alert" as Parameters<typeof router.push>[0],
                },
              ]}
            />

            <Divider />

            <MenuSection
              title="계정"
              items={[
                {
                  label: "내 정보 수정",
                  href: "/fan/my/profile/edit" as Parameters<typeof router.push>[0],
                },
                {
                  label: "로그아웃",
                  onPress: logout,
                },
              ]}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function StatRow({
  stats,
}: {
  stats: { label: string; value: number; href?: Parameters<typeof router.push>[0] }[];
}) {
  return (
    <View style={styles.statRow}>
      {stats.map((stat, index) => {
        const content = (
          <>
            <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </>
        );

        return (
          <View key={stat.label} style={styles.statGroup}>
            {index > 0 ? <View style={styles.statDivider} /> : null}
            {stat.href ? (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.statButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push(stat.href!)}
              >
                {content}
              </Pressable>
            ) : (
              <View style={styles.statButton}>{content}</View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function MenuSection({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.menuRows}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              if (item.onPress) {
                item.onPress();
                return;
              }

              if (item.href) {
                router.push(item.href);
              }
            }}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ArrowRightIcon />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ArrowRightIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 17L15 12"
        stroke={colors.neutral600}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 12L10 7"
        stroke={colors.neutral600}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.white,
  },
  profileBand: {
    backgroundColor: colors.primary0,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nickname: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  profileSubtitle: {
    color: colors.neutral700,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  statRow: {
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  statGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statButton: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral300,
    marginRight: 24,
  },
  statValue: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  statLabel: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  menuContent: {
    gap: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  menuSection: {
    gap: 16,
  },
  sectionTitle: {
    color: colors.neutral600,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    paddingHorizontal: 20,
  },
  menuRows: {
    gap: 20,
    paddingHorizontal: 20,
  },
  menuRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLabel: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral400,
  },
  pressed: {
    opacity: 0.72,
  },
});
