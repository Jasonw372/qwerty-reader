import { useState } from "react";
import { LogOut, Cloud, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useArticleStore } from "../../store/articleStore";
import { useTranslation } from "react-i18next";

export function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const syncing = useArticleStore((s) => s.syncing);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const avatar = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  const initial = displayName[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="icon-button flex items-center gap-1.5 rounded-lg px-1.5 py-1 cursor-pointer"
        title={syncing ? t("auth.syncing") : t("auth.syncEnabled")}
        aria-label={displayName}
      >
        {avatar ? (
          <img src={avatar} alt="" className="size-6 rounded-full" />
        ) : (
          <div
            className="grid size-6 place-items-center rounded-full text-[11px] font-medium"
            style={{
              background: "var(--theme-accent-soft)",
              color: "var(--theme-accent)",
            }}
          >
            {initial}
          </div>
        )}
        {syncing ? (
          <Loader2 size={14} className="animate-spin text-[var(--theme-cursor)]" />
        ) : (
          <Cloud size={14} className="text-[var(--theme-text-correct)]" />
        )}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-52 rounded-xl py-1 font-mono">
            <div className="border-b border-[var(--theme-border)] px-3 py-2 text-sm text-[var(--theme-text-pending)]">
              <div className="truncate text-[var(--theme-text-correct)]">{displayName}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--theme-text-muted)]">
                {syncing ? (
                  <>
                    <Loader2 size={10} className="animate-spin text-[var(--theme-cursor)]" />
                    <span>{t("auth.syncing")}</span>
                  </>
                ) : (
                  <>
                    <Cloud size={10} className="text-[var(--theme-text-correct)]" />
                    <span>{t("auth.syncEnabled")}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                void signOut();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--theme-text-pending)] transition-colors hover:bg-[color-mix(in_srgb,var(--theme-accent-soft)_60%,transparent)] hover:text-[var(--theme-text-correct)]"
            >
              <LogOut size={14} />
              {t("auth.signOut")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
