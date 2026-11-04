export type UserModeType = "BAND" | "FAN";

export interface ChangeUserModeRequest {
  profileId: number;
  type: UserModeType;
}

export interface ChangeUserModeResponse {
  accessToken?: string;
  refreshToken?: string;
  token?: {
    accessToken?: string;
    refreshToken?: string;
  };
}
