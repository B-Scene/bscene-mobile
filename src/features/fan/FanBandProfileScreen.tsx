import { useLocalSearchParams } from "expo-router";
import { Radio } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useFanExploreBandDetailQuery } from "@/hooks/api/fan/useFanExplore";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { mapExploreBand } from "@/features/fan/fanExploreMappers";

export function FanBandProfileScreen() {
  const params = useLocalSearchParams<{ bandId?: string }>();
  const bandId = Number(params.bandId);
  const query = useFanExploreBandDetailQuery(Number.isFinite(bandId) ? bandId : 0);
  const band = query.data ? mapExploreBand(query.data) : null;
  const isLive = query.data?.isLive ?? query.data?.live ?? false;

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="밴드 프로필" />

      {query.isLoading ? (
        <AppState loading title="밴드 정보를 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="밴드 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : band ? (
        <>
          <AppCard style={styles.profileCard}>
            <Avatar imageUrl={band.imageUrl} label={band.name} size={88} />
            <Text style={styles.name}>{band.name}</Text>
            <Text style={styles.meta}>{band.meta}</Text>
            <View style={styles.badges}>
              <Badge label={`${band.followerCount.toLocaleString()} 팔로워`} />
              {band.isFollowing ? <Badge label="팔로잉" tone="pink" /> : null}
              {isLive ? <Badge label="라이브 중" tone="yellow" /> : null}
            </View>
          </AppCard>

          <AppCard style={styles.section}>
            <Text style={styles.sectionTitle}>밴드 소개</Text>
            <Text style={styles.description}>
              {band.description ?? "밴드 소개가 준비 중이에요."}
            </Text>
          </AppCard>

          {isLive ? (
            <AppCard style={styles.liveCard}>
              <Radio size={22} color={colors.secondary600} />
              <View style={styles.liveText}>
                <Text style={styles.sectionTitle}>진행 중인 라이브</Text>
                <Text style={styles.meta}>라이브 입장 플로우는 Live 단계에서 연결합니다.</Text>
              </View>
            </AppCard>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  profileCard: {
    alignItems: "center",
    gap: spacing.md,
  },
  name: {
    color: colors.neutral900,
    fontSize: 24,
    fontWeight: "900",
  },
  meta: {
    color: colors.neutral600,
    fontSize: 13,
    lineHeight: 19,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  description: {
    color: colors.neutral800,
    fontSize: 14,
    lineHeight: 22,
  },
  liveCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.secondary100,
    borderColor: colors.secondary200,
  },
  liveText: {
    flex: 1,
    gap: spacing.xs,
  },
});
