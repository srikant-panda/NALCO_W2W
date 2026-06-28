import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Factory, Lock, Mail, ShieldCheck } from "lucide-react";
import { apiUrl, loginAuthSession, type AuthSession } from "../lib/api";

export interface AuthUser extends AuthSession {}

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") return body.error;
    if (typeof body?.message === "string") return body.message;
    if (typeof body?.detail?.error === "string") return body.detail.error;
    if (typeof body?.detail?.message === "string") return body.detail.message;
  } catch {
    // Ignore non-JSON error bodies and fall back to status-specific messaging.
  }
  return "";
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("admin@nalco.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authDisabled, setAuthDisabled] = useState(false);
  const [authConfigLoaded, setAuthConfigLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadAuthConfig = async () => {
      try {
        const response = await fetch(apiUrl("/auth/config"), { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) {
          setAuthDisabled(Boolean(data.authDisabled));
        }
      } catch {
        // Keep password sign-in as the default if the config endpoint is not reachable.
      } finally {
        if (active) {
          setAuthConfigLoaded(true);
        }
      }
    };

    void loadAuthConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authDisabled) {
        const response = await fetch(apiUrl("/auth/me"), { credentials: "include" });
        if (!response.ok) {
          const apiMessage = await readErrorMessage(response);
          throw new Error(apiMessage || `Sign-in failed with status ${response.status}`);
        }
        const data = await response.json() as { user: AuthUser };
        onLogin({
          id: data.user?.id || "api-session",
          email: data.user?.email || email,
          name: data.user?.name || "NALCO Admin",
          role: data.user?.role || "NALCO_ADMIN",
          companyId: data.user?.companyId,
        });
        return;
      }

      onLogin(await loginAuthSession(email, password));
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Authentication failed.";
      setError(message === "INVALID_CREDENTIALS" ? "Invalid email or password." : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
        <section className="relative hidden overflow-hidden bg-slate-900 lg:block">
          <img
            src="https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1800&q=80"
            alt="Industrial processing plant"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black">
                W2W
              </div>
              <div>
                <div className="text-sm font-bold tracking-wide">NALCO</div>
                <div className="text-[10px] tracking-[0.18em] text-emerald-200">WASTE-TO-WEALTH</div>
              </div>
            </div>

            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur">
                <ShieldCheck size={14} />
                Operations Console
              </div>
              <h1 className="max-w-xl text-5xl font-black leading-tight tracking-normal">
                Circular economy marketplace for NALCO residue streams
              </h1>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["42.5K", "Red mud MT"],
                  ["8", "Verified buyers"],
                  ["3.7K", "tCO2e tracked"],
                ].map(([value, label]) => (
                  <div key={label} className="border-l border-emerald-300/40 pl-4">
                    <div className="text-2xl font-black">{value}</div>
                    <div className="mt-1 text-xs text-slate-300">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-300">Damanjodi Plant, Koraput, Odisha</div>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">
                W2W
              </div>
              <h1 className="text-2xl font-black text-slate-900">NALCO Waste-to-Wealth</h1>
            </div>

            <div className="mb-7">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Factory size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to the operations console.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </span>
                <div className="relative">
                  <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </span>
                <div className="relative">
                  <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={authDisabled}
                    placeholder={authDisabled ? "Disabled for local temporary account" : "Enter password"}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    required={!authDisabled}
                  />
                </div>
              </label>

              {authConfigLoaded && authDisabled && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Local temporary account is active. Password sign-in is disabled for this development session.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
