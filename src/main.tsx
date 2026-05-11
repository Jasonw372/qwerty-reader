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
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) void reg.unregister();
  });
  void caches.keys().then((keys) => {
    for (const key of keys) void caches.delete(key);
  });
}
