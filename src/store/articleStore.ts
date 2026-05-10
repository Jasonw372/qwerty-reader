import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { Article } from "../types/index.ts";

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
  setCurrentArticle: (article: Article) => void;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  openManager: () => void;
  closeManager: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [SAMPLE],
  currentArticle: SAMPLE,
  managerOpen: false,

  setCurrentArticle(article) {
    set({ currentArticle: article });
    void idbSet(IDB_CURRENT_KEY, article.id);
  },

  addArticle(article) {
    set((state) => {
      const articles = [...state.articles, article];
      void idbSet(
        IDB_KEY,
        articles.filter((a) => a.id !== "sample-1"),
      );
      return { articles };
    });
  },

  removeArticle(id) {
    if (id === "sample-1") return;
    set((state) => {
      const articles = state.articles.filter((a) => a.id !== id);
      const currentArticle =
        state.currentArticle?.id === id ? (articles[0] ?? null) : state.currentArticle;
      void idbDel(id);
      void idbSet(
        IDB_KEY,
        articles.filter((a) => a.id !== "sample-1"),
      );
      if (currentArticle?.id !== state.currentArticle?.id) {
        void idbSet(IDB_CURRENT_KEY, currentArticle?.id ?? null);
      }
      return { articles, currentArticle };
    });
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
}));
