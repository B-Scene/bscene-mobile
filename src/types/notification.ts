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
