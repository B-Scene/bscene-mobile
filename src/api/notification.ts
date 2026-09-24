import { AxiosError } from "axios";

import { axiosInstance } from "@/api/axiosInstance";
import type {
  GetNotificationSettingsParams,
  NotificationApiResponse,
  NotificationSettingsMode,
  NotificationSettingsResponse,
  UpdateNotificationSettingParams,
  RegisterPushTokenRequest,
} from "@/types/notification";

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNotificationMode = (value: unknown): NotificationSettingsMode | null => {
  if (typeof value !== "string") return null;
  const mode = value.toUpperCase();
  return mode === "FAN" || mode === "BAND"
    ? (mode as NotificationSettingsMode)
    : null;
};

const getSettingBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (!isRecord(value)) return null;

  for (const key of ["enabled", "isEnabled", "value", "checked", "on"]) {
    if (typeof value[key] === "boolean") return value[key];
  }

  return null;
};

const normalizeSettingKey = (key: string) =>
  key
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

const getSettingItemKey = (item: RawRecord) => {
  for (const key of [
    "key",
    "settingKey",
    "settingType",
    "notificationSettingType",
    "type",
    "name",
    "id",
  ]) {
    if (typeof item[key] === "string") return normalizeSettingKey(item[key]);
  }

  return null;
};

const normalizeNotificationSettings = (
  result: unknown,
): NotificationSettingsResponse => {
  const record = isRecord(result) ? result : {};
  const source =
    record.settings ??
    record.notificationSettings ??
    record.items ??
    record.content ??
    record.data ??
    result;
  const values: Record<string, boolean> = {};

  if (Array.isArray(source)) {
    source.forEach((value) => {
      if (!isRecord(value)) return;
      const key = getSettingItemKey(value);
      const enabled = getSettingBoolean(value);
      if (key && enabled !== null) values[key] = enabled;
    });
  } else if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => {
      const enabled = getSettingBoolean(value);
      if (enabled !== null) values[normalizeSettingKey(key)] = enabled;
    });
  }

  return {
    mode: toNotificationMode(record.mode),
    values,
  };
};

export const registerPushToken = async (body: RegisterPushTokenRequest) => {
  const response = await axiosInstance.post<NotificationApiResponse<unknown>>(
    "/notifications/tokens",
    body,
  );
  const { data } = response;

  if (data.isSuccess === false) {
    throw new AxiosError(
      data.message,
      data.code,
      response.config,
      response.request,
      response,
    );
  }

  return data.result;
};

export const getNotificationSettings = async ({
  mode,
}: GetNotificationSettingsParams) => {
  const { data } = await axiosInstance.get<NotificationApiResponse<unknown>>(
    "/users/me/notification-settings",
    { params: { mode } },
  );

  if (data.isSuccess === false) {
    throw new Error(data.message || "알림 설정을 불러오지 못했어요.");
  }

  return normalizeNotificationSettings(data.result);
};

export const updateNotificationSetting = async ({
  settingType,
  enabled,
}: UpdateNotificationSettingParams) => {
  const { data } = await axiosInstance.patch<NotificationApiResponse<unknown>>(
    `/users/me/notification-settings/${settingType}`,
    { enabled },
  );

  if (data.isSuccess === false) {
    throw new Error(data.message || "알림 설정을 변경하지 못했어요.");
  }

  return data.result;
};
