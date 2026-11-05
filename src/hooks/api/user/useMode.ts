import { useMutation, useQueryClient } from "@tanstack/react-query";

import { changeUserMode, toggleUserMode } from "@/api/user/mode";
import { onboardingStatusKeys } from "@/hooks/api/onboarding/useOnboarding";
import { bandMyPageKeys } from "@/hooks/api/user/useBandMyPage";
import { fanMyPageKeys } from "@/hooks/api/user/useFanMyPage";
import { myProfilesKeys } from "@/hooks/api/user/useMyProfiles";
import type { ChangeUserModeRequest } from "@/types/user/mode";

const useRefreshModeQueries = () => {
  const queryClient = useQueryClient();

  return async () => {
    // ProtectedModeRoute가 이 값으로 이동을 판단하므로 화면 이동 전에 갱신을 끝낸다.
    await queryClient.invalidateQueries({
      queryKey: onboardingStatusKeys.all,
    });
    void queryClient.invalidateQueries({ queryKey: myProfilesKeys.all });
    void queryClient.invalidateQueries({ queryKey: fanMyPageKeys.all });
    void queryClient.invalidateQueries({ queryKey: bandMyPageKeys.all });
  };
};

export const useChangeUserMode = () => {
  const refreshModeQueries = useRefreshModeQueries();

  return useMutation({
    mutationFn: (body: ChangeUserModeRequest) => changeUserMode(body),
    onSuccess: refreshModeQueries,
  });
};

export const useToggleUserMode = () => {
  const refreshModeQueries = useRefreshModeQueries();

  return useMutation({
    mutationFn: () => toggleUserMode(),
    onSuccess: refreshModeQueries,
  });
};
