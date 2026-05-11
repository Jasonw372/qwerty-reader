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

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-amber-100 dark:hover:bg-neutral-700 transition-colors"
        title={syncing ? t("auth.syncing") : t("auth.syncEnabled")}
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-300 dark:bg-amber-600 flex items-center justify-center text-xs font-medium">
            {displayName[0].toUpperCase()}
          </div>
        )}
        {syncing ? (
          <Loader2 size={14} className="animate-spin text-amber-500" />
        ) : (
          <Cloud size={14} className="text-emerald-500" />
        )}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-amber-200 dark:border-neutral-700 py-1">
            <div className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 border-b border-amber-100 dark:border-neutral-700">
              <div>{displayName}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                {syncing ? (
                  <>
                    <Loader2 size={10} className="animate-spin text-amber-500" />
                    <span>{t("auth.syncing")}</span>
                  </>
                ) : (
                  <>
                    <Cloud size={10} className="text-emerald-500" />
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
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-amber-50 dark:hover:bg-neutral-700"
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
