import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ConcertCard,
  ConcertDivider,
  ConcertHeadline,
  ConcertInfoRows,
  ConcertIntro,
  ConcertPoster,
  formatConcertDateTime,
} from "@/features/concert/ConcertDetailParts";
import {
  getPostBackground,
  PostArticle,
  PostAuthor,
  PostBody,
  PostDetailError,
  PostDetailSkeleton,
  PostMedia,
  PostStats,
  PulseView,
} from "@/features/post/PostDetailParts";
import {
  useBandPerformanceQuery,
  useBandPostQuery,
  useBandQuery,
} from "@/hooks/api/band/useBand";
import { AppHeader } from "@/shared/components/AppHeader";
import { Screen } from "@/shared/components/Screen";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";

const AGE_RATING_LABELS: Record<string, string> = {
  ALL: "전체 관람가",
  AGE_12: "12세 이상",
  AGE_15: "15세 이상",
  AGE_19: "19세 이상",
};

const parseRouteId = (value?: string | string[]) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatPerformanceDateTime = (dateValue: string, timeValue: string) => {
  const date = new Date(`${dateValue}T${timeValue}`);

  return formatConcertDateTime(Number.isNaN(date.getTime()) ? null : date);
};

const getDdayLabel = (dateValue: string, timeValue: string) => {
  const date = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(date.getTime())) return "D--";

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const performanceStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.ceil(
    (performanceStart.getTime() - todayStart.getTime()) / 86_400_000,
  );

  if (diffDays < 0) return "종료";
  if (diffDays === 0) return "D-DAY";
  return `D-${diffDays}`;
};

export function BandPerformanceDetailScreen() {
  const params = useLocalSearchParams<{ performanceId?: string }>();
  const performanceId = parseRouteId(params.performanceId);
  const query = useBandPerformanceQuery(performanceId);
  const performance = query.data;

  return (
    <Screen
      edges={["top", "left", "right"]}
      contentStyle={styles.performanceContainer}
    >
      <AppHeader title="" style={styles.postHeader} />

      {query.isLoading ? (
        <PulseView>
          <View style={styles.skeletonPoster} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonCard} />
          </View>
        </PulseView>
      ) : query.isError || !performanceId ? (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>일정을 불러오지 못했어요</Text>
          <Text style={styles.errorDescription}>잠시 후 다시 시도해주세요</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void query.refetch()}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : performance ? (
        <>
          <ConcertPoster imageUrl={performance.posterImageUrl} />

          <View style={styles.performanceSummary}>
            <ConcertHeadline
              tone="band"
              dday={getDdayLabel(
                performance.performanceDate,
                performance.startTime,
              )}
              title={performance.title}
              meta={[
                getGenreLabel(performance.genre),
                getRegionLabel(performance.region),
              ]
                .filter(Boolean)
                .join(" · ")}
              isLiked={performance.isInterested}
              count={performance.interestCount}
            />

            <ConcertCard>
              <ConcertInfoRows
                rows={[
                  {
                    label: "공연 일시",
                    value: formatPerformanceDateTime(
                      performance.performanceDate,
                      performance.startTime,
                    ),
                  },
                  { label: "공연 장소", value: performance.venue },
                  {
                    label: "티켓 가격",
                    value: performance.ticketPrice || "가격 미정",
                  },
                  {
                    label: "관람 연령",
                    value:
                      AGE_RATING_LABELS[performance.ageRating] ??
                      performance.ageRating,
                  },
                ]}
              />
            </ConcertCard>
          </View>

          <ConcertDivider tone="band" />

          <View style={styles.performanceIntro}>
            <ConcertIntro
              tone="band"
              title="공연 소개"
              description={
                performance.description || "공연 소개가 준비 중이에요."
              }
              tags={performance.tags}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

export function BandPostDetailScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = parseRouteId(params.postId);
  const query = useBandPostQuery(postId);
  const post = query.data;
  const bandQuery = useBandQuery(post?.bandId ?? null);
  const mediaUrls = post?.mediaUrls ?? [];

  return (
    <Screen
      edges={["top", "left", "right"]}
      contentStyle={styles.postContainer}
    >
      <AppHeader title="" style={styles.postHeader} />

      {query.isLoading ? (
        <PostDetailSkeleton />
      ) : query.isError || !postId ? (
        <PostDetailError
          tone="band"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          onRetry={() => void query.refetch()}
        />
      ) : post ? (
        <PostArticle>
          <PostAuthor
            bandName={bandQuery.data?.name ?? post.bandName}
            imageUrl={bandQuery.data?.profileImageUrl}
            createdAt={post.createdAt}
          />

          {post.type !== "TEXT" && mediaUrls.length > 0 ? (
            <PostMedia
              tone="band"
              imageUrls={mediaUrls}
              isVideo={post.type === "VIDEO"}
              videoPosterUrl={post.thumbnailUrl}
            />
          ) : null}

          <PostStats likeCount={0} commentCount={0} />

          <PostBody
            tone="band"
            title={post.title || "제목 없는 콘텐츠"}
            content={post.description}
            tags={post.tags}
          />
        </PostArticle>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  performanceContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  performanceSummary: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  performanceIntro: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  skeletonPoster: {
    width: "100%",
    height: 492,
    backgroundColor: colors.neutral300,
  },
  skeletonBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  skeletonTitle: {
    width: 220,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.neutral300,
  },
  skeletonCard: {
    width: "100%",
    height: 80,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.neutral300,
  },
  error: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    ...textStyles.label1,
    color: colors.neutral900,
    textAlign: "center",
  },
  errorDescription: {
    ...textStyles.caption2,
    marginTop: 8,
    color: colors.neutral600,
    textAlign: "center",
  },
  retryButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: colors.secondary400,
    paddingHorizontal: 20,
  },
  retryText: {
    ...textStyles.body1,
    color: colors.white,
  },
  postContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: getPostBackground("band"),
  },
  postHeader: {
    paddingHorizontal: 15,
  },
});
