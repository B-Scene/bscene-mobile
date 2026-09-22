import { StyleSheet, Text, View } from "react-native";

import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";

export function BandHomeScreen() {
  const query = useBandMyPageQuery();
  const data = query.data;

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="내 밴드" showBack={false} />

      {query.isLoading ? (
        <AppState loading title="밴드 정보를 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="밴드 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : data?.isBandMember ? (
        <>
          <AppCard style={styles.profileCard}>
            <Avatar imageUrl={undefined} label={data.bandName} size={76} />
            <View style={styles.profileText}>
              <Text style={styles.bandName}>{data.bandName || "내 밴드"}</Text>
              <Text style={styles.nickname}>{data.nickname}</Text>
              <View style={styles.badges}>
                {(data.parts.length ? data.parts : ["파트 미정"]).map((part) => (
                  <Badge key={part} label={part} tone="yellow" />
                ))}
              </View>
            </View>
          </AppCard>

          <View style={styles.stats}>
            <StatCard label="팔로워" value={data.follower} />
            <StatCard label="지원자" value={data.applicant} />
            <StatCard label="공연" value={data.performance} />
          </View>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>밴드 활동</Text>
            <Text style={styles.sectionDescription}>
              콘텐츠, 공연 일정, 음원 링크 관리는 다음 단계에서 웹 Band Home API와
              세부 등록 화면을 기준으로 연결합니다.
            </Text>
          </AppCard>
        </>
      ) : (
        <AppState
          title="등록된 밴드가 없어요"
          description="밴드를 등록하면 콘텐츠, 공연, 라이브 활동을 관리할 수 있어요."
        />
      )}
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <AppCard style={styles.statCard}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  bandName: {
    color: colors.neutral900,
    fontSize: 22,
    fontWeight: "900",
  },
  nickname: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  sectionDescription: {
    color: colors.neutral700,
    fontSize: 14,
    lineHeight: 21,
  },
});
