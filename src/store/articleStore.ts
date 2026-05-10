import { create } from "zustand";
import type { Article } from "../types/index.ts";

const SAMPLE: Article = {
  id: "sample-1",
  title: "The Future of Web Development",
  source: "Sample",
  content: `The rapid development of modern web frameworks has fundamentally changed how we approach building applications. React, Vue, and Svelte each offer distinct paradigms for managing state and rendering UI components efficiently.

Server-side rendering has made a significant comeback with frameworks like Next.js and Nuxt, enabling developers to deliver faster initial page loads while maintaining the interactivity of single-page applications. This hybrid approach represents a maturation of the ecosystem.

TypeScript adoption has grown dramatically across the industry, bringing static type checking to JavaScript projects of all sizes. The tooling improvements, from language servers to build tools, have made the development experience considerably more productive and reliable.`,
};

interface ArticleState {
  articles: Article[];
  currentArticle: Article | null;
  setCurrentArticle: (article: Article) => void;
  addArticle: (article: Article) => void;
}

export const useArticleStore = create<ArticleState>((set) => ({
  articles: [SAMPLE],
  currentArticle: SAMPLE,

  setCurrentArticle(article) {
    set({ currentArticle: article });
  },

  addArticle(article) {
    set((state) => ({ articles: [...state.articles, article] }));
  },
}));
