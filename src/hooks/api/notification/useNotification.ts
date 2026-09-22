import { useMutation } from "@tanstack/react-query";

import { registerPushToken } from "@/api/notification";
import type { RegisterPushTokenRequest } from "@/types/notification";

export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (body: RegisterPushTokenRequest) => registerPushToken(body),
  });
};
