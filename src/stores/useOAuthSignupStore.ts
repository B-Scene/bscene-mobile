import { create } from "zustand";

import type { RecentOAuthProvider } from "@/shared/utils/secureTokenStorage";

type OAuthSignupState = {
  signupToken: string | null;
  socialEmail: string | null;
  provider: RecentOAuthProvider | null;
  setOAuthSignup: (payload: {
    signupToken: string | null;
    socialEmail: string | null;
    provider: RecentOAuthProvider | null;
  }) => void;
  clearOAuthSignup: () => void;
};

export const useOAuthSignupStore = create<OAuthSignupState>((set) => ({
  signupToken: null,
  socialEmail: null,
  provider: null,
  setOAuthSignup: ({ signupToken, socialEmail, provider }) =>
    set({ signupToken, socialEmail, provider }),
  clearOAuthSignup: () =>
    set({ signupToken: null, socialEmail: null, provider: null }),
}));
