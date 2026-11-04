import { router, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ProfileConcertCard,
  ProfileEmpty,
  ProfileList,
  ProfileMusicCard,
  ProfilePostCard,
  ProfileTabs,
  type ProfileMusicPlatform,
} from "@/features/fan/FanBandProfileParts";
import { mapExploreBand } from "@/features/fan/fanExploreMappers";
import {
  useBandMusicLinksQuery,
  useBandPerformancesQuery,
  useBandPostsQuery,
} from "@/hooks/api/band/useBand";
import {
  useFanExploreBandDetailQuery,
  useFollowExploreBand,
  useUnfollowExploreBand,
} from "@/hooks/api/fan/useFanExplore";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { Toast } from "@/shared/components/Toast";
import { getGenreLabel, getRegionLabel } from "@/shared/constants/bandLabels";
import { colors, textStyles } from "@/shared/constants/theme";

import type { MusicLinksResponse } from "@/types/band/musicLink";

const TABS = ["콘텐츠", "일정", "음원"] as const;
type ProfileTab = (typeof TABS)[number];

type MusicLinkItem = {
  id: string;
  title: string;
  url: string;
  icon: ProfileMusicPlatform;
};

const getExternalUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

const getMusicLinks = (links?: MusicLinksResponse | null): MusicLinkItem[] => {
  if (!links) return [];

  const items = [
    { id: "spotify", title: "Spotify", url: links.spotifyUrl, icon: "spotify" },
    { id: "youtube", title: "YouTube", url: links.youtubeUrl, icon: "youtube" },
    {
      id: "soundcloud",
      title: "SoundCloud",
      url: links.soundcloudUrl,
      icon: "soundcloud",
    },
    {
      id: "etc",
      title: links.etcPlatform ?? "기타",
      url: links.etcUrl ?? links.otherUrl,
      icon: "other",
    },
  ] as const;

  return items.flatMap((item) => (item.url ? [{ ...item, url: item.url }] : []));
};

