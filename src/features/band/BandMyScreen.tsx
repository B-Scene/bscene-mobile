import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useBandQuery } from "@/hooks/api/band/useBand";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
import { useAuthStore } from "@/stores/useAuthStore";

type MenuItem = {
  label: string;
  href?: Parameters<typeof router.push>[0];
  onPress?: () => void;
};

export function BandMyScreen() {
  const myPageQuery = useBandMyPageQuery();
  const activeBandQuery = useActiveBandId();
  const bandQuery = useBandQuery(activeBandQuery.activeBandId);
  const clearSession = useAuthStore((state) => state.clearSession);
  const data = myPageQuery.data;
  const band = bandQuery.data;
  const isLoading = myPageQuery.isLoading || activeBandQuery.isLoading;
  const isError = myPageQuery.isError || activeBandQuery.isError;
  const hasBand = Boolean(data?.isBandMember);
  const bandName = band?.name ?? data?.bandName ?? "";
  const profileImageUrl =
    band?.profileImageUrl ?? activeBandQuery.activeBand?.profileImageUrl;
  const partsLabel = data?.parts?.length ? data.parts.join(" · ") : "";
  const subtitle = [bandName, partsLabel].filter(Boolean).join(" · ");

  const retry = () => {
    void myPageQuery.refetch();
    void activeBandQuery.refetch();
    void bandQuery.refetch();
  };

  const logout = () => {
    Alert.alert("로그아웃 할까요?", "언제든지 다시 로그인할 수 있어요", [
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
      ) : hasBand && data ? (
        <>
          <View style={styles.profileBand}>
            <View style={styles.profileRow}>
              <View style={styles.profileMain}>
                <Avatar
                  imageUrl={profileImageUrl}
                  label={data.nickname || bandName || "B"}
                  size={62}
                />
                <View style={styles.profileText}>
                  <Text numberOfLines={1} style={styles.nickname}>
                    {data.nickname || bandName}
                  </Text>
                  <Text numberOfLines={1} style={styles.profileSubtitle}>
                    {subtitle}
                  </Text>
                </View>
              </View>

              {bandName ? (
                <View style={styles.bandPill}>
                  <Text numberOfLines={1} style={styles.bandPillText}>
                    {bandName}
                  </Text>
                  <ChevronDownIcon />
                </View>
              ) : null}
            </View>

            <StatRow
              stats={[
                {
                  label: "팔로워",
                  value: data.follower,
                },
                {
                  label: "지원자",
                  value: data.applicant,
                  href: "/band/my/applications" as Parameters<typeof router.push>[0],
                },
                {
                  label: "공연",
                  value: data.performance,
                  href: "/band/home" as Parameters<typeof router.push>[0],
                },
              ]}
            />
          </View>

          <View style={styles.menuContent}>
            <MenuSection
              title="현재 선택된 밴드 관리"
              items={[
                {
                  label: "밴드 프로필 관리",
                  href: "/band/my/profile/edit" as Parameters<typeof router.push>[0],
                },
                {
                  label: "멤버 관리",
                  href: "/band/my/members" as Parameters<typeof router.push>[0],
                },
                {
                  label: "모집 공고 관리",
                  href: "/band/session" as Parameters<typeof router.push>[0],
                },
                {
                  label: "받은 지원 관리",
                  href: "/band/my/applications" as Parameters<typeof router.push>[0],
                },
              ]}
            />

            <Divider />

            <MenuSection
              title="알림"
              items={[
                {
                  label: "모집 공고 알림 설정",
                  href: "/band/my/recruit-alert" as Parameters<typeof router.push>[0],
                },
                {
                  label: "라이브 알림 설정",
                  href: "/band/my/live-alert" as Parameters<typeof router.push>[0],
                },
              ]}
            />

            <Divider />

            <MenuSection
              title="계정"
              items={[
                {
                  label: "로그아웃",
                  onPress: logout,
                },
              ]}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <AppState
            title="등록된 밴드가 없어요"
            description="밴드를 등록하면 콘텐츠, 공연, 라이브 등 다양한 활동을 관리할 수 있어요"
          />
        </View>
      )}
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

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
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

function ChevronDownIcon() {
  return (
    <Svg width={10} height={6} viewBox="0 0 10 6" fill="none">
      <Path
        d="M1 1L5 5L9 1"
        stroke={colors.white}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
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
    backgroundColor: colors.secondary0,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  profileMain: {
    flex: 1,
    minWidth: 0,
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
  bandPill: {
    maxWidth: 116,
    borderRadius: 999,
    backgroundColor: colors.secondary400,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  bandPillText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
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
  emptyWrap: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  pressed: {
    opacity: 0.72,
  },
});
