import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { resolveLiveMediaUrl } from "@/api/live/live";
import { LiveWaveform } from "@/features/live/LiveWaveform";
import { useReplayPlaybackQuery } from "@/hooks/api/live/useLive";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import { secureTokenStorage } from "@/shared/utils/secureTokenStorage";

const SEEK_SECONDS = 10;
const THUMB_SIZE = 14;

const parseId = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatTime = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

const goToReplayList = () => router.replace("/fan/live/replays" as Href);

export function FanLiveReplayScreen() {
  const params = useLocalSearchParams<{ liveId?: string }>();
  const liveId = parseId(params.liveId);
  const query = useReplayPlaybackQuery(liveId);
  const replay = query.data;
  const audioPlayer = useAudioPlayer(null);
  const status = useAudioPlayerStatus(audioPlayer);
  const [playbackError, setPlaybackError] = useState("");
  const [dragSeconds, setDragSeconds] = useState<number | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (!replay?.playbackUrl) return;

    let active = true;

    const preparePlayback = async () => {
      setPlaybackError("");

      try {
        const token = await secureTokenStorage.getAccessToken();

        if (!token) throw new Error("로그인이 필요합니다.");

        audioPlayer.replace({
          uri: resolveLiveMediaUrl(replay.playbackUrl),
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        if (!active) return;

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
    };
  }, [audioPlayer, replay?.playbackUrl]);

  if (query.isLoading) {
    return (
      <Screen contentStyle={styles.stateContainer}>
        <AppHeader title="다시보기" style={styles.stateHeader} />
        <AppState loading title="다시보기를 준비하는 중이에요" />
      </Screen>
    );
  }

  if (!replay || query.isError) {
    return (
      <Screen contentStyle={styles.stateContainer}>
        <AppHeader
          title="다시보기"
          style={styles.stateHeader}
          onBack={goToReplayList}
        />
        <AppState
          title="다시보기를 불러오지 못했어요"
          actionLabel={query.isError ? "다시 시도" : "목록으로"}
          onAction={() => {
            if (query.isError) {
              void query.refetch();
              return;
            }

            goToReplayList();
          }}
        />
      </Screen>
    );
  }

  const totalSeconds =
    replay.durationSec ?? replay.durationSeconds ?? status.duration ?? 0;
  const elapsedSeconds = dragSeconds ?? status.currentTime;
  const progress =
    totalSeconds > 0
      ? Math.min(1, Math.max(0, elapsedSeconds / totalSeconds))
      : 0;

  const seekTo = (seconds: number) => {
    void audioPlayer.seekTo(Math.min(totalSeconds, Math.max(0, seconds)));
  };

  const togglePlayback = async () => {
    try {
      if (status.playing) {
        audioPlayer.pause();
        return;
      }

      // 끝까지 재생한 뒤에는 처음부터 다시 재생한다.
      if (totalSeconds > 0 && status.currentTime >= totalSeconds - 0.5) {
        await audioPlayer.seekTo(0);
      }

      audioPlayer.play();
      setPlaybackError("");
    } catch {
      setPlaybackError("다시보기를 재생하지 못했어요.");
    }
  };

  const getTouchSeconds = (event: GestureResponderEvent) => {
    if (trackWidth <= 0) return 0;

    const ratio = event.nativeEvent.locationX / trackWidth;

    return Math.min(1, Math.max(0, ratio)) * totalSeconds;
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.replayBadge}>
            <Text style={styles.replayBadgeText}>REPLAY</Text>
          </View>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {replay.title}
          </Text>
          <View style={styles.headerListeners}>
            <AppIcon name="headsetDark" size={16} />
            <Text style={styles.headerText}>
              {replay.viewCount.toLocaleString()}명 청취
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.exitButton}
          onPress={goToReplayList}
        >
          <Text style={styles.exitText}>나가기</Text>
        </Pressable>
      </View>

      {playbackError ? (
        <Text style={styles.error}>{playbackError}</Text>
      ) : null}

      <View style={styles.hero}>
        <View style={styles.stage}>
          <LiveWaveform isActive={status.playing} side="left" />
          <View style={styles.profile}>
            <ProfileImage
              imageUrl={
                replay.bandProfileImageUrl ??
                replay.thumbnailImageUrl ??
                replay.thumbnailUrl ??
                replay.liveThumbnailUrl ??
                replay.liveThumbnailImageUrl ??
                replay.imageUrl
              }
              size={156}
              variant="band"
            />
          </View>
          <LiveWaveform isActive={status.playing} side="right" />
        </View>

        <View style={styles.heroText}>
          <View style={styles.bandRow}>
            <Text style={styles.bandName}>{replay.bandName}</Text>
            <AppIcon name="verifiedBadge" />
          </View>
          <Text style={styles.title}>{replay.title}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel="재생 위치 조절"
          style={styles.track}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => totalSeconds > 0}
          onMoveShouldSetResponder={() => totalSeconds > 0}
          onResponderGrant={(event) => setDragSeconds(getTouchSeconds(event))}
          onResponderMove={(event) => setDragSeconds(getTouchSeconds(event))}
          onResponderRelease={(event) => {
            seekTo(getTouchSeconds(event));
            setDragSeconds(null);
          }}
          onResponderTerminate={() => setDragSeconds(null)}
        >
          <View pointerEvents="none" style={styles.trackBase} />
          <Svg
            pointerEvents="none"
            width={Math.max(trackWidth, 1)}
            height={THUMB_SIZE}
            style={styles.trackFill}
          >
            <Defs>
              <LinearGradient id="replayProgress" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.primary400} />
                <Stop offset="0.5" stopColor={colors.primary300} />
                <Stop offset="1" stopColor={colors.primary100} />
              </LinearGradient>
            </Defs>
            <Rect
              y={(THUMB_SIZE - 4) / 2}
              width={trackWidth * progress}
              height={4}
              rx={2}
              fill="url(#replayProgress)"
            />
            <Circle
              cx={Math.min(
                Math.max(trackWidth * progress, THUMB_SIZE / 2),
                Math.max(trackWidth - THUMB_SIZE / 2, THUMB_SIZE / 2),
              )}
              cy={THUMB_SIZE / 2}
              r={THUMB_SIZE / 2}
              fill={colors.primary400}
            />
          </Svg>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.elapsed}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.total}>{formatTime(totalSeconds)}</Text>
        </View>

        <View style={styles.buttons}>
          <SeekButton
            direction="backward"
            onPress={() => seekTo(status.currentTime - SEEK_SECONDS)}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={status.playing ? "일시 정지" : "재생"}
            style={[styles.playButton, !status.isLoaded && styles.disabled]}
            onPress={() => void togglePlayback()}
          >
            {status.playing ? (
              <View style={styles.pauseIcon}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            ) : (
              <AppIcon name="playWhite" size={32} />
            )}
          </Pressable>

          <SeekButton
            direction="forward"
            onPress={() => seekTo(status.currentTime + SEEK_SECONDS)}
          />
        </View>
      </View>
    </Screen>
  );
}

