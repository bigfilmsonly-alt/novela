"use client";

import { useState, useEffect, useCallback } from "react";
import type { TabId } from "@/lib/types";
import Feed from "@/components/Feed";
import AIHost from "@/components/AIHost";
import Studio from "@/components/Studio";
import Channels from "@/components/Channels";
import AuthModal from "@/components/AuthModal";
import { createClient } from "@/lib/supabase/client";

const TABS: { id: TabId; label: string; icon: string }[] = [
  {
    id: "feed",
    label: "Feed",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
  },
  {
    id: "host",
    label: "AI Host",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  },
  {
    id: "studio",
    label: "Studio",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
  {
    id: "channels",
    label: "Channels",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

/* ---- User avatar / sign-in shared component ---- */
function UserControl({
  user,
  variant,
  onSignIn,
}: {
  user: { id: string; email?: string } | null;
  variant: "feed" | "default";
  onSignIn: () => void;
}) {
  if (user) {
    const initial = user.email?.charAt(0).toUpperCase() || "U";
    return (
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tracking-wide select-none transition-transform active:scale-90 ${
          variant === "feed"
            ? "bg-white/12 backdrop-blur-md text-ink ring-1 ring-white/10"
            : "bg-coral/15 text-coral ring-1 ring-coral/20"
        }`}
      >
        {initial}
      </div>
    );
  }

  return (
    <button
      onClick={onSignIn}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 gradient-border ${
        variant === "feed"
          ? "bg-white/8 backdrop-blur-md text-ink"
          : "bg-bg2 text-coral"
      }`}
    >
      Sign in
    </button>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [tabKey, setTabKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? undefined }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchTab = useCallback(
    (id: TabId) => {
      if (id !== activeTab) {
        setActiveTab(id);
        setTabKey((k) => k + 1);
      }
    },
    [activeTab]
  );

  /* Determine which content to render */
  const renderTabContent = () => {
    switch (activeTab) {
      case "feed":
        return <Feed />;
      case "host":
        return <AIHost />;
      case "studio":
        return <Studio />;
      case "channels":
        return <Channels />;
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-bg relative overflow-hidden">
      {/* ---- Feed top bar (glassmorphism overlay) ---- */}
      {activeTab === "feed" && (
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-8 bg-black/40 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-xl font-bold tracking-tight">
                <span className="text-coral">N</span>
                <span className="text-white">OVELA</span>
              </h1>
              {/* LIVE indicator */}
              <div className="flex items-center gap-1.5 pl-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-coral animate-live-pulse" />
                </span>
                <span className="text-[9px] font-bold tracking-widest text-coral/80 uppercase">
                  Live
                </span>
              </div>
            </div>
            <UserControl user={user} variant="feed" onSignIn={() => setShowAuth(true)} />
          </div>
        </div>
      )}

      {/* ---- Non-feed top bar ---- */}
      {activeTab !== "feed" && (
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-2 glass border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold tracking-tight">
              <span className="text-coral">N</span>
              <span className="text-ink">OVELA</span>
            </h1>
            <UserControl user={user} variant="default" onSignIn={() => setShowAuth(true)} />
          </div>
        </div>
      )}

      {/* ---- Tab content with fade transition ---- */}
      <main className="flex-1 overflow-hidden">
        <div key={tabKey} className="h-full tab-enter">
          {renderTabContent()}
        </div>
      </main>

      {/* ---- Bottom nav (glassmorphism) ---- */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 glass border-t border-white/[0.06]">
        <div className="flex items-center justify-around h-[68px] max-w-md mx-auto px-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 active:scale-90 ${
                  isActive ? "text-coral" : "text-muted hover:text-ink"
                }`}
              >
                <svg
                  className="w-6 h-6 transition-transform duration-200"
                  fill={tab.id === "host" && isActive ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={tab.icon}
                  />
                </svg>
                <span className="text-[11px] font-semibold leading-none">
                  {tab.label}
                </span>
                {/* Active dot indicator */}
                <span
                  className={`h-1 w-1 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-coral scale-100 opacity-100"
                      : "bg-transparent scale-0 opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
        {/* Safe area spacer */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* ---- Auth modal ---- */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
