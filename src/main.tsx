import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./i18n/index.ts";
import { App } from "./App.tsx";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
