import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useAudioPlayer } from "expo-audio";
import {
  Pause,
  Play,
  RotateCcw,
} from "lucide-react-native";
import {
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  resolveLiveMediaUrl,
} from "@/api/live/live";
import {
  useReplayPlaybackQuery,
} from "@/hooks/api/live/useLive";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import {
  colors,
  spacing,
} from "@/shared/constants/theme";
import {
  secureTokenStorage,
} from "@/shared/utils/secureTokenStorage";

const parseId =
  (
    value?: string | string[],
  ) => {
    const raw =
      Array.isArray(value)
        ? value[0]
        : value;
    const parsed =
      Number(raw);

    return Number.isFinite(parsed) &&
      parsed > 0
      ? parsed
      : 0;
  };

export function FanLiveReplayScreen() {
  const params =
    useLocalSearchParams<{
      liveId?: string;
    }>();
  const liveId =
    parseId(params.liveId);
  const query =
    useReplayPlaybackQuery(
      liveId,
    );
  const replay =
    query.data;
  const audioPlayer =
    useAudioPlayer(null);
  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(false);
  const [
    playbackError,
    setPlaybackError,
  ] =
    useState("");

  useEffect(() => {
    if (!replay?.playbackUrl) {
      return;
    }

    let active = true;

    const preparePlayback =
      async () => {
        setPlaybackError("");

        try {
          const token =
            await secureTokenStorage.getAccessToken();

          if (!token) {
            throw new Error(
              "로그인이 필요합니다.",
            );
          }

          audioPlayer.replace({
            uri: resolveLiveMediaUrl(
              replay.playbackUrl,
            ),
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          });

          if (active) {
            setIsPlaying(false);
          }
        } catch (error) {
          if (!active) {
            return;
          }

          setPlaybackError(
            error instanceof Error
              ? error.message
              : "다시보기 재생을 준비하지 못했어요.",
          );
        }
      };

    void preparePlayback();

    return () => {
      active = false;
      audioPlayer.pause();
      setIsPlaying(false);
    };
  }, [
    audioPlayer,
    replay?.playbackUrl,
  ]);

  const togglePlayback =
    () => {
      if (!replay?.playbackUrl) {
        return;
      }

      try {
        if (isPlaying) {
          audioPlayer.pause();
          setIsPlaying(false);
          return;
        }

        audioPlayer.play();
        setIsPlaying(true);
      } catch {
        setPlaybackError(
          "다시보기를 재생하지 못했어요.",
        );
      }
    };

  if (query.isLoading) {
    return (
      <Screen>
        <AppHeader title="다시보기" />
        <AppState
          loading
          title="다시보기를 준비하는 중이에요"
        />
      </Screen>
    );
  }

  if (!replay || query.isError) {
    return (
      <Screen>
        <AppHeader title="다시보기" />
        <AppState
          title="다시보기를 불러오지 못했어요"
          actionLabel={
            query.isError
              ? "다시 시도"
              : "목록으로"
          }
          onAction={() => {
            if (query.isError) {
              void query.refetch();
              return;
            }

            router.replace(
              "/fan/live/replays" as Parameters<
                typeof router.replace
              >[0],
            );
          }}
        />
      </Screen>
    );
  }

  const durationSeconds =
    replay.durationSeconds ??
    replay.durationSec ??
    0;

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title="다시보기"
        onBack={() =>
          router.replace(
            "/fan/live/replays" as Parameters<
              typeof router.replace
            >[0],
          )
        }
      />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>REPLAY</Text>
        </View>

        <Avatar
          imageUrl={
            replay.bandProfileImageUrl ??
            replay.thumbnailImageUrl ??
            replay.thumbnailUrl ??
            replay.liveThumbnailUrl ??
            replay.liveThumbnailImageUrl ??
            replay.imageUrl
          }
          label={replay.bandName}
          size={104}
        />

        <Text style={styles.title}>{replay.title}</Text>
        <Text style={styles.bandName}>{replay.bandName}</Text>
        <Text style={styles.meta}>
          {replay.viewCount.toLocaleString()}명 청취 · {formatDuration(durationSeconds)}
        </Text>

        {playbackError ? (
          <Text style={styles.error}>{playbackError}</Text>
        ) : null}
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          style={styles.seekButton}
          onPress={() => {
            audioPlayer.seekTo(0);
            setIsPlaying(false);
          }}
        >
          <RotateCcw size={22} color={colors.neutral700} />
          <Text style={styles.seekText}>처음으로</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "일시 정지" : "재생"}
          style={styles.playButton}
          onPress={togglePlayback}
        >
          {isPlaying ? (
            <Pause size={34} color={colors.white} fill={colors.white} />
          ) : (
            <Play size={34} color={colors.white} fill={colors.white} />
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

function formatDuration(
  totalSeconds: number,
) {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        totalSeconds,
      ),
    );
  const hours =
    Math.floor(
      safeSeconds / 3600,
    );
  const minutes =
    Math.floor(
      (
        safeSeconds % 3600
      ) / 60,
    );
  const seconds =
    safeSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        "0",
      ),
    )
    .join(":");
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.xl,
      paddingBottom:
        spacing.xxl,
    },
    hero: {
      alignItems:
        "center",
      gap: spacing.md,
      paddingTop:
        spacing.xl,
    },
    badge: {
      borderRadius: 8,
      backgroundColor:
        colors.primary400,
      paddingHorizontal:
        8,
      paddingVertical: 4,
    },
    badgeText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
    },
    title: {
      color:
        colors.neutral900,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 31,
      textAlign: "center",
    },
    bandName: {
      color:
        colors.neutral700,
      fontSize: 15,
      fontWeight: "700",
    },
    meta: {
      color:
        colors.neutral500,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },
    error: {
      color:
        colors.error,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
    },
    controls: {
      alignItems:
        "center",
      gap: spacing.lg,
    },
    playButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.primary400,
    },
    seekButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.xs,
      borderRadius: 999,
      backgroundColor:
        colors.neutral100,
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.sm,
    },
    seekText: {
      color:
        colors.neutral700,
      fontSize: 12,
      fontWeight: "700",
    },
  });
