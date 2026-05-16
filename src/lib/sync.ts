import { supabase } from "./supabase";
import { useAuthStore } from "../store/authStore";
import type { Article, TypingStats, Keystroke, TypingSession } from "../types";
import type { Database } from "../types/supabase";
import { isPresetArticle } from "../data/articles";

type DbArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
type DbSessionInsert = Database["public"]["Tables"]["typing_sessions"]["Insert"];
type DbSessionRow = Database["public"]["Tables"]["typing_sessions"]["Row"];

function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export async function uploadArticle(article: Article): Promise<{ error?: string }> {
  const userId = currentUserId();
  if (!userId) return {};
  if (isPresetArticle(article.id)) return {};

  const now = new Date().toISOString();
  const record: DbArticleInsert = {
    id: article.id,
    user_id: userId,
    title: article.title,
    content: article.content,
    source: article.source ?? null,
    language: "en-US",
    is_public: false,
    tags: null,
    created_at: now,
    updated_at: now,
  };
  const { error } = await supabase
    .from("articles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(record as any, { onConflict: "id", ignoreDuplicates: false });
  return { error: error?.message };
}

export async function fetchArticles(): Promise<Article[]> {
  const userId = currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, content, source")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    (data ?? []) as Array<{
      id: string;
      title: string;
      content: string;
      source: string | null;
    }>
  ).map(
    (a): Article => ({
      id: a.id,
      title: a.title,
      content: a.content,
      source: a.source ?? undefined,
    }),
  );
}

export async function deleteArticleRemote(id: string): Promise<{ error?: string }> {
  const userId = currentUserId();
  if (!userId) return {};
  if (isPresetArticle(id)) return {};

  const { error } = await supabase.from("articles").delete().eq("id", id).eq("user_id", userId);
  return { error: error?.message };
}

interface UploadSessionParams {
  articleId?: string;
  stats: TypingStats;
  keystrokes: Keystroke[];
}

export async function uploadSession(params: UploadSessionParams): Promise<{ error?: string }> {
  const userId = currentUserId();
  if (!userId) return {};

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

  const articleId =
    params.articleId && !isPresetArticle(params.articleId) ? params.articleId : null;

  const session: DbSessionInsert = {
    user_id: userId,
    article_id: articleId,
    wpm: params.stats.wpm,
    accuracy: params.stats.accuracy,
    duration_seconds: params.stats.elapsed,
    total_chars: params.stats.totalChars + params.stats.errorChars,
    correct_chars: params.stats.correctChars,
    incorrect_chars: params.stats.errorChars,
    backspace_count: backspaceCount,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keystrokes: params.keystrokes as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error_heatmap: mistakesByChar as any,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("typing_sessions").insert(session as any);
  return { error: error?.message };
}

function parseErrorHeatmap(value: DbSessionRow["error_heatmap"]): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );
  return Object.fromEntries(entries);
}

export async function fetchTypingSessions(limit = 50): Promise<TypingSession[]> {
  const userId = currentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("typing_sessions")
    .select(
      "id, article_id, wpm, accuracy, duration_seconds, total_chars, correct_chars, incorrect_chars, backspace_count, error_heatmap, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as DbSessionRow[]).map((row) => ({
    id: row.id,
    articleId: row.article_id,
    wpm: Math.round(Number(row.wpm ?? 0)),
    accuracy: Math.round(Number(row.accuracy ?? 0)),
    durationSeconds: row.duration_seconds ?? 0,
    totalChars: row.total_chars ?? 0,
    correctChars: row.correct_chars ?? 0,
    incorrectChars: row.incorrect_chars ?? 0,
    backspaceCount: row.backspace_count ?? 0,
    errorHeatmap: parseErrorHeatmap(row.error_heatmap),
    createdAt: row.created_at,
  }));
}
