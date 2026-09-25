import {
    AxiosError,
    type AxiosResponse,
} from "axios";

import { axiosInstance } from "@/api/axiosInstance";

export interface BandManagementApiResponse<T> {
  isSuccess: boolean;
  status: number;
  code: string;
  message: string;
  result: T;
  timeStamp?: string;
}

export type BandMemberPart =
  | "VOCAL"
  | "GUITAR"
  | "BASS"
  | "KEYBOARD"
  | "DRUM"
  | "ETC";

export type BandMemberType =
  | "MEMBER"
  | "SESSION";

export interface BandMemberProfile {
  id: number;
  nickname: string;
  part: string;
  active: boolean;
  createdAt: string;
}

export interface BandMemberItem {
  id: number;
  bandId: number;
  userId: number;
  bandMemberProfileId:
    | number
    | null;

  profileNickname:
    | string
    | null;

  part:
    | BandMemberPart
    | null;

  owner: boolean;
  memberType: BandMemberType;
  status: string;
  createdAt: string;
}

export interface BandMemberCandidate {
  userId: number;
  nickname: string;
  bandMemberStatus:
    | string
    | null;

  inviteAvailable: boolean;
}

export interface UpdateBandProfileRequest {
  name?: string;
  genre?: string;
  region?: string;
  profileImageUrl?: string;
  deleteProfileImage?: boolean;
  description?: string;
}

const assertSuccess = <T>(
  response: AxiosResponse<
    BandManagementApiResponse<T>
  >,
) => {
  const { data } = response;

  if (
    !data.isSuccess ||
    data.result == null
  ) {
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

const assertNullableSuccess =
  <T>(
    response: AxiosResponse<
      BandManagementApiResponse<T>
    >,
  ) => {
    const { data } = response;

    if (!data.isSuccess) {
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

export const updateBandProfile =
  async (
    bandId: number,
    body: UpdateBandProfileRequest,
  ) => {
    const response =
      await axiosInstance.patch<
        BandManagementApiResponse<unknown>
      >(
        `/bands/${bandId}`,
        body,
      );

    return assertSuccess(
      response,
    );
  };

export const getBandMemberProfile =
  async (
    profileId: number,
  ) => {
    const response =
      await axiosInstance.get<
        BandManagementApiResponse<BandMemberProfile>
      >(
        `/band-member-profiles/${profileId}`,
      );

    return assertSuccess(
      response,
    );
  };

export const updateBandMemberProfile =
  async (
    profileId: number,
    body: {
      nickname?: string;
      part?: BandMemberPart;
    },
  ) => {
    const response =
      await axiosInstance.patch<
        BandManagementApiResponse<BandMemberProfile>
      >(
        `/band-member-profiles/${profileId}`,
        body,
      );

    return assertSuccess(
      response,
    );
  };

export const getBandMembers =
  async (
    bandId: number,
  ) => {
    const response =
      await axiosInstance.get<
        BandManagementApiResponse<
          BandMemberItem[]
        >
      >(
        `/bands/${bandId}/members`,
      );

    return assertSuccess(
      response,
    );
  };

export const searchBandMemberCandidates =
  async (
    bandId: number,
    keyword: string,
  ) => {
    const response =
      await axiosInstance.get<
        BandManagementApiResponse<
          BandMemberCandidate[]
        >
      >(
        `/bands/${bandId}/members/search`,
        {
          params: {
            keyword,
          },
        },
      );

    return assertSuccess(
      response,
    );
  };

export const inviteBandMember =
  async (
    bandId: number,
    body: {
      userId: number;
      memberType: BandMemberType;
    },
  ) => {
    const response =
      await axiosInstance.post<
        BandManagementApiResponse<BandMemberItem>
      >(
        `/bands/${bandId}/members`,
        body,
      );

    return assertSuccess(
      response,
    );
  };

export const removeBandMember =
  async (
    bandId: number,
    userId: number,
  ) => {
    const response =
      await axiosInstance.delete<
        BandManagementApiResponse<null>
      >(
        `/bands/${bandId}/members/${userId}`,
      );

    return assertNullableSuccess(
      response,
    );
  };