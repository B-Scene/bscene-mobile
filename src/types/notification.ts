export interface NotificationApiResponse<T> {
  isSuccess: boolean;
  status?: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
}

export type PushTokenPlatform = "WEB";

export interface RegisterPushTokenRequest {
  token: string;
  platform: PushTokenPlatform;
}

export type NotificationSettingsMode = "FAN" | "BAND";

export type NotificationSettingType =
  | "FAN_FOLLOWED_BAND_PERFORMANCE"
  | "FAN_PERFORMANCE_REMINDER"
  | "FAN_PERFORMANCE_UPDATE"
  | "FAN_FOLLOWED_BAND_LIVE_START"
  | "FAN_SCHEDULED_LIVE_REMINDER"
  | "FAN_LIVE_REPLAY_READY"
  | "BAND_NEW_SESSION_APPLICATION"
  | "BAND_SESSION_APPLICATION_STATUS"
  | "BAND_SESSION_RECRUITMENT_DEADLINE"
  | "BAND_SCHEDULED_LIVE_REMINDER"
  | "BAND_LIVE_START_STATUS";

export interface GetNotificationSettingsParams {
  mode: NotificationSettingsMode;
}

export interface NotificationSettingsResponse {
  mode: NotificationSettingsMode | null;
  values: Record<string, boolean>;
}

export interface UpdateNotificationSettingParams {
  mode: NotificationSettingsMode;
  settingType: NotificationSettingType;
  enabled: boolean;
}
