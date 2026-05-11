import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import type { Article, TypingStats, Keystroke } from "../types";
import type { Database } from "../types/supabase";

type DbArticle = Database["public"]["Tables"]["articles"]["Row"];
type DbSessionInsert = Database["public"]["Tables"]["typing_sessions"]["Insert"];

/** 同步当前用户的文章到云端 */
export function useSyncArticles() {
  const user = useAuthStore((s) => s.user);

  const uploadArticle = useCallback(
    async (article: Article) => {
      if (!user) return;
      const record: DbArticle = {
        id: article.id,
        user_id: user.id,
        title: article.title,
        content: article.content,
        source: article.source ?? null,
        language: "en-US",
        is_public: false,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("articles").upsert(record as any, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      return { error: error?.message };
    },
    [user],
  );

  const fetchArticles = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map(
      (a: { id: string; title: string; content: string; source: string | null }): Article => ({
        id: a.id,
        title: a.title,
        content: a.content,
        source: a.source ?? undefined,
      }),
    );
  }, [user]);

  const deleteArticle = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from("articles").delete().eq("id", id).eq("user_id", user.id);
    },
    [user],
  );

  return { uploadArticle, fetchArticles, deleteArticle };
}

/** 上传打字会话数据 */
export function useSyncSession() {
  const user = useAuthStore((s) => s.user);

  const uploadSession = useCallback(
    async (params: { articleId?: string; stats: TypingStats; keystrokes: Keystroke[] }) => {
      if (!user) return;

      const mistakesByChar: Record<string, number> = {};
      for (const k of params.keystrokes) {
        if (!k.correct && k.action === "type") {
          const char = k.expected ?? k.input;
          if (char) mistakesByChar[char] = (mistakesByChar[char] ?? 0) + 1;
        }
      }

      const backspaceCount = params.keystrokes.filter(
        (k) => k.action === "correction" && !k.correct,
      ).length;

      const session: DbSessionInsert = {
        user_id: user.id,
        article_id: params.articleId ?? null,
        wpm: params.stats.wpm,
        accuracy: params.stats.accuracy,
        duration_seconds: params.stats.elapsed,
        total_chars: params.stats.totalChars + params.stats.errorChars,
        correct_chars: params.stats.correctChars,
        incorrect_chars: params.stats.errorChars,
        backspace_count: backspaceCount,
        keystrokes: params.keystrokes as any,
        error_heatmap: mistakesByChar as any,
      };
      const { error } = await supabase.from("typing_sessions").insert(session as any);
      return { error: error?.message };
    },
    [user],
  );

  return { uploadSession };
}
