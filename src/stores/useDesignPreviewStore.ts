import { create } from "zustand";

type DesignPreviewState = {
  enabled: boolean;
  enable: () => void;
  disable: () => void;
};

export const useDesignPreviewStore = create<DesignPreviewState>((set) => ({
  enabled: false,
  enable: () => set({ enabled: true }),
  disable: () => set({ enabled: false }),
}));
