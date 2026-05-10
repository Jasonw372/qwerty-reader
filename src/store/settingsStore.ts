import { create } from "zustand";
import type { Theme } from "../types/index.ts";

interface SettingsState {
  theme: Theme;
  fontSize: number;
  soundEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) ?? "dark",
  fontSize: 18,
  soundEnabled: localStorage.getItem("sound") !== "off",

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  setFontSize(fontSize) {
    set({ fontSize });
  },

  toggleSound() {
    set((state) => {
      const next = !state.soundEnabled;
      localStorage.setItem("sound", next ? "on" : "off");
      return { soundEnabled: next };
    });
  },
}));
