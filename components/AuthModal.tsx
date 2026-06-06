"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return;

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Auth not configured yet — demo mode.");
        return;
      }
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4 mb-4 bg-bg2 rounded-3xl p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg3 flex items-center justify-center text-muted hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center">
            <span className="font-display font-bold text-xl text-bg">N</span>
          </div>
          <h3 className="font-display text-xl font-bold">Sign in to NOVELA</h3>
          <p className="text-sm text-muted mt-1">
            Magic link — no password needed
          </p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <svg className="w-12 h-12 mx-auto mb-3 text-emerald" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <p className="text-sm text-ink">Check your email for the magic link</p>
            <p className="text-xs text-muted mt-1">{email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-bg3 rounded-xl p-3.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-coral/50 mb-3"
              autoFocus
            />
            {error && (
              <p className="text-xs text-coral mb-3">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-coral to-gold text-bg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
