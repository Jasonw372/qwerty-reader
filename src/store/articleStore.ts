import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { Article } from "../types/index.ts";
import { uploadArticle, deleteArticleRemote, fetchArticles } from "../lib/sync.ts";

const SAMPLE: Article = {
  id: "sample-1",
  title: "The Future of Web Development",
  source: "Sample",
  content: `The rapid development of modern web frameworks has fundamentally changed how we approach building applications. React, Vue, and Svelte each offer distinct paradigms for managing state and rendering UI components efficiently.

Server-side rendering has made a significant comeback with frameworks like Next.js and Nuxt, enabling developers to deliver faster initial page loads while maintaining the interactivity of single-page applications. This hybrid approach represents a maturation of the ecosystem.

TypeScript adoption has grown dramatically across the industry, bringing static type checking to JavaScript projects of all sizes. The tooling improvements, from language servers to build tools, have made the development experience considerably more productive and reliable.`,
};

const IDB_KEY = "qwerty-reader:articles";
const IDB_CURRENT_KEY = "qwerty-reader:currentArticleId";

interface ArticleState {
  articles: Article[];
  currentArticle: Article | null;
  managerOpen: boolean;
  syncing: boolean;
  setCurrentArticle: (article: Article) => void;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  openManager: () => void;
  closeManager: () => void;
  loadFromStorage: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

function persistLocal(articles: Article[]) {
  void idbSet(
    IDB_KEY,
    articles.filter((a) => a.id !== SAMPLE.id),
  );
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [SAMPLE],
  currentArticle: SAMPLE,
  managerOpen: false,
  syncing: false,

  setCurrentArticle(article) {
    set({ currentArticle: article });
    void idbSet(IDB_CURRENT_KEY, article.id);
  },

  addArticle(article) {
    set((state) => {
      const articles = [...state.articles, article];
      persistLocal(articles);
      return { articles };
    });
    void uploadArticle(article);
  },

  removeArticle(id) {
    if (id === SAMPLE.id) return;
    set((state) => {
      const articles = state.articles.filter((a) => a.id !== id);
      const currentArticle =
        state.currentArticle?.id === id ? (articles[0] ?? null) : state.currentArticle;
      void idbDel(id);
      persistLocal(articles);
      if (currentArticle?.id !== state.currentArticle?.id) {
        void idbSet(IDB_CURRENT_KEY, currentArticle?.id ?? null);
      }
      return { articles, currentArticle };
    });
    void deleteArticleRemote(id);
  },

  openManager() {
    set({ managerOpen: true });
  },

  closeManager() {
    set({ managerOpen: false });
  },

  async loadFromStorage() {
    const stored = await idbGet<Article[]>(IDB_KEY);
    const currentId = await idbGet<string>(IDB_CURRENT_KEY);
    const userArticles: Article[] = stored ?? [];
    const articles = [SAMPLE, ...userArticles];
    const currentArticle =
      articles.find((a) => a.id === currentId) ?? get().currentArticle ?? SAMPLE;
    set({ articles, currentArticle });
  },

  async syncFromCloud() {
    set({ syncing: true });
    try {
      const remote = await fetchArticles();
      const localArticles = get().articles.filter((a) => a.id !== SAMPLE.id);
      const remoteIds = new Set(remote.map((a) => a.id));

      // 本地有但云端没有的文章 → 推上去
      const toUpload = localArticles.filter((a) => !remoteIds.has(a.id));
      await Promise.all(toUpload.map((a) => uploadArticle(a)));

      // 合并:云端为准,加上本地新推上去的
      const merged: Article[] = [SAMPLE, ...remote, ...toUpload];

      const currentId = get().currentArticle?.id;
      const currentArticle = merged.find((a) => a.id === currentId) ?? merged[0] ?? SAMPLE;

      persistLocal(merged);
      void idbSet(IDB_CURRENT_KEY, currentArticle.id);
      set({ articles: merged, currentArticle, syncing: false });
    } catch (err) {
      console.error("syncFromCloud failed", err);
      set({ syncing: false });
    }
  },
}));
