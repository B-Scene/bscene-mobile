import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationSettings,
  registerPushToken,
  updateNotificationSetting,
} from "@/api/notification";
import type {
  GetNotificationSettingsParams,
  RegisterPushTokenRequest,
  UpdateNotificationSettingParams,
} from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  settings: (params: GetNotificationSettingsParams) =>
    [...notificationKeys.all, "settings", params.mode] as const,
};

export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (body: RegisterPushTokenRequest) => registerPushToken(body),
  });
};

export const useNotificationSettingsQuery = (
  params: GetNotificationSettingsParams,
) => {
  return useQuery({
    queryKey: notificationKeys.settings(params),
    queryFn: () => getNotificationSettings(params),
    staleTime: 1000 * 30,
  });
};

export const useUpdateNotificationSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateNotificationSettingParams) =>
      updateNotificationSetting(params),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.settings({ mode: params.mode }),
      });
    },
  });
};
