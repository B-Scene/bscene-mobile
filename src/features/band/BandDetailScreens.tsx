import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import {
  useBandPerformanceQuery,
  useBandPostQuery,
  useDeleteBandPerformance,
  useDeleteBandPost,
} from "@/hooks/api/band/useBand";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";

const AGE_RATING_LABELS: Record<string, string> = {
  ALL: "전체 관람가",
  AGE_12: "만 12세 이상",
  AGE_15: "만 15세 이상",
  AGE_19: "만 19세 이상",
};

const POST_TYPE_LABELS: Record<string, string> = {
  PHOTO: "사진",
  TEXT: "텍스트",
  VIDEO: "영상",
};

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "날짜 미정";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}.`;
};

const formatPerformanceDateTime = (dateValue: string, timeValue: string) => {
  return [formatDate(dateValue), timeValue].filter(Boolean).join(" ");
};

const formatCount = (value: number) => value.toLocaleString();

export function BandPerformanceDetailScreen() {
  const params = useLocalSearchParams<{ performanceId?: string }>();
  const performanceId = parseRouteId(params.performanceId);
  const query = useBandPerformanceQuery(performanceId);
  const deleteMutation = useDeleteBandPerformance();
  const performance = query.data;

  const deletePerformance = () => {
    if (!performanceId) return;

    Alert.alert("공연 삭제", "등록한 공연 일정을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(performanceId, {
            onSuccess: () => router.back(),
            onError: () => {
              Alert.alert("공연 삭제", "공연 일정을 삭제하지 못했어요.");
            },
          });
        },
      },
    ]);
  };

  const openTicket = async () => {
    if (!performance?.ticketLink) return;
    await Linking.openURL(performance.ticketLink);
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="공연 상세" />

      {query.isLoading ? (
        <AppState loading title="공연 정보를 불러오는 중이에요" />
      ) : query.isError || !performanceId ? (
        <AppState
          title="공연 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : performance ? (
        <>
          <AppCard style={styles.heroCard}>
            <View style={styles.mediaPreview}>
              <Avatar
                imageUrl={performance.posterImageUrl}
                label={performance.title}
                size={92}
              />
            </View>
            <View style={styles.badges}>
              <Badge label={performance.genre} tone="yellow" />
              <Badge label={performance.region} />
            </View>
            <Text style={styles.title}>{performance.title}</Text>
            <Text style={styles.meta}>
              {formatPerformanceDateTime(
                performance.performanceDate,
                performance.startTime,
              )}
            </Text>
          </AppCard>

          <AppCard style={styles.infoCard}>
            <InfoRow label="공연 장소" value={performance.venue} />
            <InfoRow label="티켓 가격" value={performance.ticketPrice || "가격 미정"} />
            <InfoRow
              label="관람 연령"
              value={
                AGE_RATING_LABELS[performance.ageRating] ?? performance.ageRating
              }
            />
            <InfoRow
              label="관심 수"
              value={`${formatCount(performance.interestCount)}명`}
            />
            <AppButton
              label={performance.ticketLink ? "예매 링크 열기" : "예매 링크 없음"}
              disabled={!performance.ticketLink}
              onPress={() => void openTicket()}
            />
          </AppCard>

          <Section title="공연 소개">
            <Text style={styles.description}>
              {performance.description || "공연 소개가 준비 중이에요."}
            </Text>
          </Section>

          <TagSection tags={performance.tags} />

          <AppButton
            label="공연 삭제"
            variant="secondary"
            loading={deleteMutation.isPending}
            onPress={deletePerformance}
          />
        </>
      ) : null}
    </Screen>
  );
}

export function BandPostDetailScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = parseRouteId(params.postId);
  const query = useBandPostQuery(postId);
  const deleteMutation = useDeleteBandPost(query.data?.bandId);
  const post = query.data;
  const mediaCount = post?.mediaUrls?.length ?? 0;

  const deletePost = () => {
    if (!postId) return;

    Alert.alert("콘텐츠 삭제", "등록한 콘텐츠를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(postId, {
            onSuccess: () => router.back(),
            onError: () => {
              Alert.alert("콘텐츠 삭제", "콘텐츠를 삭제하지 못했어요.");
            },
          });
        },
      },
    ]);
  };

  const openEdit = () => {
    if (!postId) return;
    router.push(
      `/band/home/contents/form?postId=${postId}` as Parameters<
        typeof router.push
      >[0],
    );
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="콘텐츠 상세" />

      {query.isLoading ? (
        <AppState loading title="콘텐츠를 불러오는 중이에요" />
      ) : query.isError || !postId ? (
        <AppState
          title="콘텐츠를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : post ? (
        <>
          <AppCard style={styles.heroCard}>
            <View style={styles.mediaPreview}>
              <Avatar imageUrl={post.thumbnailUrl} label={post.title} size={92} />
            </View>
            <View style={styles.badges}>
              <Badge label={POST_TYPE_LABELS[post.type] ?? post.type} tone="yellow" />
              <Badge label={post.bandName} />
            </View>
            <Text style={styles.title}>{post.title || "제목 없는 콘텐츠"}</Text>
            <Text style={styles.meta}>{formatDate(post.createdAt)}</Text>
          </AppCard>

          <Section title="본문">
            <Text style={styles.description}>
              {post.description || "콘텐츠 설명이 준비 중이에요."}
            </Text>
          </Section>

          <AppCard style={styles.infoCard}>
            <InfoRow label="미디어" value={`${formatCount(mediaCount)}개`} />
            <InfoRow label="작성일" value={formatDate(post.createdAt)} />
            <InfoRow label="수정일" value={formatDate(post.updatedAt)} />
          </AppCard>

          {mediaCount > 0 ? (
            <Section title="미디어 URL">
              <View style={styles.mediaList}>
                {post.mediaUrls.map((url) => (
                  <Text key={url} numberOfLines={1} style={styles.mediaUrl}>
                    {url}
                  </Text>
                ))}
              </View>
            </Section>
          ) : null}

          <TagSection tags={post.tags} />

          <AppButton label="콘텐츠 수정" variant="secondary" onPress={openEdit} />
          <AppButton
            label="콘텐츠 삭제"
            variant="secondary"
            loading={deleteMutation.isPending}
            onPress={deletePost}
          />
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppCard style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </AppCard>
  );
}

function TagSection({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <View style={styles.tagList}>
      {tags.map((tag) => (
        <Badge key={tag} label={`#${tag}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.md,
  },
  mediaPreview: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
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
  mediaList: {
    gap: spacing.sm,
  },
  mediaUrl: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
