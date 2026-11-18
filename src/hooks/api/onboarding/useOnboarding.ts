import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkFanNickname,
  getGenres,
  getOnboardingStatus,
  getRegions,
  saveOnboarding,
} from "@/api/onboarding/onboarding";
import type { SaveOnboardingRequest } from "@/types/onboarding/onboarding";

export const onboardingStatusKeys = {
  all: ["onboarding", "status"] as const,
};

export const useOnboardingStatus = (
  options?: {
    enabled?: boolean;
  },
) => {
  return useQuery({
    queryKey: onboardingStatusKeys.all,
    queryFn: getOnboardingStatus,
    enabled: options?.enabled,
  });
};

export const useCheckFanNickname = () => {
  return useMutation({
    mutationFn: checkFanNickname,
  });
};

export const useSaveOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SaveOnboardingRequest) => saveOnboarding(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingStatusKeys.all });
    },
  });
};

export const useGenres = (enabled = true) => {
  return useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
    enabled,
  });
};

export const useRegions = (enabled = true) => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: getRegions,
    enabled,
  });
};
