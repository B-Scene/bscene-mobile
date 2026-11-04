import { useMemo, useState } from "react";

import {
  useNotificationSettingsQuery,
  useUpdateNotificationSetting,
} from "@/hooks/api/notification/useNotification";
import type {
  NotificationSettingsMode,
  NotificationSettingType,
} from "@/types/notification";

export const useNotificationSettingToggle = ({
  mode,
  defaultValues,
  settingTypeById,
}: {
  mode: NotificationSettingsMode;
  defaultValues: Record<string, boolean>;
  settingTypeById: Record<string, NotificationSettingType>;
}) => {
  const settingsQuery = useNotificationSettingsQuery({ mode });
  const updateSetting = useUpdateNotificationSetting();
  const [updateFailed, setUpdateFailed] = useState(false);
  const loadedValues = settingsQuery.data?.values;
  const values = useMemo(
    () => ({ ...defaultValues, ...loadedValues }),
    [defaultValues, loadedValues],
  );
  const isDisabled = settingsQuery.isLoading || updateSetting.isPending;
  const statusMessage = updateFailed
    ? "알림 설정을 변경하지 못했어요"
    : settingsQuery.isLoading
      ? "알림 설정을 불러오는 중이에요"
      : settingsQuery.isError
        ? "알림 설정을 불러오지 못했어요"
        : null;

  const toggle = async (id: string, enabled: boolean) => {
    const settingType = settingTypeById[id];

    if (!settingType || isDisabled) return;

    setUpdateFailed(false);

    try {
      await updateSetting.mutateAsync({ mode, settingType, enabled });
    } catch {
      setUpdateFailed(true);
    }
  };

  return { values, isDisabled, statusMessage, toggle };
};
