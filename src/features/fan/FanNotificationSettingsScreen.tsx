import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  useNotificationSettingsQuery,
  useUpdateNotificationSetting,
} from "@/hooks/api/notification/useNotification";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import type { NotificationSettingType } from "@/types/notification";

type SettingItem = {
  label: string;
  description: string;
  settingType: NotificationSettingType;
  keyName: string;
};

const CONCERT_SETTINGS: SettingItem[] = [
  {
    label: "팔로우 밴드 공연",
    description: "팔로우한 밴드가 새 공연을 등록하면 알려드려요.",
    settingType: "FAN_FOLLOWED_BAND_PERFORMANCE",
    keyName: "new-concert",
  },
  {
    label: "공연 리마인더",
    description: "관심 공연 시작 전 리마인더를 받을 수 있어요.",
    settingType: "FAN_PERFORMANCE_REMINDER",
    keyName: "concert-reminder",
  },
  {
    label: "공연 정보 변경",
    description: "관심 공연의 일정이나 정보가 바뀌면 알려드려요.",
    settingType: "FAN_PERFORMANCE_UPDATE",
    keyName: "concert-info-change",
  },
];

const LIVE_SETTINGS: SettingItem[] = [
  {
    label: "팔로우 밴드 라이브 시작",
    description: "팔로우한 밴드가 라이브를 시작하면 알려드려요.",
    settingType: "FAN_FOLLOWED_BAND_LIVE_START",
    keyName: "followed-band-live-start",
  },
  {
    label: "예정된 라이브 리마인더",
    description: "예약한 라이브가 곧 시작되면 알려드려요.",
    settingType: "FAN_SCHEDULED_LIVE_REMINDER",
    keyName: "upcoming-live-reminder",
  },
  {
    label: "라이브 다시보기",
    description: "다시보기가 준비되면 알려드려요.",
    settingType: "FAN_LIVE_REPLAY_READY",
    keyName: "live-replay",
  },
];

export function FanNotificationSettingsScreen({
  variant,
}: {
  variant: "concert" | "live";
}) {
  const query = useNotificationSettingsQuery({ mode: "FAN" });
  const mutation = useUpdateNotificationSetting();
  const settings = variant === "concert" ? CONCERT_SETTINGS : LIVE_SETTINGS;
  const title = variant === "concert" ? "공연 알림 설정" : "라이브 알림 설정";

  const toggleSetting = async (item: SettingItem, enabled: boolean) => {
    try {
      await mutation.mutateAsync({
        mode: "FAN",
        settingType: item.settingType,
        enabled,
      });
    } catch {
      Alert.alert("알림 설정", "알림 설정을 변경하지 못했어요.");
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <AppHeader title={title} />

      {query.isLoading ? (
        <AppState loading title="알림 설정을 불러오는 중이에요" />
      ) : query.isError ? (
        <AppState
          title="알림 설정을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => void query.refetch()}
        />
      ) : (
        <View style={styles.list}>
          {settings.map((item) => {
            const enabled = query.data?.values[item.keyName] ?? false;

            return (
              <AppCard key={item.settingType} style={styles.settingCard}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDescription}>
                    {item.description}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: enabled }}
                  disabled={mutation.isPending}
                  style={[
                    styles.switchTrack,
                    enabled && styles.switchTrackOn,
                    mutation.isPending && styles.disabled,
                  ]}
                  onPress={() => void toggleSetting(item, !enabled)}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      enabled && styles.switchThumbOn,
                    ]}
                  />
                </Pressable>
              </AppCard>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingText: {
    flex: 1,
    gap: spacing.xs,
  },
  settingLabel: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: "900",
  },
  settingDescription: {
    color: colors.neutral600,
    fontSize: 13,
    lineHeight: 19,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral400,
    padding: 3,
    justifyContent: "center",
  },
  switchTrackOn: {
    backgroundColor: colors.primary500,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  disabled: {
    opacity: 0.5,
  },
});