export function FanBandProfileScreen() {
  const params = useLocalSearchParams<{ bandId?: string }>();
  const bandId = Number(params.bandId);
  const validBandId = Number.isFinite(bandId) ? bandId : 0;
  const query = useFanExploreBandDetailQuery(validBandId);
  const postsQuery = useBandPostsQuery(validBandId);
  const performancesQuery = useBandPerformancesQuery(validBandId);
  const musicLinksQuery = useBandMusicLinksQuery(validBandId);
  const followMutation = useFollowExploreBand();
  const unfollowMutation = useUnfollowExploreBand();
  const [activeTab, setActiveTab] = useState<ProfileTab>("콘텐츠");
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastMessage(null), []);

  const band = query.data ? mapExploreBand(query.data) : null;
  const bandInfo = query.data?.band ?? query.data;
  const isLive = query.data?.isLive ?? query.data?.live ?? false;
  const liveId = Number(query.data?.liveId ?? 0);
  const canEnterLive = isLive && liveId > 0;
  const isOfficial = query.data?.isOfficial ?? query.data?.official ?? false;
  const isFollowPending = followMutation.isPending || unfollowMutation.isPending;
  const genre = bandInfo?.genre ? getGenreLabel(bandInfo.genre) : "장르";
  const region = bandInfo?.region ? getRegionLabel(bandInfo.region) : "지역";
  const posts = postsQuery.data?.posts ?? [];
  const performances = performancesQuery.data?.performances ?? [];
  const musicLinks = getMusicLinks(musicLinksQuery.data);

  const follow = async () => {
    if (!band?.bandId) return;

    try {
      await followMutation.mutateAsync(band.bandId);
      setToastMessage(`${band.name}를 팔로우했어요`);
    } catch {
      setToastMessage("밴드 팔로우에 실패했어요");
    }
  };

  const unfollow = async () => {
    if (!band?.bandId) return;

    setIsUnfollowModalOpen(false);

    try {
      await unfollowMutation.mutateAsync(band.bandId);
      setToastMessage(`${band.name} 팔로우를 취소했어요`);
    } catch {
      setToastMessage("팔로우 취소에 실패했어요");
    }
  };

  const toggleFollow = () => {
    if (band?.isFollowing) {
      setIsUnfollowModalOpen(true);
      return;
    }

    void follow();
  };

  const openMusicLink = (url: string) => {
    Linking.openURL(getExternalUrl(url)).catch(() => {
      setToastMessage("링크 열기에 실패했어요");
    });
  };

  return (
    <Screen
      edges={["top", "left", "right"]}
      scroll={false}
      contentStyle={styles.container}
    >
      <AppHeader
        title={`${band?.name ?? "밴드"}의 프로필`}
        style={styles.header}
      />

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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profile}>
            <View style={styles.profileRow}>
              <ProfileImage imageUrl={band.imageUrl} size={72} variant="band" />

              <View style={styles.profileText}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{band.name}</Text>
                  {isOfficial ? (
                    <AppIcon name="officialBadge" size={19} />
                  ) : null}
                </View>
                <Text style={styles.meta}>
                  {genre} · {region} · 팔로워 {band.followerCount}명
                </Text>
                <Text style={styles.description}>
                  {band.description ?? "등록된 소개가 없어요"}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={band.bandId == null || isFollowPending}
                style={[
                  styles.actionButton,
                  band.isFollowing ? styles.following : styles.follow,
                ]}
                onPress={toggleFollow}
              >
                <Text style={styles.followText}>
                  {band.isFollowing ? "팔로잉" : "팔로우"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!canEnterLive}
                style={[
                  styles.actionButton,
                  canEnterLive ? styles.liveActive : styles.liveDisabled,
                ]}
                onPress={() =>
                  router.push(`/fan/live/room/${liveId}` as Href)
                }
              >
                <Text
                  style={[
                    styles.liveText,
                    !canEnterLive && styles.liveTextDisabled,
                  ]}
                >
                  라이브 입장
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.tabs}>
            <ProfileTabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </View>

          {activeTab === "콘텐츠" ? (
            posts.length > 0 ? (
              <ProfileList>
                {posts.map((post) => (
                  <ProfilePostCard
                    key={post.postId}
                    post={post}
                    bandName={band.name}
                    profileImageUrl={band.imageUrl}
                    genre={genre}
                    region={region}
                    onPress={() =>
                      router.push(`/fan/explore/contents/${post.postId}` as Href)
                    }
                  />
                ))}
              </ProfileList>
            ) : (
              <ProfileEmpty
                title="아직 등록된 콘텐츠가 없어요"
                description={
                  "새로운 콘텐츠가 등록되면\n팔로우한 팬에게 가장 먼저 알림을 보내드려요"
                }
              />
            )
          ) : null}

          {activeTab === "일정" ? (
            performances.length > 0 ? (
              <ProfileList>
                {performances.map((performance) => (
                  <ProfileConcertCard
                    key={performance.performanceId}
                    performance={performance}
                    onPress={() =>
                      router.push(
                        `/fan/home/concerts/${performance.performanceId}` as Href,
                      )
                    }
                  />
                ))}
              </ProfileList>
            ) : (
              <ProfileEmpty
                title="아직 등록된 일정이 없어요"
                description={
                  "새로운 일정이 등록되면\n팔로우한 팬에게 가장 먼저 알림을 보내드려요"
                }
              />
            )
          ) : null}

          {activeTab === "음원" ? (
            musicLinks.length > 0 ? (
              <View style={styles.music}>
                <Text style={styles.musicGuide}>
                  외부 음원 플랫폼에서 이 밴드의 음악을 들어보세요
                </Text>
                <View style={styles.musicList}>
                  {musicLinks.map((link) => (
                    <ProfileMusicCard
                      key={link.id}
                      title={link.title}
                      url={link.url}
                      icon={link.icon}
                      onPress={() => openMusicLink(link.url)}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <ProfileEmpty
                title="아직 등록된 음원 링크가 없어요"
                description={
                  "밴드가 음원 플랫폼 링크를 등록하면\n여기서 바로 들을 수 있어요"
                }
              />
            )
          ) : null}
        </ScrollView>
      ) : null}

      <ConfirmModal
        open={isUnfollowModalOpen}
        title="팔로우를 취소할까요?"
        description={"이 밴드의 소식이\n홈피드에서 사라져요"}
        onCancel={() => setIsUnfollowModalOpen(false)}
        onConfirm={() => void unfollow()}
      />

      <Toast
        open={toastMessage !== null}
        message={toastMessage}
        tone={toastMessage?.includes("실패") ? "error" : "success"}
        onClose={closeToast}
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
  scrollContent: {
    paddingBottom: 24,
  },
  profile: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 21,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    ...textStyles.label1,
    flexShrink: 1,
    color: colors.neutral900,
  },
  meta: {
    ...textStyles.caption2,
    marginTop: 5,
    color: colors.neutral700,
  },
  description: {
    ...textStyles.body5,
    marginTop: 5,
    color: colors.neutral600,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  actionButton: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  follow: {
    borderColor: colors.primary400,
    backgroundColor: colors.white,
  },
  following: {
    borderColor: colors.primary50,
    backgroundColor: colors.primary50,
  },
  followText: {
    ...textStyles.body1,
    color: colors.primary400,
  },
  liveActive: {
    borderColor: colors.primary400,
    backgroundColor: colors.primary400,
  },
  liveDisabled: {
    borderColor: colors.neutral300,
    backgroundColor: colors.neutral300,
  },
  liveText: {
    ...textStyles.body1,
    color: colors.white,
  },
  liveTextDisabled: {
    color: colors.neutral500,
  },
  tabs: {
    marginTop: 32,
  },
  music: {
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  musicGuide: {
    ...textStyles.caption2,
    color: colors.neutral600,
  },
  musicList: {
    gap: 12,
    marginTop: 16,
  },
});
