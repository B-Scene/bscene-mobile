import { create } from "zustand";

type OAuthSignupState = {
  signupToken: string | null;
  socialEmail: string | null;
  setOAuthSignup: (payload: {
    signupToken: string | null;
    socialEmail: string | null;
  }) => void;
  clearOAuthSignup: () => void;
};

export const useOAuthSignupStore = create<OAuthSignupState>((set) => ({
  signupToken: null,
  socialEmail: null,
  setOAuthSignup: ({ signupToken, socialEmail }) =>
    set({ signupToken, socialEmail }),
  clearOAuthSignup: () => set({ signupToken: null, socialEmail: null }),
}));
