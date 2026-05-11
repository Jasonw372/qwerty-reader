import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Provider, User } from "@supabase/supabase-js";

interface AuthResult {
  error?: string;
  needsConfirmation?: boolean;
}

export type OAuthProvider = Extract<Provider, "github" | "google">;

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, initialized: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return { error: error?.message };
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    set({ loading: false });
    if (error) return { error: error.message };
    // 当 Supabase 项目开启 "Confirm email" 时,session 为 null,需要用户去邮箱点确认链接
    const needsConfirmation = !data.session;
    if (needsConfirmation) {
      // 即便 signUp 返回了 user,也不视为登录;清空本地 session
      await supabase.auth.signOut();
      set({ user: null });
    }
    return { needsConfirmation };
  },

  signInWithOAuth: async (provider) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    // signInWithOAuth 会触发跳转,通常不会走到这里;失败时复位 loading
    if (error) set({ loading: false });
    return { error: error?.message };
  },

  resendConfirmation: async (email) => {
    set({ loading: true });
    const { error } = await supabase.auth.resend({ type: "signup", email });
    set({ loading: false });
    return { error: error?.message };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
