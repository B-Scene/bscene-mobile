import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import {
  useBandMusicLinksQuery,
  useBandPerformancesQuery,
  useBandPostsQuery,
  useBandQuery,
} from "@/hooks/api/band/useBand";
import { useBandMyPageQuery } from "@/hooks/api/user/useBandMyPage";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppButton } from "@/shared/components/AppButton";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import type { MusicLinksResponse } from "@/types/band/musicLink";
import type { PerformanceListItem } from "@/types/band/performance";
import type { PostListItem } from "@/types/band/post";

type BandHomeTab = "content" | "schedule" | "music";

const HOME_TABS: { id: BandHomeTab; label: string }[] = [
  { id: "content", label: "콘텐츠" },
  { id: "schedule", label: "일정" },
  { id: "music", label: "음원" },
];

const formatPerformanceDate = (performance: PerformanceListItem) => {
  const date = new Date(performance.performanceDate);

  if (Number.isNaN(date.getTime())) return performance.performanceDate;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}.`;
};

const formatRelativeCreatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000),
  );

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
};

export function BandHomeScreen() {
  const [activeTab, setActiveTab] = useState<BandHomeTab>("content");
  const myPageQuery = useBandMyPageQuery();
  const activeBandQuery = useActiveBandId();
  const bandId = activeBandQuery.activeBandId;
  const bandQuery = useBandQuery(bandId);
  const postsQuery = useBandPostsQuery(bandId);
  const performancesQuery = useBandPerformancesQuery(bandId);
  const musicLinksQuery = useBandMusicLinksQuery(bandId);
  const data = myPageQuery.data;
  const band = bandQuery.data;
  const isLoading = myPageQuery.isLoading || activeBandQuery.isLoading;
  const isError = myPageQuery.isError || activeBandQuery.isError;

  const retry = () => {
    void myPageQuery.refetch();
    void activeBandQuery.refetch();
    void bandQuery.refetch();
    void postsQuery.refetch();
    void performancesQuery.refetch();
    void musicLinksQuery.refetch();
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title="내 밴드" showBack={false} />

      {isLoading ? (
        <AppState loading title="밴드 정보를 불러오는 중이에요" />
      ) : isError ? (
        <AppState
          title="밴드 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={retry}
        />
      ) : data?.isBandMember && bandId ? (
        <>
          <AppCard style={styles.profileCard}>
            <Avatar
              imageUrl={
                band?.profileImageUrl ?? activeBandQuery.activeBand?.profileImageUrl
              }
              label={band?.name ?? data.bandName}
              size={76}
            />
            <View style={styles.profileText}>
              <Text style={styles.bandName}>{band?.name ?? data.bandName}</Text>
              <Text style={styles.nickname}>
                {[band?.genre, band?.region].filter(Boolean).join(" · ") ||
                  data.nickname}
              </Text>
              <View style={styles.badges}>
                {(data.parts.length ? data.parts : ["파트 미정"]).map((part) => (
                  <Badge key={part} label={part} tone="yellow" />
                ))}
              </View>
            </View>
          </AppCard>

          {band?.description ? (
            <Text style={styles.description}>{band.description}</Text>
          ) : null}

          <View style={styles.stats}>
            <StatCard label="팔로워" value={band?.followerCount ?? data.follower} />
            <StatCard label="지원자" value={data.applicant} />
            <StatCard
              label="공연"
              value={band?.performanceCount ?? data.performance}
            />
          </View>

          <View style={styles.tabs}>
            {HOME_TABS.map((tab) => (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.id && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "content" ? (
            <ContentSection
              posts={postsQuery.data?.posts ?? []}
              isLoading={postsQuery.isLoading}
              isError={postsQuery.isError}
              onRetry={() => void postsQuery.refetch()}
            />
          ) : null}

          {activeTab === "schedule" ? (
            <ScheduleSection
              performances={performancesQuery.data?.performances ?? []}
              isLoading={performancesQuery.isLoading}
              isError={performancesQuery.isError}
              onRetry={() => void performancesQuery.refetch()}
            />
          ) : null}

          {activeTab === "music" ? (
            <MusicSection
              musicLinks={musicLinksQuery.data}
              isLoading={musicLinksQuery.isLoading}
              isError={musicLinksQuery.isError}
              onRetry={() => void musicLinksQuery.refetch()}
            />
          ) : null}
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

function ContentSection({
  posts,
  isLoading,
  isError,
  onRetry,
}: {
  posts: PostListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) return <AppState loading title="콘텐츠를 불러오는 중이에요" />;
  if (isError) {
    return (
      <AppState
        title="콘텐츠를 불러오지 못했어요"
        actionLabel="다시 시도"
        onAction={onRetry}
      />
    );
  }
  if (posts.length === 0) {
    return (
      <AppState
        title="등록된 콘텐츠가 없어요"
        description="콘텐츠를 등록하면 팬들이 소식을 받아볼 수 있어요."
      />
    );
  }

  return (
    <View style={styles.sectionList}>
      {posts.map((post) => (
        <AppCard key={post.postId} style={styles.rowCard}>
          <Avatar imageUrl={post.thumbnailUrl} label={post.title} size={48} />
          <View style={styles.rowText}>
            <Text numberOfLines={1} style={styles.rowTitle}>
              {post.title || post.type}
            </Text>
            <Text numberOfLines={2} style={styles.rowMeta}>
              {post.description || "설명이 없는 콘텐츠입니다."}
            </Text>
            <Text style={styles.rowMeta}>
              {formatRelativeCreatedAt(post.createdAt)}
            </Text>
          </View>
          <Badge label={post.type} />
        </AppCard>
      ))}
    </View>
  );
}

function ScheduleSection({
  performances,
  isLoading,
  isError,
  onRetry,
}: {
  performances: PerformanceListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) return <AppState loading title="공연 일정을 불러오는 중이에요" />;
  if (isError) {
    return (
      <AppState
        title="공연 일정을 불러오지 못했어요"
        actionLabel="다시 시도"
        onAction={onRetry}
      />
    );
  }
  if (performances.length === 0) {
    return (
      <AppState
        title="등록된 일정이 없어요"
        description="공연 일정을 등록하면 팬들이 소식을 받아볼 수 있어요."
      />
    );
  }

  return (
    <View style={styles.sectionList}>
      {performances.map((performance) => (
        <AppCard key={performance.performanceId} style={styles.rowCard}>
          <Avatar
            imageUrl={performance.posterImageUrl}
            label={performance.title}
            size={48}
          />
          <View style={styles.rowText}>
            <Text numberOfLines={1} style={styles.rowTitle}>
              {performance.title}
            </Text>
            <Text numberOfLines={1} style={styles.rowMeta}>
              {performance.venue}
            </Text>
            <Text style={styles.rowMeta}>{formatPerformanceDate(performance)}</Text>
          </View>
          <Badge label="등록 완료" tone="yellow" />
        </AppCard>
      ))}
    </View>
  );
}

function MusicSection({
  musicLinks,
  isLoading,
  isError,
  onRetry,
}: {
  musicLinks?: MusicLinksResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const links = [
    { label: "Spotify", url: musicLinks?.spotifyUrl },
    { label: "YouTube", url: musicLinks?.youtubeUrl },
    { label: "SoundCloud", url: musicLinks?.soundcloudUrl },
    {
      label: musicLinks?.etcPlatform ?? "기타 플랫폼",
      url: musicLinks?.etcUrl,
    },
    { label: "기타 링크", url: musicLinks?.otherUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));

  if (isLoading) return <AppState loading title="음원 링크를 불러오는 중이에요" />;
  if (isError) {
    return (
      <AppState
        title="음원 링크를 불러오지 못했어요"
        actionLabel="다시 시도"
        onAction={onRetry}
      />
    );
  }
  if (links.length === 0) {
    return (
      <AppState
        title="등록된 음원이 없어요"
        description="음원 링크를 등록하면 팬들이 바로 들으러 갈 수 있어요."
      />
    );
  }

  return (
    <View style={styles.sectionList}>
      {links.map((link) => (
        <AppCard key={`${link.label}-${link.url}`} style={styles.linkCard}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{link.label}</Text>
            <Text numberOfLines={1} style={styles.rowMeta}>
              {link.url}
            </Text>
          </View>
          <AppButton
            label="열기"
            variant="ghost"
            style={styles.compactButton}
            onPress={() => void Linking.openURL(link.url)}
          />
        </AppCard>
      ))}
    </View>
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
  description: {
    color: colors.neutral700,
    fontSize: 14,
    lineHeight: 21,
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
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral100,
  },
  activeTab: {
    backgroundColor: colors.secondary100,
  },
  tabLabel: {
    color: colors.neutral600,
    fontSize: 14,
    fontWeight: "800",
  },
  activeTabLabel: {
    color: colors.secondary600,
  },
  sectionList: {
    gap: spacing.md,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "900",
  },
  rowMeta: {
    color: colors.neutral600,
    fontSize: 12,
    lineHeight: 18,
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
});
