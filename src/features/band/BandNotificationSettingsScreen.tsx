import { StyleSheet, Text, View } from "react-native";

import { BandBanner } from "@/features/my/BandBanner";
import { MyHeader } from "@/features/my/MyHeader";
import {
  NotificationToggleList,
  type NotificationToggleItem,
} from "@/features/my/NotificationToggleList";
import { useNotificationSettingToggle } from "@/features/my/useNotificationSettingToggle";
import { useBandQuery } from "@/hooks/api/band/useBand";
import { useActiveBandId } from "@/hooks/api/user/useMyProfiles";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import type { NotificationSettingType } from "@/types/notification";

type VariantConfig = {
  title: string;
  bannerDescription: string;
  items: NotificationToggleItem[];
  defaultValues: Record<string, boolean>;
  settingTypeById: Record<string, NotificationSettingType>;
};

const VARIANTS: Record<"recruit" | "live", VariantConfig> = {
  recruit: {
    title: "모집 공고 알림 설정",
    bannerDescription: "현재 선택된 밴드의 세션 모집 알림",
    items: [
      {
        id: "new-applicant",
        title: "새 지원자 알림",
        description: "모집 공고에 새로운 지원자가 생기면 알려드려요",
      },
      {
        id: "application-status",
        title: "지원서 상태 변경 알림",
        description: "다른 운영자가 지원자를 수락 · 거절하면 알려드려요",
      },
      {
        id: "recruit-deadline",
        title: "모집 마감 임박 알림",
        description: "모집 마감 24시간 전에 알려드려요",
      },
    ],
    defaultValues: {
      "new-applicant": true,
      "application-status": true,
      "recruit-deadline": false,
    },
    settingTypeById: {
      "new-applicant": "BAND_NEW_SESSION_APPLICATION",
      "application-status": "BAND_SESSION_APPLICATION_STATUS",
      "recruit-deadline": "BAND_SESSION_RECRUITMENT_DEADLINE",
    },
  },
  live: {
    title: "라이브 알림 설정",
    bannerDescription: "현재 선택된 밴드의 라이브 운영 알림",
    items: [
      {
        id: "upcoming-live-reminder",
        title: "예정 라이브 리마인드",
        description: "등록한 라이브 시작 30분 전에 알려드려요",
      },
      {
        id: "live-start-status",
        title: "라이브 시작 상태 알림",
        description: "라이브 송출이 정상 시작되면 운영자에게 알려드려요",
      },
    ],
    defaultValues: {
      "upcoming-live-reminder": true,
      "live-start-status": true,
    },
    settingTypeById: {
      "upcoming-live-reminder": "BAND_SCHEDULED_LIVE_REMINDER",
      "live-start-status": "BAND_LIVE_START_STATUS",
    },
  },
};

export function BandNotificationSettingsScreen({
  variant,
}: {
  variant: "recruit" | "live";
}) {
  const config = VARIANTS[variant];
  const activeBandQuery = useActiveBandId();
  const bandQuery = useBandQuery(activeBandQuery.activeBandId);
  const { values, isDisabled, statusMessage, toggle } =
    useNotificationSettingToggle({
      mode: "BAND",
      defaultValues: config.defaultValues,
      settingTypeById: config.settingTypeById,
    });

  return (
    <Screen contentStyle={styles.container}>
      <MyHeader title={config.title} />

      <View style={styles.content}>
        <BandBanner
          bandName={bandQuery.data?.name ?? ""}
          description={config.bannerDescription}
          profileImageUrl={bandQuery.data?.profileImageUrl}
        />

        {statusMessage ? (
          <Text style={styles.status}>{statusMessage}</Text>
        ) : null}

        <View style={styles.list}>
          <NotificationToggleList
            items={config.items}
            values={values}
            tone="secondary"
            disabled={isDisabled}
            onToggle={(id, checked) => void toggle(id, checked)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  status: {
    ...textStyles.caption2,
    color: colors.neutral600,
    marginTop: 12,
    textAlign: "center",
  },
  list: {
    marginTop: 24,
  },
});
