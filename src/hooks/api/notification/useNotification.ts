import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getNotifications,
  getNotificationSettings,
  markNotificationAsRead,
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
  list: (size: number) => [...notificationKeys.all, "list", size] as const,
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

export const useNotificationsInfiniteQuery = (size = 20) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(size),
    queryFn: ({ pageParam }) =>
      getNotifications({
        cursor: pageParam,
        size,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 30,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
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
