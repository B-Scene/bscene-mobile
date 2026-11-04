import { router, type Href } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { FollowedNewsCard } from "@/features/fan/explore/ExploreParts";
import { useFollowingPostsInfiniteQuery } from "@/hooks/api/fan/useFanHome";
import { AppHeader } from "@/shared/components/AppHeader";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";

import type { FollowingPostItem } from "@/types/fan/home";

const formatPostedAgo = (item: FollowingPostItem) => {
  if (typeof item.postedAgo === "number") return `${item.postedAgo}시간 전`;

  const createdAt = item.createdAt ? new Date(item.createdAt) : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) return undefined;

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / 60_000),
  );

  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}시간 전`;

  return `${Math.floor(diffHours / 24)}일 전`;
};

const normalizeUrls = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return typeof value === "string" && value ? [value] : [];
};

const getMediaUrls = (item: FollowingPostItem) =>
  Array.from(
    new Set([
      ...normalizeUrls(item.mediaUrl),
      ...normalizeUrls(item.mediaUrls),
      ...normalizeUrls(item.imageUrls),
      ...normalizeUrls(item.images),
      ...normalizeUrls(item.imageUrl),
      ...normalizeUrls(item.contentImageUrl),
      ...normalizeUrls(item.mainImageUrl),
      ...normalizeUrls(item.thumbnailUrl),
      ...normalizeUrls(item.thumbnailImageUrl),
    ]),
  );

const getVariant = (item: FollowingPostItem, mediaUrls: string[]) => {
  if (
    String(item.mediaType ?? "").toUpperCase() === "VIDEO" ||
    item.videoThumbnailUrl
  ) {
    return "video";
  }

  if (mediaUrls.length > 1) return "gallery";
  if (mediaUrls.length === 1) return "image";
  return "text";
};

function FollowedNewsRow({
  item,
  index,
}: {
  item: FollowingPostItem;
  index: number;
}) {
  const mediaUrls = getMediaUrls(item);
  const postId = item.postId ?? item.id;
  const content = item.content ?? item.title ?? "새로운 소식이 도착했어요";

  return (
    <FollowedNewsCard
      key={String(postId ?? index)}
      variant={getVariant(item, mediaUrls)}
      profileImageUrl={
        item.bandProfileImageUrl ??
        item.bandImageUrl ??
        item.bandProfileUrl ??
        item.bandLogoUrl ??
        item.profileImageUrl ??
        item.avatarUrl ??
        item.logoUrl
      }
      bandName={item.bandName ?? "밴드명"}
      meta={
        [item.genre, item.region, formatPostedAgo(item)]
          .filter(Boolean)
          .join(" · ") || "장르 · 지역"
      }
      content={content}
      mediaUrls={mediaUrls}
      videoThumbnailUrl={
        item.videoThumbnailUrl ?? item.thumbnailUrl ?? item.thumbnailImageUrl
      }
      tags={item.tags ?? []}
      accessibilityLabel={`${item.title ?? item.content ?? "게시물"} 상세보기`}
      disabled={postId == null}
      onPress={() => router.push(`/fan/explore/contents/${postId}` as Href)}
    />
  );
}

export function FanFollowedNewsScreen() {
  const query = useFollowingPostsInfiniteQuery(10);
  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader title="팔로우한 밴드 소식" style={styles.header} />

      <FlatList
        data={posts}
        keyExtractor={(item, index) => String(item.postId ?? item.id ?? index)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.isLoading ? (
            <Text style={styles.loadingText}>소식을 불러오는 중이에요</Text>
          ) : query.isError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>소식을 불러오지 못했어요</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={() => void query.refetch()}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <Text style={styles.footerText}>더 불러오는 중이에요</Text>
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <FollowedNewsRow item={item} index={index} />
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: 15,
  },
  list: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  loadingText: {
    ...textStyles.body3,
    color: colors.neutral600,
  },
  errorBox: {
    alignItems: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  errorText: {
    ...textStyles.body3,
    color: colors.neutral700,
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.primary400,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  footerText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    textAlign: "center",
  },
});
