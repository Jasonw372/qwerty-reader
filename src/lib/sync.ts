import { supabase } from "./supabase";
import { useAuthStore } from "../store/authStore";
import type { Article, TypingStats, Keystroke, TypingSession } from "../types";
import type { Database } from "../types/supabase";
import { isPresetArticle } from "../data/articles";

type DbArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
type DbArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type DbSessionInsert = Database["public"]["Tables"]["typing_sessions"]["Insert"];
type DbSessionRow = Database["public"]["Tables"]["typing_sessions"]["Row"];

export interface PublicArticlePage {
  articles: Article[];
  total: number;
}

export interface PublicArticlePageParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export function currentUserIsAdmin(): boolean {
  const user = useAuthStore.getState().user;
  return user?.app_metadata?.role === "admin" || user?.user_metadata?.role === "admin";
}

function mapArticle(
  row: Pick<DbArticleRow, "id" | "title" | "content" | "source" | "is_public" | "review_status">,
): Article {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    source: row.source ?? undefined,
    isPublic: row.is_public,
    reviewStatus: row.review_status,
  };
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
    is_public: article.reviewStatus === "approved",
    review_status: article.reviewStatus ?? "private",
    tags: null,
    submitted_at: article.reviewStatus === "pending" ? now : null,
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
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
    .select("id, title, content, source, is_public, review_status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as DbArticleRow[]).map(mapArticle);
}

export async function deleteArticleRemote(id: string): Promise<{ error?: string }> {
  const userId = currentUserId();
  if (!userId) return {};
  if (isPresetArticle(id)) return {};

  const { error } = await supabase.from("articles").delete().eq("id", id).eq("user_id", userId);
  return { error: error?.message };
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%,_()]/g, "").trim();
}

export async function fetchPublicArticles({
  page = 1,
  pageSize = 12,
  search = "",
}: PublicArticlePageParams = {}): Promise<PublicArticlePage> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const term = sanitizeSearch(search);

  let query = supabase
    .from("articles")
    .select("id, title, content, source, is_public, review_status", { count: "exact" })
    .eq("is_public", true)
    .eq("review_status", "approved")
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (term) {
    query = query.or(`title.ilike.%${term}%,source.ilike.%${term}%`);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return {
    articles: ((data ?? []) as DbArticleRow[]).map(mapArticle),
    total: count ?? 0,
  };
}

export async function fetchPendingPublicArticles(): Promise<Article[]> {
  if (!currentUserIsAdmin()) return [];
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, content, source, is_public, review_status")
    .eq("review_status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as DbArticleRow[]).map(mapArticle);
}

export async function reviewPublicArticle(
  id: string,
  decision: "approved" | "rejected",
): Promise<{ error?: string }> {
  const userId = currentUserId();
  if (!userId || !currentUserIsAdmin()) return { error: "Admin permission required" };

  const now = new Date().toISOString();
  const update = {
    is_public: decision === "approved",
    review_status: decision,
    reviewed_at: now,
    reviewed_by: userId,
    updated_at: now,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("articles") as any).update(update).eq("id", id);

  return { error: error?.message };
}

export async function deletePublicArticle(id: string): Promise<{ error?: string }> {
  if (!currentUserIsAdmin()) return { error: "Admin permission required" };

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id)
    .eq("is_public", true)
    .eq("review_status", "approved");
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
