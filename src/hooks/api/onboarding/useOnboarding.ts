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

export const useOnboardingStatus = () => {
  return useQuery({
    queryKey: onboardingStatusKeys.all,
    queryFn: getOnboardingStatus,
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

export const useGenres = () => {
  return useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });
};

export const useRegions = () => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: getRegions,
  });
};
