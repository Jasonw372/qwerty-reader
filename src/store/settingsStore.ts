import { create } from "zustand";
import type { Theme, CursorStyle } from "../types/index.ts";

type ResolvedTheme = Exclude<Theme, "auto">;

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "parchment" : "dark";
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem("theme");
  return stored === "dark" || stored === "parchment" || stored === "auto" ? stored : "auto";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "auto" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", resolveTheme(theme));
  document.documentElement.setAttribute("data-theme-mode", theme);
}

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

const initialTheme = getStoredTheme();
applyTheme(initialTheme);

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (useSettingsStore.getState().theme === "auto") applyTheme("auto");
});

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: initialTheme,
  fontSize: Number(localStorage.getItem("fontSize")) || 30,
  soundEnabled: localStorage.getItem("sound") !== "off",
  cursorStyle: (localStorage.getItem("cursorStyle") as CursorStyle) ?? "line",
  settingsOpen: false,

  setTheme(theme) {
    applyTheme(theme);
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
