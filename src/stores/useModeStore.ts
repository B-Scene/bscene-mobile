import { create } from "zustand";

import type { UserMode } from "@/types/auth/auth";

export type AppMode = "fan" | "band";

type ModeState = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  setModeFromUserMode: (mode: UserMode | null) => void;
};

export const getHomePathForMode = (mode: AppMode | UserMode | null) => {
  if (mode === "BAND" || mode === "band") return "/band/home";
  return "/fan/home";
};

export const useModeStore = create<ModeState>((set) => ({
  mode: "fan",
  setMode: (mode) => set({ mode }),
  setModeFromUserMode: (mode) =>
    set({ mode: mode === "BAND" ? "band" : "fan" }),
}));
