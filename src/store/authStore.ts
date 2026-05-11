import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Provider, User } from "@supabase/supabase-js";

interface AuthResult {
  error?: string;
  needsConfirmation?: boolean;
  alreadyRegistered?: boolean;
}

export type OAuthProvider = Extract<Provider, "github" | "google">;

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  recoveryMode: boolean;

  setUser: (user: User | null) => void;
  setRecoveryMode: (on: boolean) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  recoveryMode: false,

  setUser: (user) => set({ user }),
  setRecoveryMode: (on) => set({ recoveryMode: on }),

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, initialized: true });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        set({ user: session?.user ?? null, recoveryMode: true });
        return;
      }
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

    // Supabase 的反邮箱枚举行为:已注册邮箱再次 signUp 不会报错,
    // 但返回的 user.identities 会是空数组。用这个信号判断已注册。
    const identitiesEmpty = (data.user?.identities?.length ?? 0) === 0;
    if (identitiesEmpty) {
      return { alreadyRegistered: true };
    }

    // 开启 "Confirm email" 时 session 为 null,需要去邮箱点确认链接
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

  sendPasswordReset: async (email) => {
    set({ loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?recovery=1`,
    });
    set({ loading: false });
    return { error: error?.message };
  },

  updatePassword: async (newPassword) => {
    set({ loading: true });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    set({ loading: false });
    if (error) return { error: error.message };
    set({ recoveryMode: false });
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, recoveryMode: false });
  },
}));
