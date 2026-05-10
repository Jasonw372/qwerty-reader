import { create } from "zustand";
import type { Theme } from "../types/index.ts";

interface SettingsState {
  theme: Theme;
  fontSize: number;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) ?? "dark",
  fontSize: 18,

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  setFontSize(fontSize) {
    set({ fontSize });
  },
}));
