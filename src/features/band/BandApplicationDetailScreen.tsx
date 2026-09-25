import { router, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useApplicationSubmissionDetailQuery } from "@/hooks/api/session/useSessionApplication";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatDeadline = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hour}:${minute}`;
};

const splitGenres = (value: string) =>
  value
    .split(/[,/·]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function BandApplicationDetailScreen() {
  const params = useLocalSearchParams<{ applySubmissionId?: string }>();
  const applySubmissionId = parseRouteId(params.applySubmissionId);
  const query = useApplicationSubmissionDetailQuery(applySubmissionId);
  const detail = query.data;

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="지원서 상세" />

      {query.isLoading ? (
        <AppState loading title="지원서 정보를 불러오는 중이에요" />
      ) : query.isError || !detail ? (
        <AppState
          title="지원서 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <>
          <AppCard style={styles.recruitmentCard}>
            <Text style={styles.sectionEyebrow}>지원 공고</Text>
            <Text style={styles.recruitmentTitle}>
              {detail.recruitmentTitle} · {detail.bandName}
            </Text>
            <Text style={styles.meta}>모집 마감 {formatDeadline(detail.deadlineAt)}</Text>
          </AppCard>

          <AppCard style={styles.profileCard}>
            <Avatar
              imageUrl={detail.profileImageUrl}
              label={detail.nickname}
              size={76}
            />
            <View style={styles.profileText}>
              <Text style={styles.profileTitle}>{detail.part} 세션 지원합니다</Text>
              <Text style={styles.nickname}>{detail.nickname}</Text>
              <Text style={styles.meta}>
                {[detail.part, detail.skillLevel, detail.region]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          </AppCard>

          <Section title="세션 소개">
            <Text style={styles.quote}>“{detail.oneLineIntro}”</Text>
            <Text style={styles.body}>{detail.intro}</Text>
          </Section>

          <Section title="세션 정보">
            <InfoGroup label="파트" values={[detail.part]} />
            <InfoGroup label="실력대" values={[detail.skillLevel]} />
            <InfoGroup label="선호 장르" values={splitGenres(detail.genre)} />
            <InfoGroup label="활동 지역" values={[detail.region]} />
            <InfoGroup label="가능한 활동" values={detail.availableActivities} />
          </Section>

          <Section title="경력">
            {detail.careers.length > 0 ? (
              detail.careers.map((career) => (
                <View key={career.sessionApplicationCareerId} style={styles.career}>
                  <Text style={styles.careerPeriod}>{career.period}</Text>
                  <Text style={styles.careerTitle}>{career.name}</Text>
                  <Text style={styles.body}>{career.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>등록된 경력이 없어요.</Text>
            )}
          </Section>

          <Section title="포트폴리오">
            {detail.portfolioLinks.length > 0 ? (
              detail.portfolioLinks.map((link) => (
                <Pressable
                  key={link.sessionApplicationLinkId}
                  accessibilityRole="link"
                  style={styles.linkRow}
                  onPress={() => void Linking.openURL(link.url)}
                >
                  <View style={styles.linkText}>
                    <Text style={styles.linkTitle}>{link.title ?? link.url}</Text>
                    <Text numberOfLines={1} style={styles.meta}>
                      {link.url}
                    </Text>
                  </View>
                  <Text style={styles.linkAction}>열기</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.meta}>등록된 포트폴리오가 없어요.</Text>
            )}
          </Section>

          <AppButton
            label="지원자 목록으로"
            variant="secondary"
            onPress={() => router.back()}
          />
        </>
      )}
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppCard style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </AppCard>
  );
}

function InfoGroup({ label, values }: { label: string; values: string[] }) {
  const filteredValues = values.filter(Boolean);

  return (
    <View style={styles.infoGroup}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.badges}>
        {filteredValues.length > 0 ? (
          filteredValues.map((value) => <Badge key={value} label={value} />)
        ) : (
          <Text style={styles.meta}>미입력</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  recruitmentCard: {
    gap: spacing.xs,
  },
  sectionEyebrow: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
  },
  recruitmentTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  meta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  profileTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  nickname: {
    color: colors.neutral800,
    fontSize: 15,
    fontWeight: "800",
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  quote: {
    color: colors.secondary600,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  body: {
    color: colors.neutral800,
    fontSize: 14,
    lineHeight: 22,
  },
  infoGroup: {
    gap: spacing.sm,
  },
  infoLabel: {
    color: colors.neutral800,
    fontSize: 14,
    fontWeight: "800",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  career: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary400,
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  careerPeriod: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "700",
  },
  careerTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },
  linkRow: {
    minHeight: 56,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkText: {
    flex: 1,
    gap: spacing.xs,
  },
  linkTitle: {
    color: colors.neutral900,
    fontSize: 14,
    fontWeight: "800",
  },
  linkAction: {
    color: colors.secondary600,
    fontSize: 13,
    fontWeight: "800",
  },
});
