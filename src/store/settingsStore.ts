import { create } from "zustand";
import type { Theme, CursorStyle } from "../types/index.ts";

interface SettingsState {
  theme: Theme;
  fontSize: number;
  soundEnabled: boolean;
  cursorStyle: CursorStyle;
  settingsOpen: boolean;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  toggleSound: () => void;
  setCursorStyle: (style: CursorStyle) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) ?? "dark",
  fontSize: Number(localStorage.getItem("fontSize")) || 30,
  soundEnabled: localStorage.getItem("sound") !== "off",
  cursorStyle: (localStorage.getItem("cursorStyle") as CursorStyle) ?? "line",
  settingsOpen: false,

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    set({ theme });
  },

  setFontSize(fontSize) {
    localStorage.setItem("fontSize", String(fontSize));
    set({ fontSize });
  },

  toggleSound() {
    set((state) => {
      const next = !state.soundEnabled;
      localStorage.setItem("sound", next ? "on" : "off");
      return { soundEnabled: next };
    });
  },

  setCursorStyle(cursorStyle) {
    localStorage.setItem("cursorStyle", cursorStyle);
    set({ cursorStyle });
  },

  openSettings() {
    set({ settingsOpen: true });
  },

  closeSettings() {
    set({ settingsOpen: false });
  },
}));
