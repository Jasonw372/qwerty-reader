import { useEffect, useMemo, useState } from "react";
import { Lock, Loader2, BookOpen, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    number: /\d/.test(pw),
  };
}

export function ResetPasswordGate() {
  const { t } = useTranslation();
  const { updatePassword, signOut, loading, user } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checks = useMemo(() => checkPassword(password), [password]);
  const strong = checks.length && checks.letter && checks.number;
  const match = password === confirm;
  const canSubmit = strong && match && !loading;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("recovery")) {
      url.searchParams.delete("recovery");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!strong) {
      setError(t("auth.errWeakPassword"));
      return;
    }
    if (!match) {
      setError(t("auth.errPasswordMismatch"));
      return;
    }
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(true);
  }

  return (
    <div
      className="flex h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--theme-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--theme-border)] p-6 shadow-xl"
        style={{ backgroundColor: "var(--theme-surface-elevated)" }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--theme-text-correct)]">
              {t("auth.resetPasswordTitle")}
            </h1>
            <p className="text-xs text-[var(--theme-text-muted)]">
              {user?.email ?? t("auth.resetPasswordSubtitle")}
            </p>
          </div>
        </div>

        {success ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-500">
              {t("auth.resetSuccess")}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-lg bg-[var(--theme-accent)] py-2 font-medium text-[var(--theme-bg)] transition-colors hover:opacity-90"
            >
              {t("auth.signInAgain")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label className="mb-1 block text-xs text-[var(--theme-text-muted)]">
                {t("auth.newPassword")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] py-2 pl-9 pr-9 text-sm text-[var(--theme-text-correct)] focus:border-[var(--theme-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-correct)]"
                  aria-label={t("auth.togglePasswordVisibility")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <ul className="space-y-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-2 text-xs">
                <Rule ok={checks.length} label={t("auth.ruleLength")} />
                <Rule ok={checks.letter} label={t("auth.ruleLetter")} />
                <Rule ok={checks.number} label={t("auth.ruleNumber")} />
              </ul>
            )}

            <div>
              <label className="mb-1 block text-xs text-[var(--theme-text-muted)]">
                {t("auth.confirmPassword")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={
                    "w-full rounded-lg border bg-[var(--theme-bg)] py-2 pl-9 pr-3 text-sm text-[var(--theme-text-correct)] focus:outline-none " +
                    (confirm.length > 0 && !match
                      ? "border-red-500/70 focus:border-red-500"
                      : "border-[var(--theme-border)] focus:border-[var(--theme-accent)]")
                  }
                />
              </div>
              {confirm.length > 0 && !match && (
                <p className="mt-1 text-xs text-red-500">{t("auth.errPasswordMismatch")}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-accent)] py-2 font-medium text-[var(--theme-bg)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t("auth.updatePassword")}
            </button>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-2 w-full text-center text-xs text-[var(--theme-text-muted)] underline hover:text-[var(--theme-text-correct)]"
            >
              {t("auth.cancel")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={
        "flex items-center gap-2 " + (ok ? "text-emerald-500" : "text-[var(--theme-text-muted)]")
      }
    >
      {ok ? <Check size={12} /> : <X size={12} />}
      <span>{label}</span>
    </li>
  );
}
