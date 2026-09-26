import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  useBandPerformanceQuery,
  useBandPostQuery,
  useDeleteBandPerformance,
  useDeleteBandPost,
} from "@/hooks/api/band/useBand";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";

const AGE_RATING_LABELS: Record<string, string> = {
  ALL: "전체 관람가",
  AGE_12: "만 12세 이상",
  AGE_15: "만 15세 이상",
  AGE_19: "만 19세 이상",
};

const POST_TYPE_LABELS: Record<string, string> = {
  PHOTO: "사진",
  TEXT: "글",
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
  const date = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(date.getTime())) {
    return [formatDate(dateValue), timeValue].filter(Boolean).join(" ");
  }

  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${formatDate(dateValue)} (${weekday}) ${hour}:${minute}`;
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

  const openEdit = () => {
    if (!performanceId) return;
    router.push(
      `/band/home/concerts/form?performanceId=${performanceId}` as Parameters<
        typeof router.push
      >[0],
    );
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="" />

      {query.isLoading ? (
        <DetailSkeleton />
      ) : query.isError || !performanceId ? (
        <AppState
          title="공연 정보를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : performance ? (
        <>
          <View style={styles.performanceHero}>
            {performance.posterImageUrl ? (
              <Image
                source={{ uri: performance.posterImageUrl }}
                style={styles.performancePoster}
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <ImagePlaceholderIcon />
              </View>
            )}
          </View>

          <View style={styles.performanceInfo}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <View style={styles.ddayPill}>
                  <Text style={styles.ddayText}>
                    {getDdayLabel(
                      performance.performanceDate,
                      performance.startTime,
                    )}
                  </Text>
                </View>
                <Text style={styles.performanceTitle}>{performance.title}</Text>
                <Text style={styles.performanceMeta}>
                  {[performance.genre, performance.region].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <View style={styles.interestCount}>
                <HeartIcon />
                <Text style={styles.interestText}>
                  {formatCount(performance.interestCount)}
                </Text>
              </View>
            </View>

            <InfoPanel
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

            {performance.ticketLink ? (
              <Pressable
                accessibilityRole="button"
                style={styles.ticketButton}
                onPress={() => void openTicket()}
              >
                <Text style={styles.ticketButtonText}>예매 링크 열기</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.secondaryBand} />

          <DetailSection title="공연 소개">
            <Text style={styles.description}>
              {performance.description || "공연 소개가 준비 중이에요."}
            </Text>
            <TagSection tags={performance.tags} />
          </DetailSection>

          <ActionBar
            primaryLabel="공연 수정"
            destructiveLabel="공연 삭제"
            destructiveLoading={deleteMutation.isPending}
            onPrimaryPress={openEdit}
            onDestructivePress={deletePerformance}
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
  const mediaUrls = post?.mediaUrls ?? [];
  const mediaCount = mediaUrls.length;

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
    <Screen contentStyle={styles.postContainer}>
      <AppHeader title="" />

      {query.isLoading ? (
        <DetailSkeleton />
      ) : query.isError || !postId ? (
        <AppState
          title="콘텐츠를 불러오지 못했어요"
          description="삭제되었거나 네트워크 연결이 불안정할 수 있어요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : post ? (
        <>
          <View style={styles.postArticle}>
            <View style={styles.postAuthor}>
              <Avatar
                imageUrl={post.thumbnailUrl}
                label={post.bandName}
                size={42}
              />
              <View style={styles.authorText}>
                <Text numberOfLines={1} style={styles.authorName}>
                  {post.bandName}
                </Text>
                <Text style={styles.authorMeta}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>

            {post.type !== "TEXT" && mediaUrls.length > 0 ? (
              <Image
                source={{ uri: post.thumbnailUrl ?? mediaUrls[0] }}
                style={styles.postMedia}
              />
            ) : null}

            <View style={styles.postStats}>
              <View style={styles.statInline}>
                <HeartIcon />
                <Text style={styles.statInlineText}>0</Text>
              </View>
              <View style={styles.statInline}>
                <CommentIcon />
                <Text style={styles.statInlineText}>0</Text>
              </View>
            </View>

            <View style={styles.postBody}>
              <View style={styles.postTypePill}>
                <Text style={styles.postTypeText}>
                  {POST_TYPE_LABELS[post.type] ?? post.type}
                </Text>
              </View>
              <Text style={styles.postTitle}>
                {post.title || "제목 없는 콘텐츠"}
              </Text>
              {post.description ? (
                <Text style={styles.postDescription}>{post.description}</Text>
              ) : (
                <Text style={styles.postDescription}>
                  콘텐츠 설명이 준비 중이에요.
                </Text>
              )}
              <TagSection tags={post.tags} />
            </View>
          </View>

          <View style={styles.secondaryBand} />

          <DetailSection title="콘텐츠 정보">
            <InfoPanel
              rows={[
                { label: "미디어", value: `${formatCount(mediaCount)}개` },
                { label: "작성일", value: formatDate(post.createdAt) },
                { label: "수정일", value: formatDate(post.updatedAt) },
              ]}
            />
          </DetailSection>

          {mediaCount > 0 ? (
            <DetailSection title="미디어 URL">
              <View style={styles.mediaList}>
                {mediaUrls.map((url) => (
                  <Text key={url} numberOfLines={1} style={styles.mediaUrl}>
                    {url}
                  </Text>
                ))}
              </View>
            </DetailSection>
          ) : null}

          <ActionBar
            primaryLabel="콘텐츠 수정"
            destructiveLabel="콘텐츠 삭제"
            destructiveLoading={deleteMutation.isPending}
            onPrimaryPress={openEdit}
            onDestructivePress={deletePost}
          />
        </>
      ) : null}
    </Screen>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonPanel} />
    </View>
  );
}

function InfoPanel({
  rows,
}: {
  rows: readonly { label: string; value: string }[];
}) {
  return (
    <View style={styles.infoPanel}>
      {rows.map((item) => (
        <View key={item.label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{item.label}</Text>
          <Text numberOfLines={2} style={styles.infoValue}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TagSection({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <View style={styles.tagList}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tagPill}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function ActionBar({
  primaryLabel,
  destructiveLabel,
  destructiveLoading,
  onPrimaryPress,
  onDestructivePress,
}: {
  primaryLabel: string;
  destructiveLabel: string;
  destructiveLoading: boolean;
  onPrimaryPress: () => void;
  onDestructivePress: () => void;
}) {
  return (
    <View style={styles.actionBar}>
      <Pressable
        accessibilityRole="button"
        style={styles.actionButton}
        onPress={onPrimaryPress}
      >
        <Text style={styles.actionButtonText}>{primaryLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={destructiveLoading}
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDestructivePress}
      >
        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
          {destructiveLoading ? "삭제 중..." : destructiveLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function ImagePlaceholderIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={4}
        width={18}
        height={16}
        rx={2}
        stroke={colors.neutral700}
        strokeWidth={2}
      />
      <Path
        d="M6 16L10 12L13 15L15 13L19 17"
        stroke={colors.neutral700}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={16.5} cy={8.5} r={1.5} fill={colors.neutral700} />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5S4 15.8 4 9.7C4 7.1 6.1 5 8.7 5C10.1 5 11.3 5.6 12 6.6C12.7 5.6 13.9 5 15.3 5C17.9 5 20 7.1 20 9.7C20 15.8 12 20.5 12 20.5Z"
        stroke={colors.neutral700}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommentIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11.5C20 15.642 16.418 19 12 19C10.805 19 9.672 18.754 8.654 18.313L4 19.5L5.236 15.482C4.455 14.337 4 12.968 4 11.5C4 7.358 7.582 4 12 4C16.418 4 20 7.358 20 11.5Z"
        stroke={colors.neutral700}
        strokeWidth={1.8}
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
  postContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 104,
    backgroundColor: colors.secondary0,
  },
  performanceHero: {
    height: 492,
    backgroundColor: colors.neutral400,
    alignItems: "center",
    justifyContent: "center",
  },
  performancePoster: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  performanceInfo: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  ddayPill: {
    alignSelf: "flex-start",
    minHeight: 20,
    borderRadius: 5,
    backgroundColor: colors.secondary100,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  ddayText: {
    color: colors.secondary600,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  performanceTitle: {
    color: colors.neutral900,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: 4,
  },
  performanceMeta: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  interestCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 38,
  },
  interestText: {
    color: colors.neutral700,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  infoPanel: {
    borderRadius: 12,
    backgroundColor: colors.white,
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.neutral900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoLabel: {
    width: 88,
    color: colors.neutral700,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  infoValue: {
    flex: 1,
    color: colors.neutral800,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "right",
  },
  ticketButton: {
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.secondary500,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  ticketButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  secondaryBand: {
    height: 16,
    backgroundColor: colors.secondary0,
  },
  detailSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  description: {
    color: colors.neutral900,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 20,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 24,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.secondary600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  actionBar: {
    backgroundColor: colors.white,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary500,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.white,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  deleteButtonText: {
    color: colors.error,
  },
  postArticle: {
    backgroundColor: colors.white,
    paddingHorizontal: 25,
    paddingTop: 24,
    paddingBottom: 24,
  },
  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  authorMeta: {
    color: colors.neutral600,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    marginTop: 4,
  },
  postMedia: {
    width: "100%",
    height: 422,
    backgroundColor: colors.neutral300,
    marginTop: 24,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 24,
  },
  statInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statInlineText: {
    color: colors.neutral900,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  postBody: {
    marginTop: 16,
  },
  postTypePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.secondary100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  postTypeText: {
    color: colors.secondary600,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  postTitle: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  postDescription: {
    color: colors.neutral900,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  mediaList: {
    gap: 8,
    marginTop: 12,
  },
  mediaUrl: {
    color: colors.neutral600,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  skeletonWrap: {
    paddingTop: 24,
  },
  skeletonHero: {
    height: 320,
    backgroundColor: colors.neutral300,
  },
  skeletonLineWide: {
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.neutral300,
    marginHorizontal: 24,
    marginTop: 24,
  },
  skeletonPanel: {
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.neutral300,
    marginHorizontal: 24,
    marginTop: 16,
  },
});
