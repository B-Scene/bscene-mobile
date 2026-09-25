import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useBandQuery } from "@/hooks/api/band/useBand";
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSetting,
} from "@/hooks/api/notification/useNotification";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { AppCard } from "@/shared/components/AppCard";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Avatar } from "@/shared/components/Avatar";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/shared/constants/theme";
import type { NotificationSettingType } from "@/types/notification";

type SettingItem = {
  label: string;
  description: string;
  settingType: NotificationSettingType;
  keyName: string;
};

const RECRUIT_SETTINGS: SettingItem[] = [
  {
    label: "새 지원자 알림",
    description: "모집 공고에 새로운 지원자가 생기면 알려드려요.",
    settingType: "BAND_NEW_SESSION_APPLICATION",
    keyName: "new-applicant",
  },
  {
    label: "지원서 상태 변경",
    description: "다른 운영자가 지원자를 수락하거나 거절하면 알려드려요.",
    settingType: "BAND_SESSION_APPLICATION_STATUS",
    keyName: "application-status",
  },
  {
    label: "모집 마감 임박",
    description: "모집 마감 24시간 전에 알려드려요.",
    settingType: "BAND_SESSION_RECRUITMENT_DEADLINE",
    keyName: "recruit-deadline",
  },
];

const LIVE_SETTINGS: SettingItem[] = [
  {
    label: "예정 라이브 리마인더",
    description: "등록한 라이브 시작 전에 알려드려요.",
    settingType: "BAND_SCHEDULED_LIVE_REMINDER",
    keyName: "upcoming-live-reminder",
  },
  {
    label: "라이브 시작 상태",
    description: "라이브 송출이 정상 시작되면 운영자에게 알려드려요.",
    settingType: "BAND_LIVE_START_STATUS",
    keyName: "live-start-status",
  },
];

export function BandNotificationSettingsScreen({
  variant,
}: {
  variant: "recruit" | "live";
}) {
  const activeBandQuery = useActiveBandId();
  const bandQuery = useBandQuery(activeBandQuery.activeBandId);
  const query = useNotificationSettingsQuery({ mode: "BAND" });
  const mutation = useUpdateNotificationSetting();
  const settings = variant === "recruit" ? RECRUIT_SETTINGS : LIVE_SETTINGS;
  const title =
    variant === "recruit" ? "모집 공고 알림 설정" : "라이브 알림 설정";
  const bandName =
    bandQuery.data?.name ?? activeBandQuery.activeBand?.bandName ?? "내 밴드";
  const profileImageUrl =
    bandQuery.data?.profileImageUrl ?? activeBandQuery.activeBand?.profileImageUrl;

  const toggleSetting = async (item: SettingItem, enabled: boolean) => {
    try {
      await mutation.mutateAsync({
        mode: "BAND",
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

      <AppCard style={styles.bandCard}>
        <Avatar imageUrl={profileImageUrl} label={bandName} size={48} />
        <View style={styles.bandText}>
          <Text style={styles.bandName}>{bandName}</Text>
          <Text style={styles.bandDescription}>
            {variant === "recruit"
              ? "현재 선택된 밴드의 세션 모집 알림"
              : "현재 선택된 밴드의 라이브 운영 알림"}
          </Text>
        </View>
      </AppCard>

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
  bandCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.secondary100,
    borderColor: colors.secondary200,
  },
  bandText: {
    flex: 1,
    gap: spacing.xs,
  },
  bandName: {
    color: colors.neutral900,
    fontSize: 17,
    fontWeight: "900",
  },
  bandDescription: {
    color: colors.neutral600,
    fontSize: 13,
    lineHeight: 19,
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
    backgroundColor: colors.secondary500,
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