function SeekButton({
  direction,
  onPress,
}: {
  direction: "backward" | "forward";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${direction === "backward" ? "10초 전" : "10초 후"} 이동`}
      hitSlop={8}
      style={styles.seekButton}
      onPress={onPress}
    >
      <AppIcon
        name={direction === "backward" ? "moveLeft" : "moveRight"}
        width={27}
        height={32}
      />
      <Text style={styles.seekLabel}>10</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  stateHeader: {
    paddingHorizontal: 15,
  },
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
    paddingLeft: 31,
    paddingRight: 24,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  replayBadge: {
    height: 22,
    flexShrink: 0,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary400,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  replayBadgeText: {
    ...textStyles.caption3,
    color: colors.white,
  },
  headerTitle: {
    ...textStyles.caption2,
    maxWidth: 115,
    flexShrink: 1,
    color: colors.neutral900,
  },
  headerListeners: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerText: {
    ...textStyles.caption2,
    color: colors.neutral900,
  },
  exitButton: {
    flexShrink: 0,
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    boxShadow: "0px 2px 8px 0px rgba(198, 40, 40, 0.18)",
  },
  exitText: {
    ...textStyles.caption3,
    color: colors.error,
  },
  error: {
    ...textStyles.caption3,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.primary400,
    color: colors.white,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
  },
  hero: {
    marginTop: 118,
  },
  stage: {
    height: 160,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  profile: {
    width: 160,
    height: 160,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 80,
    backgroundColor: colors.white,
    boxShadow:
      "0px 0px 11px 0px rgba(252, 213, 224, 0.9), 0px 0px 12px 0px rgba(240, 69, 121, 0.45)",
  },
  heroText: {
    alignItems: "center",
    gap: 5,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  bandRow: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bandName: {
    ...textStyles.label1,
    color: colors.neutral900,
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral900,
    textAlign: "center",
  },
  controls: {
    marginTop: 72,
    paddingHorizontal: 24,
  },
  track: {
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  trackBase: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral300,
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  elapsed: {
    ...textStyles.caption4,
    color: colors.neutral700,
  },
  total: {
    ...textStyles.caption4,
    color: colors.neutral400,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginTop: 15,
  },
  seekButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  seekLabel: {
    position: "absolute",
    top: 13,
    color: colors.neutral800,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
  },
  playButton: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: colors.primary400,
  },
  disabled: {
    opacity: 0.5,
  },
  pauseIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pauseBar: {
    width: 8,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
});
