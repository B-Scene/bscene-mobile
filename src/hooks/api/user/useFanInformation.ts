import { useQuery } from "@tanstack/react-query";

import { getFanInformation } from "@/api/user/fanInformation";

export const fanInformationKeys = {
  all: ["fanInformation"] as const,
};

export const useFanInformationQuery = () => {
  return useQuery({
    queryKey: fanInformationKeys.all,
    queryFn: getFanInformation,
    staleTime: 1000 * 30,
  });
};
