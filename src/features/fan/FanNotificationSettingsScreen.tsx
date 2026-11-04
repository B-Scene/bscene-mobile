import { StyleSheet, Text, View } from "react-native";

import { MyHeader } from "@/features/my/MyHeader";
import {
  NotificationToggleList,
  type NotificationToggleItem,
} from "@/features/my/NotificationToggleList";
import { useNotificationSettingToggle } from "@/features/my/useNotificationSettingToggle";
import { Screen } from "@/shared/components/Screen";
import { colors, textStyles } from "@/shared/constants/theme";
import type { NotificationSettingType } from "@/types/notification";

type VariantConfig = {
  title: string;
  notice: string;
  items: NotificationToggleItem[];
  defaultValues: Record<string, boolean>;
  settingTypeById: Record<string, NotificationSettingType>;
};

const VARIANTS: Record<"concert" | "live", VariantConfig> = {
  concert: {
    title: "공연 알림 설정",
    notice: "별도의 알림 상세 모달 없이 목록 우측 토글로 켜고 끕니다",
    items: [
      {
        id: "new-concert",
        title: "팔로우 밴드 새 공연 알림",
        description: "팔로우한 밴드가 공연을 등록하면 알려드려요",
      },
      {
        id: "concert-reminder",
        title: "참여 예정 공연 리마인드",
        description: "공연 시작 1시간 전에 알려드려요",
      },
      {
        id: "concert-info-change",
        title: "공연 정보 변경 알림",
        description: "일시 · 장소 · 티켓 정보가 바뀌면 알려드려요",
      },
    ],
    defaultValues: {
      "new-concert": true,
      "concert-reminder": true,
      "concert-info-change": true,
    },
    settingTypeById: {
      "new-concert": "FAN_FOLLOWED_BAND_PERFORMANCE",
      "concert-reminder": "FAN_PERFORMANCE_REMINDER",
      "concert-info-change": "FAN_PERFORMANCE_UPDATE",
    },
  },
  live: {
    title: "라이브 알림 설정",
    notice:
      "팔로우한 밴드와 직접 알림을 신청한 예정 라이브를 기준으로\n알림을 받습니다",
    items: [
      {
        id: "followed-band-live-start",
        title: "팔로우 밴드 라이브 시작 알림",
        description: "팔로우한 밴드가 라이브를 시작하면 알려드려요",
      },
      {
        id: "upcoming-live-reminder",
        title: "예정 라이브 리마인드",
        description: "알림 신청한 라이브 시작 30분 전에 알려드려요",
      },
      {
        id: "live-replay",
        title: "라이브 다시보기 등록 알림",
        description: "종료된 라이브의 다시보기가 등록되면 알려드려요",
      },
    ],
    defaultValues: {
      "followed-band-live-start": true,
      "upcoming-live-reminder": true,
      "live-replay": false,
    },
    settingTypeById: {
      "followed-band-live-start": "FAN_FOLLOWED_BAND_LIVE_START",
      "upcoming-live-reminder": "FAN_SCHEDULED_LIVE_REMINDER",
      "live-replay": "FAN_LIVE_REPLAY_READY",
    },
  },
};

export function FanNotificationSettingsScreen({
  variant,
}: {
  variant: "concert" | "live";
}) {
  const config = VARIANTS[variant];
  const { values, isDisabled, statusMessage, toggle } =
    useNotificationSettingToggle({
      mode: "FAN",
      defaultValues: config.defaultValues,
      settingTypeById: config.settingTypeById,
    });

  return (
    <Screen edges={["top"]} contentStyle={styles.container}>
      <MyHeader title={config.title} />

      <View style={styles.content}>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{config.notice}</Text>
        </View>

        {statusMessage ? (
          <Text style={styles.status}>{statusMessage}</Text>
        ) : null}

        <View style={styles.list}>
          <NotificationToggleList
            items={config.items}
            values={values}
            tone="primary"
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
    paddingHorizontal: 20,
  },
  notice: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary300,
    borderRadius: 12,
    backgroundColor: colors.primary0,
    padding: 12,
  },
  noticeText: {
    ...textStyles.caption2,
    color: colors.neutral600,
    lineHeight: 20,
    textAlign: "center",
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
