import { useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import { useFanPerformanceDetailQuery } from "@/hooks/api/fan/useFanHome";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import {
  formatDateTime,
  formatDday,
  getCastingBandInfo,
  getConcertDate,
  getConcertLocation,
  getConcertTitle,
  getDetailPosterImageUrl,
} from "@/features/fan/concertMappers";

const AGE_RATING_LABELS: Record<string, string> = {
  ALL: "전체 관람가",
  AGE_12: "만 12세 이상",
  AGE_15: "만 15세 이상",
  AGE_19: "만 19세 이상",
};

export function FanConcertDetailScreen() {
  const params = useLocalSearchParams<{ concertId?: string }>();
  const performanceId = Number(params.concertId);
  const query = useFanPerformanceDetailQuery(
    Number.isFinite(performanceId) ? performanceId : 0,
  );
  const detail = query.data;
  const date = getConcertDate(detail ?? {});
  const title = getConcertTitle(detail);
  const location = getConcertLocation(detail);
  const meta = [detail?.genre, detail?.region].filter(Boolean).join(" · ");
  const posterImageUrl = getDetailPosterImageUrl(detail);
  const description =
    detail?.introduction ??
    detail?.description ??
    detail?.content ??
    "공연 소개가 준비 중이에요.";
  const price =
    detail?.ticketPrice == null && detail?.price == null
      ? "가격 미정"
      : String(detail.ticketPrice ?? detail.price);
  const ageRating =
    AGE_RATING_LABELS[String(detail?.ageRating ?? "")] ??
    detail?.ageRating ??
    "관람 연령 미정";

  const openTicket = async () => {
    if (!detail?.ticketLink) return;
    await Linking.openURL(detail.ticketLink);
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="공연 상세" />

      {query.isLoading ? (
        <AppState loading title="공연 정보를 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="공연 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : detail ? (
        <>
          <AppCard style={styles.heroCard}>
            <View style={styles.poster}>
              <Avatar imageUrl={posterImageUrl} label={title} size={84} />
            </View>
            <Badge label={formatDday(detail, date)} tone="pink" />
            <Text style={styles.title}>{title}</Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </AppCard>

          <AppCard style={styles.infoCard}>
            <InfoRow label="공연 일시" value={formatDateTime(date)} />
            <InfoRow label="공연 장소" value={location} />
            <InfoRow label="티켓 가격" value={price} />
            <InfoRow label="관람 연령" value={ageRating} />
            <AppButton
              label={detail.ticketLink ? "예매하기" : "예매 링크 없음"}
              disabled={!detail.ticketLink}
              onPress={() => void openTicket()}
            />
          </AppCard>

          <Section title="공연소개">
            <Text style={styles.description}>{description}</Text>
          </Section>

          <Section title="캐스팅">
            {detail.casting?.length ? (
              <View style={styles.castingList}>
                {detail.casting.map((band, index) => {
                  const bandInfo = getCastingBandInfo(band);
                  const bandName =
                    bandInfo.bandName ?? bandInfo.name ?? band.bandName ?? "밴드명";
                  const bandMeta =
                    [bandInfo.genre ?? bandInfo.bandGenre, bandInfo.region ?? bandInfo.bandRegion]
                      .filter(Boolean)
                      .join(" · ") || "장르 · 지역";

                  return (
                    <View key={`${bandName}-${index}`} style={styles.castingRow}>
                      <Avatar
                        imageUrl={
                          bandInfo.profileImageUrl ??
                          bandInfo.bandProfileImageUrl ??
                          bandInfo.bandImageUrl
                        }
                        label={bandName}
                        size={42}
                      />
                      <View style={styles.castingText}>
                        <Text style={styles.castingName}>{bandName}</Text>
                        <Text style={styles.meta}>{bandMeta}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.meta}>캐스팅 정보가 준비 중이에요</Text>
            )}
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.md,
  },
  poster: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.neutral900,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31,
  },
  meta: {
    color: colors.neutral600,
    fontSize: 13,
    lineHeight: 19,
  },
  infoCard: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  infoLabel: {
    color: colors.neutral600,
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
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
  castingList: {
    gap: spacing.md,
  },
  castingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  castingText: {
    flex: 1,
  },
  castingName: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "900",
  },
});
