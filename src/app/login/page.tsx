"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/${data.user.role}`);
      } else {
        const err = await res.json();
        setError(err.error || "Invalid credentials");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: "waiter", icon: "🍽️", title: "waiter", subtitle: "Table orders" },
    { id: "counter", icon: "💳", title: "counter", subtitle: "Manage orders" },
    { id: "kitchen", icon: "👨‍🍳", title: "kitchen", subtitle: "Prepare food" },
  ];

  const quickLogin = (role: string) => {
    setUsername(role);
    setPassword("123456");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Background decoration */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#001F3F]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#C0C0C0]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header */}
        <header className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#001F3F] to-[#00336b] rounded-2xl shadow-xl mb-6"
            style={{ boxShadow: "0 10px 40px rgba(0, 31, 63, 0.3)" }}
          >
            <span
              className="text-4xl"
              role="img"
              aria-label="Kitchen Flow logo"
            >
              🍴
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#001F3F] tracking-tight">
            Kitchen Flow
          </h1>
          <p className="text-gray-500 mt-2">Restaurant Management System</p>
        </header>

        {/* Login Card */}
        <main className="card p-8">
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3"
              role="alert"
            >
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner
                    size="sm"
                    className="border-white/30 border-t-white"
                  />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8" role="separator">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Quick Access
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Role Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            role="group"
            aria-label="Quick login options"
          >
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => quickLogin(role.id)}
                className="card card-interactive p-4 text-center hover:border-[#001F3F]/20 focus:border-[#001F3F] transition-all duration-200 group"
                aria-label={`Quick login as ${role.title}`}
              >
                <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-200">
                  {role.icon}
                </div>
                <p className="font-semibold text-gray-800 text-sm">
                  {role.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">123456</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
