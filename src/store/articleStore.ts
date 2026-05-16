import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { Article } from "../types/index.ts";
import { PRESET_ARTICLES, PRESET_IDS, isPresetArticle } from "../data/articles/index.ts";

const IDB_KEY = "qwerty-reader:articles";
const IDB_CURRENT_KEY = "qwerty-reader:currentArticleId";
const IDB_HIDDEN_PRESETS_KEY = "qwerty-reader:hiddenPresets";

interface ArticleState {
  articles: Article[];
  currentArticle: Article | null;
  hiddenPresetIds: Set<string>;
  managerOpen: boolean;
  syncing: boolean;
  setCurrentArticle: (article: Article) => void;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  restorePresets: () => void;
  openManager: () => void;
  closeManager: () => void;
  loadFromStorage: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

function visiblePresets(hidden: ReadonlySet<string>): Article[] {
  return PRESET_ARTICLES.filter((a) => !hidden.has(a.id));
}

function persistUserArticles(articles: Article[]): void {
  void idbSet(
    IDB_KEY,
    articles.filter((a) => !PRESET_IDS.has(a.id)),
  );
}

function persistHidden(hidden: ReadonlySet<string>): void {
  void idbSet(IDB_HIDDEN_PRESETS_KEY, Array.from(hidden));
}

const initialArticles = visiblePresets(new Set());
const initialCurrent = initialArticles[0] ?? null;

function createArticleId(): string {
  return crypto.randomUUID();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeUserArticleIds(
  articles: Article[],
  currentId?: string | null,
): { articles: Article[]; currentId?: string | null; changed: boolean } {
  const idMap = new Map<string, string>();
  const normalized = articles.map((article) => {
    if (PRESET_IDS.has(article.id) || isUuid(article.id)) return article;
    const nextId = createArticleId();
    idMap.set(article.id, nextId);
    return { ...article, id: nextId };
  });

  return {
    articles: normalized,
    currentId: currentId && idMap.has(currentId) ? idMap.get(currentId) : currentId,
    changed: idMap.size > 0,
  };
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: initialArticles,
  currentArticle: initialCurrent,
  hiddenPresetIds: new Set<string>(),
  managerOpen: false,
  syncing: false,

  setCurrentArticle(article) {
    set({ currentArticle: article });
    void idbSet(IDB_CURRENT_KEY, article.id);
  },

  addArticle(article) {
    set((state) => {
      const articles = [...state.articles, article];
      persistUserArticles(articles);
      return { articles };
    });
    void import("../lib/sync.ts").then(({ uploadArticle }) => uploadArticle(article));
  },

  removeArticle(id) {
    set((state) => {
      let hiddenPresetIds = state.hiddenPresetIds;
      let articles: Article[];

      if (isPresetArticle(id)) {
        hiddenPresetIds = new Set(state.hiddenPresetIds);
        hiddenPresetIds.add(id);
        persistHidden(hiddenPresetIds);
        articles = state.articles.filter((a) => a.id !== id);
      } else {
        articles = state.articles.filter((a) => a.id !== id);
        void idbDel(id);
        persistUserArticles(articles);
        void import("../lib/sync.ts").then(({ deleteArticleRemote }) => deleteArticleRemote(id));
      }

      const currentArticle =
        state.currentArticle?.id === id ? (articles[0] ?? null) : state.currentArticle;
      if (currentArticle?.id !== state.currentArticle?.id) {
        void idbSet(IDB_CURRENT_KEY, currentArticle?.id ?? null);
      }
      return { articles, currentArticle, hiddenPresetIds };
    });
  },

  restorePresets() {
    set((state) => {
      const hiddenPresetIds = new Set<string>();
      persistHidden(hiddenPresetIds);
      const userArticles = state.articles.filter((a) => !PRESET_IDS.has(a.id));
      const articles = [...visiblePresets(hiddenPresetIds), ...userArticles];
      return { articles, hiddenPresetIds };
    });
  },

  openManager() {
    set({ managerOpen: true });
  },

  closeManager() {
    set({ managerOpen: false });
  },

  async loadFromStorage() {
    const [stored, currentId, hiddenArr] = await Promise.all([
      idbGet<Article[]>(IDB_KEY),
      idbGet<string>(IDB_CURRENT_KEY),
      idbGet<string[]>(IDB_HIDDEN_PRESETS_KEY),
    ]);
    const hiddenPresetIds = new Set(hiddenArr ?? []);
    const normalized = normalizeUserArticleIds(stored ?? [], currentId);
    const userArticles = normalized.articles;
    const articles = [...visiblePresets(hiddenPresetIds), ...userArticles];
    const currentArticle =
      articles.find((a) => a.id === normalized.currentId) ??
      get().currentArticle ??
      articles[0] ??
      null;
    if (normalized.changed) {
      persistUserArticles(articles);
      if (currentArticle) void idbSet(IDB_CURRENT_KEY, currentArticle.id);
    }
    set({ articles, currentArticle, hiddenPresetIds });
  },

  async syncFromCloud() {
    set({ syncing: true });
    try {
      const { fetchArticles, uploadArticle } = await import("../lib/sync.ts");
      const remote = await fetchArticles();
      const { hiddenPresetIds } = get();
      const localUser = get().articles.filter((a) => !PRESET_IDS.has(a.id));
      const remoteIds = new Set(remote.map((a) => a.id));

      const toUpload = localUser.filter((a) => !remoteIds.has(a.id));
      await Promise.all(toUpload.map((a) => uploadArticle(a)));

      const merged: Article[] = [...visiblePresets(hiddenPresetIds), ...remote, ...toUpload];

      const currentId = get().currentArticle?.id;
      const currentArticle = merged.find((a) => a.id === currentId) ?? merged[0] ?? null;

      persistUserArticles(merged);
      if (currentArticle) void idbSet(IDB_CURRENT_KEY, currentArticle.id);
      set({ articles: merged, currentArticle, syncing: false });
    } catch (err) {
      console.error("syncFromCloud failed", err);
      set({ syncing: false });
    }
  },
}));
