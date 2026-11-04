import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/shared/components/AppIcon";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { colors, textStyles } from "@/shared/constants/theme";
import type { LiveNowItem, ScheduledLiveItem } from "@/types/live/live";

export const formatScheduledAt = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatReplayDuration = (totalSeconds?: number) => {
  if (totalSeconds === undefined) return "00:00:00";

  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

export function FanLiveNowCard({
  live,
  listenerLabel,
}: {
  live: LiveNowItem;
  listenerLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() => router.push(`/fan/live/room/${live.liveId}` as Href)}
    >
      <View style={styles.profileGlow}>
        <ProfileImage
          imageUrl={live.bandProfileImageUrl ?? live.thumbnailImageUrl}
          size={62}
          variant="band"
        />
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.liveInfo}>
        <Text numberOfLines={1} style={styles.title}>
          {live.title}
        </Text>
        <Text numberOfLines={1} style={styles.bandName}>
          {live.bandName}
        </Text>
        <View style={styles.listenerRow}>
          <AppIcon name="headsetPink" width={12} height={13} />
          <Text numberOfLines={1} style={styles.listenerText}>
            {listenerLabel}
          </Text>
        </View>
      </View>

      <View style={styles.enterButton}>
        <Text style={styles.enterText}>입장</Text>
      </View>
    </Pressable>
  );
}

export function FanScheduledCard({
  live,
  notified,
  disabled,
  showNotification = true,
  onToggleNotification,
}: {
  live: ScheduledLiveItem;
  notified: boolean;
  disabled: boolean;
  showNotification?: boolean;
  onToggleNotification: () => void;
}) {
  return (
    <View style={[styles.card, styles.scheduledCard]}>
      <ProfileImage
        imageUrl={live.bandProfileImageUrl ?? live.thumbnailImageUrl}
        size={62}
        variant="band"
      />

      <View style={styles.scheduledInfo}>
        <Text numberOfLines={1} style={styles.title}>
          {live.title}
        </Text>
        <Text numberOfLines={1} style={styles.scheduledBand}>
          {live.bandName}
        </Text>
        <Text numberOfLines={1} style={styles.scheduledAt}>
          {formatScheduledAt(live.scheduledAt)}
        </Text>
      </View>

      {showNotification ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled, selected: notified }}
          disabled={disabled}
          style={[
            styles.alarmButton,
            notified ? styles.alarmSoft : styles.alarmOutline,
            disabled && styles.alarmDisabled,
          ]}
          onPress={onToggleNotification}
        >
          <AppIcon name="notification" size={notified ? 14 : 18} />
          <Text style={notified ? styles.alarmTextCompact : styles.alarmText}>
            {notified ? "알림 받는 중" : "알림 받기"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 86,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 4px 8px 0px rgba(20, 20, 20, 0.1)",
  },
  scheduledCard: {
    gap: 10,
  },
  profileGlow: {
    width: 62,
    height: 62,
    flexShrink: 0,
    borderRadius: 31,
    boxShadow: "0px 0px 18px 0px rgba(240, 69, 121, 0.8)",
  },
  liveBadge: {
    position: "absolute",
    left: 17.5,
    bottom: -2,
    width: 27,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.primary400,
  },
  liveBadgeText: {
    ...textStyles.label4,
    color: colors.white,
  },
  liveInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    paddingRight: 66,
  },
  title: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  bandName: {
    ...textStyles.caption2,
    color: colors.neutral700,
    marginTop: 2,
  },
  listenerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  listenerText: {
    ...textStyles.caption2,
    flexShrink: 1,
    color: colors.primary400,
  },
  enterButton: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 51,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary400,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  enterText: {
    ...textStyles.caption3,
    color: colors.primary400,
  },
  scheduledInfo: {
    flex: 1,
    height: 62,
    minWidth: 0,
  },
  scheduledBand: {
    ...textStyles.body5,
    color: colors.neutral700,
    marginTop: 3,
  },
  scheduledAt: {
    ...textStyles.body5,
    color: colors.primary300,
    marginTop: 3,
  },
  alarmButton: {
    width: 81,
    height: 32,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
  },
  alarmSoft: {
    borderColor: "transparent",
    backgroundColor: colors.primary50,
    paddingHorizontal: 2,
  },
  alarmOutline: {
    borderColor: colors.primary400,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
  },
  alarmDisabled: {
    opacity: 0.6,
  },
  alarmText: {
    ...textStyles.caption3,
    color: colors.primary400,
  },
  alarmTextCompact: {
    ...textStyles.body5,
    color: colors.primary400,
  },
});
