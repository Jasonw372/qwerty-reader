import { useEffect, useMemo, useState } from "react";
import { Mail, Lock, Loader2, BookOpen, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuthStore, type OAuthProvider } from "../../store/authStore";
import { useTranslation } from "react-i18next";

interface AuthGateProps {
  ready: boolean;
}

type Mode = "login" | "signup" | "forgot";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PasswordChecks {
  length: boolean;
  letter: boolean;
  number: boolean;
}

function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    number: /\d/.test(pw),
  };
}

export function AuthGate({ ready }: AuthGateProps) {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithOAuth, resendConfirmation, sendPasswordReset, loading } =
    useAuthStore();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const checks = useMemo(() => checkPassword(password), [password]);
  const emailValid = EMAIL_RE.test(email);
  const passwordStrong = checks.length && checks.letter && checks.number;
  const passwordsMatch = password === confirmPassword;

  const canSubmit =
    mode === "login"
      ? emailValid && password.length > 0 && !loading
      : mode === "forgot"
        ? emailValid && !loading
        : emailValid && passwordStrong && passwordsMatch && !loading;

  if (!ready) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "var(--theme-bg)" }}
      >
        <Loader2 size={24} className="animate-spin text-[var(--theme-text-muted)]" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "login") {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
      return;
    }

    if (mode === "forgot") {
      if (!emailValid) {
        setError(t("auth.errInvalidEmail"));
        return;
      }
      const { error: err } = await sendPasswordReset(email);
      if (err) {
        setError(err);
        return;
      }
      setNotice(t("auth.resetEmailSent", { email }));
      setResendCooldown(60);
      return;
    }

    if (!emailValid) {
      setError(t("auth.errInvalidEmail"));
      return;
    }
    if (!passwordStrong) {
      setError(t("auth.errWeakPassword"));
      return;
    }
    if (!passwordsMatch) {
      setError(t("auth.errPasswordMismatch"));
      return;
    }

    const { error: err, needsConfirmation, alreadyRegistered } = await signUp(email, password);
    if (err) {
      setError(err);
      return;
    }
    if (alreadyRegistered) {
      setError(t("auth.errEmailAlreadyRegistered"));
      return;
    }
    if (needsConfirmation) {
      setPendingEmail(email);
      setNotice(t("auth.confirmEmailSent", { email }));
      setResendCooldown(60);
      setPassword("");
      setConfirmPassword("");
    }
  }

  async function handleResend() {
    if (!pendingEmail || resendCooldown > 0) return;
    setError(null);
    const { error: err } = await resendConfirmation(pendingEmail);
    if (err) {
      setError(err);
      return;
    }
    setNotice(t("auth.confirmEmailResent"));
    setResendCooldown(60);
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setNotice(null);
    const { error: err } = await signInWithOAuth(provider);
    if (err) setError(err);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setPendingEmail(null);
    setResendCooldown(0);
    setPassword("");
    setConfirmPassword("");
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
              Qwerty Reader
            </h1>
            <p className="text-xs text-[var(--theme-text-muted)]">{t("auth.gateSubtitle")}</p>
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          <TabButton active={mode === "login"} onClick={() => switchMode("login")}>
            {t("auth.signIn")}
          </TabButton>
          <TabButton active={mode === "signup"} onClick={() => switchMode("signup")}>
            {t("auth.signUp")}
          </TabButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <Field
            icon={<Mail size={16} />}
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={setEmail}
            label={t("auth.email")}
            invalid={(mode === "signup" || mode === "forgot") && email.length > 0 && !emailValid}
            invalidHint={t("auth.errInvalidEmail")}
          />

          {mode !== "forgot" && (
            <Field
              icon={<Lock size={16} />}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              label={t("auth.password")}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-correct)]"
                  aria-label={t("auth.togglePasswordVisibility")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs text-[var(--theme-text-muted)] underline hover:text-[var(--theme-text-correct)]"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          )}
          {mode === "signup" && password.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-2 text-xs">
              <Rule ok={checks.length} label={t("auth.ruleLength")} />
              <Rule ok={checks.letter} label={t("auth.ruleLetter")} />
              <Rule ok={checks.number} label={t("auth.ruleNumber")} />
            </ul>
          )}

          {mode === "signup" && (
            <Field
              icon={<Lock size={16} />}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              label={t("auth.confirmPassword")}
              invalid={confirmPassword.length > 0 && !passwordsMatch}
              invalidHint={t("auth.errPasswordMismatch")}
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {notice && <p className="text-sm text-emerald-500">{notice}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--theme-accent)] py-2 font-medium text-[var(--theme-bg)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login"
              ? t("auth.signIn")
              : mode === "signup"
                ? t("auth.signUp")
                : t("auth.sendResetLink")}
          </button>
        </form>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-3 w-full text-center text-xs text-[var(--theme-text-muted)] underline hover:text-[var(--theme-text-correct)]"
          >
            {t("auth.backToSignIn")}
          </button>
        )}

        {mode === "signup" && pendingEmail && (
          <div className="mt-3 space-y-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3 text-xs text-[var(--theme-text-muted)]">
            <p>{t("auth.checkInboxHint", { email: pendingEmail })}</p>
            <p className="text-[var(--theme-text-pending)]">{t("auth.checkSpamHint")}</p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="text-[var(--theme-accent)] underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
              >
                {resendCooldown > 0
                  ? t("auth.resendCooldown", { seconds: resendCooldown })
                  : t("auth.resendConfirmation")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-[var(--theme-text-muted)] underline hover:text-[var(--theme-text-correct)]"
              >
                {t("auth.alreadyConfirmed")}
              </button>
            </div>
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">
          <span className="h-px flex-1 bg-[var(--theme-border)]" />
          {t("auth.orContinueWith")}
          <span className="h-px flex-1 bg-[var(--theme-border)]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <OAuthButton
            disabled={loading}
            onClick={() => void handleOAuth("github")}
            label="GitHub"
            icon={<GithubIcon />}
          />
          <OAuthButton
            disabled={loading}
            onClick={() => void handleOAuth("google")}
            label="Google"
            icon={<GoogleIcon />}
          />
        </div>

        <p className="mt-5 text-center text-xs text-[var(--theme-text-muted)]">
          {t("auth.emailOnlyHint")}
        </p>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-lg py-2 text-sm transition-colors " +
        (active
          ? "bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]"
          : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]/40")
      }
    >
      {children}
    </button>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  trailing?: React.ReactNode;
  invalid?: boolean;
  invalidHint?: string;
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  label,
  trailing,
  invalid,
  invalidHint,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--theme-text-muted)]">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={
            "w-full rounded-lg border bg-[var(--theme-bg)] py-2 pl-9 pr-9 text-sm text-[var(--theme-text-correct)] focus:outline-none " +
            (invalid
              ? "border-red-500/70 focus:border-red-500"
              : "border-[var(--theme-border)] focus:border-[var(--theme-accent)]")
          }
        />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {invalid && invalidHint && <p className="mt-1 text-xs text-red-500">{invalidHint}</p>}
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

interface OAuthButtonProps {
  disabled?: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function OAuthButton({ disabled, onClick, label, icon }: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text-correct)] transition-colors hover:bg-[var(--theme-border)]/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.3-5.25-1.28-5.25-5.7 0-1.26.45-2.3 1.2-3.1-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.5 3.18-1.18 3.18-1.18.63 1.6.23 2.78.11 3.08.75.8 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3C40.9 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
    </svg>
  );
}
