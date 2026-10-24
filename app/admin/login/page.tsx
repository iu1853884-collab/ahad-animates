"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiLogin, apiGetMe, apiLogout } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if session already active
  useEffect(() => {
    let isMounted = true;
    apiGetMe()
      .then((user) => {
        if (!isMounted) return;
        if (user.role === "ROLE_ADMIN") {
          router.replace("/admin");
        } else {
          setError("This account does not have administrator access.");
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        // Not authenticated, stay on login page
        if (isMounted) setCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both email address and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiLogin(email.trim(), password);
      if (result.user.role !== "ROLE_ADMIN") {
        await apiLogout();
        setError("This account does not have administrator access.");
        return;
      }
      router.replace("/admin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("fetch failed")
        ) {
          setError("Cannot reach backend server. Please verify the Spring Boot backend is running on port 8080.");
        } else if (err.message.includes("HTTP 401")) {
          setError("Invalid email or password. Please try again.");
        } else if (err.message.includes("HTTP 403")) {
          setError("This account does not have administrator access.");
        } else {
          setError("Sign-in could not be completed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Checking administrative session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070709] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="mb-3 inline-block text-xs tracking-[0.25em] text-zinc-400 transition-colors hover:text-white"
          >
            ← Return to studio
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Ahad Animates <span className="text-purple-400">Admin</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            Secure administrator sign-in
          </p>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div
              id="login-error-alert"
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-start gap-3"
            >
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-xs font-semibold text-zinc-300"
              >
                Admin email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your administrator email"
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-xs font-semibold text-zinc-300"
              >
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-sm"
              />
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign in to dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Protected administrative area. All access attempts are logged and monitored.
              Public registration is disabled.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
