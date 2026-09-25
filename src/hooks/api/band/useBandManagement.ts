import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getBandMemberProfile,
    getBandMembers,
    inviteBandMember,
    removeBandMember,
    searchBandMemberCandidates,
    updateBandMemberProfile,
    updateBandProfile,
    type BandMemberPart,
    type BandMemberType,
    type UpdateBandProfileRequest,
} from "@/api/band/bandManagement";

import {
    bandKeys,
} from "@/hooks/api/band/useBand";

import {
    myProfilesKeys,
} from "@/hooks/api/user/useMyProfiles";

export const bandManagementKeys = {
  all: [
    "bandManagement",
  ] as const,

  members: (
    bandId: number,
  ) => [
    ...bandManagementKeys.all,
    "members",
    bandId,
  ] as const,

  memberSearch: (
    bandId: number,
    keyword: string,
  ) => [
    ...bandManagementKeys.all,
    "memberSearch",
    bandId,
    keyword,
  ] as const,

  profile: (
    profileId: number,
  ) => [
    ...bandManagementKeys.all,
    "profile",
    profileId,
  ] as const,
};

export const useBandMemberProfileQuery =
  (
    profileId:
      | number
      | null,
  ) => {
    return useQuery({
      queryKey:
        bandManagementKeys.profile(
          profileId ?? 0,
        ),

      queryFn: () =>
        getBandMemberProfile(
          profileId ?? 0,
        ),

      enabled:
        Boolean(
          profileId &&
            profileId >
              0,
        ),

      staleTime:
        1000 * 30,
    });
  };

export const useUpdateBandProfile =
  (
    bandId:
      | number
      | null,
  ) => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        body: UpdateBandProfileRequest,
      ) =>
        updateBandProfile(
          bandId ?? 0,
          body,
        ),

      onSuccess: () => {
        if (bandId) {
          queryClient.invalidateQueries({
            queryKey:
              bandKeys.detail(
                bandId,
              ),
          });
        }

        queryClient.invalidateQueries({
          queryKey:
            myProfilesKeys.all,
        });
      },
    });
  };

export const useUpdateBandMemberProfile =
  (
    profileId:
      | number
      | null,
  ) => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        body: {
          nickname?: string;
          part?: BandMemberPart;
        },
      ) =>
        updateBandMemberProfile(
          profileId ?? 0,
          body,
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            bandManagementKeys.all,
        });

        queryClient.invalidateQueries({
          queryKey:
            myProfilesKeys.all,
        });
      },
    });
  };

export const useBandMembersQuery =
  (
    bandId:
      | number
      | null,
  ) => {
    return useQuery({
      queryKey:
        bandManagementKeys.members(
          bandId ?? 0,
        ),

      queryFn: () =>
        getBandMembers(
          bandId ?? 0,
        ),

      enabled:
        Boolean(
          bandId &&
            bandId >
              0,
        ),

      staleTime:
        1000 * 30,
    });
  };

export const useBandMemberCandidatesQuery =
  (
    bandId:
      | number
      | null,
    keyword: string,
  ) => {
    return useQuery({
      queryKey:
        bandManagementKeys.memberSearch(
          bandId ?? 0,
          keyword,
        ),

      queryFn: () =>
        searchBandMemberCandidates(
          bandId ?? 0,
          keyword.trim(),
        ),

      enabled:
        Boolean(
          bandId &&
            bandId > 0 &&
            keyword
              .trim()
              .length >
              0,
        ),

      staleTime:
        1000 * 15,
    });
  };

export const useInviteBandMember =
  (
    bandId:
      | number
      | null,
  ) => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: ({
        userId,
        memberType = "MEMBER",
      }: {
        userId: number;
        memberType?: BandMemberType;
      }) =>
        inviteBandMember(
          bandId ?? 0,
          {
            userId,
            memberType,
          },
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            bandManagementKeys.members(
              bandId ??
                0,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            bandManagementKeys.all,
        });
      },
    });
  };

export const useRemoveBandMember =
  (
    bandId:
      | number
      | null,
  ) => {
    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn: (
        userId: number,
      ) =>
        removeBandMember(
          bandId ?? 0,
          userId,
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            bandManagementKeys.members(
              bandId ??
                0,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            myProfilesKeys.all,
        });
      },
    });
  };