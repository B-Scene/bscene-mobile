import { useQuery } from "@tanstack/react-query";

import { getMyProfiles } from "@/api/user/myProfiles";
import type { GetMyProfilesParams } from "@/types/user/myProfiles";

export const myProfilesKeys = {
  all: ["myProfiles"] as const,
  list: (params: GetMyProfilesParams) =>
    [...myProfilesKeys.all, params] as const,
};

export const useMyProfilesQuery = (params: GetMyProfilesParams = {}) => {
  return useQuery({
    queryKey: myProfilesKeys.list(params),
    queryFn: () => getMyProfiles(params),
    staleTime: 1000 * 30,
  });
};

export const useActiveBandId = () => {
  const query = useMyProfilesQuery({ type: "band" });
  const activeBand =
    query.data?.bandProfiles.find((profile) => profile.isActive) ??
    query.data?.bandProfiles[0] ??
    null;

  return {
    ...query,
    activeBandId: activeBand?.bandId ?? null,
    activeBand,
  };
};
