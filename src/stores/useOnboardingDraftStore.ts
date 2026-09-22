import { create } from "zustand";

import type { ModeCode } from "@/types/onboarding/onboarding";

type OnboardingDraft = {
  selectedModes: ModeCode[];
  initialMode: ModeCode | null;
  fanNickname: string;
  genres: string[];
  regions: string[];
  setModes: (modes: ModeCode[], initialMode: ModeCode) => void;
  setFanNickname: (fanNickname: string) => void;
  toggleGenre: (genre: string) => void;
  toggleRegion: (region: string) => void;
  reset: () => void;
};

const initialState = {
  selectedModes: [] as ModeCode[],
  initialMode: null as ModeCode | null,
  fanNickname: "",
  genres: [] as string[],
  regions: [] as string[],
};

const toggle = (items: string[], item: string) =>
  items.includes(item)
    ? items.filter((currentItem) => currentItem !== item)
    : [...items, item];

export const useOnboardingDraftStore = create<OnboardingDraft>((set) => ({
  ...initialState,

  setModes: (selectedModes, initialMode) => set({ selectedModes, initialMode }),
  setFanNickname: (fanNickname) => set({ fanNickname }),
  toggleGenre: (genre) => set((state) => ({ genres: toggle(state.genres, genre) })),
  toggleRegion: (region) =>
    set((state) => ({ regions: toggle(state.regions, region) })),
  reset: () => set(initialState),
}));
