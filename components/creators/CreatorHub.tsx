"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import CreatorOnboarding from "./CreatorOnboarding";
import CreatorDashboard from "./CreatorDashboard";
import ContentManager from "./ContentManager";
import DramaEditor from "./DramaEditor";
import EpisodeEditor from "./EpisodeEditor";
import ChannelSettings from "./ChannelSettings";

type CreatorView =
  | "loading"
  | "sign-in-prompt"
  | "onboarding"
  | "dashboard"
  | "content"
  | "new-drama"
  | "edit-drama"
  | "episodes"
  | "settings";

interface ChannelData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  subscriber_count: number;
  is_verified: boolean;
}

interface CreatorHubProps {
  user: { id: string; email?: string } | null;
  onSignIn: () => void;
}

export default function CreatorHub({ user, onSignIn }: CreatorHubProps) {
  const [view, setView] = useState<CreatorView>("loading");
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [editDramaId, setEditDramaId] = useState<string | null>(null);
  const [episodesDramaId, setEpisodesDramaId] = useState<string | null>(null);
  const [episodesDramaTitle, setEpisodesDramaTitle] = useState("");

  const fetchChannel = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/channel");
      if (res.ok) {
        const data = await res.json();
        if (data.channel) {
          setChannel(data.channel);
          return data.channel;
        }
      }
    } catch {
      // Channel not found or API error
    }
    return null;
  }, []);

  useEffect(() => {
    if (!user) {
      setView("sign-in-prompt");
      return;
    }

    // Check if user has a channel (completed onboarding)
    fetchChannel().then((ch) => {
      setView(ch ? "dashboard" : "onboarding");
    });
  }, [user, fetchChannel]);

  const handleOnboardingComplete = useCallback(async () => {
    const ch = await fetchChannel();
    if (ch) setView("dashboard");
  }, [fetchChannel]);

  const handleNavigate = useCallback(
    (target: "content" | "settings" | "new-drama") => {
      setView(target);
    },
    []
  );

  const handleEditDrama = useCallback((dramaId: string) => {
    setEditDramaId(dramaId);
    setView("edit-drama");
  }, []);

  const handleDramaSaved = useCallback(
    (dramaId: string) => {
      setEpisodesDramaId(dramaId);
      // Fetch drama title for episodes view
      fetch(`/api/creator/dramas/${dramaId}`)
        .then((r) => r.json())
        .then((data) => {
          setEpisodesDramaTitle(data.drama?.title || "Drama");
          setView("episodes");
        })
        .catch(() => setView("content"));
    },
    []
  );

  const handleManageEpisodes = useCallback(
    (dramaId: string, dramaTitle: string) => {
      setEpisodesDramaId(dramaId);
      setEpisodesDramaTitle(dramaTitle);
      setView("episodes");
    },
    []
  );

  const handleChannelUpdated = useCallback((updated: ChannelData) => {
    setChannel(updated);
  }, []);

  // Loading state
  if (view === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#6C5CE7]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58"
              />
            </svg>
          </div>
          <p className="text-sm text-[#8b8aa0] font-body">
            Loading Creator Hub...
          </p>
        </div>
      </div>
    );
  }

  // Sign-in prompt
  if (view === "sign-in-prompt") {
    return (
      <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center animate-rise">
            {/* Rocket icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#6C5CE7]/20 to-[#FFAB00]/20 flex items-center justify-center border border-[#6C5CE7]/20">
              <svg
                className="w-10 h-10 text-[#FFAB00]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                />
              </svg>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
              Creator Hub
            </h2>
            <p className="text-sm text-[#8b8aa0] font-body mb-2 leading-relaxed">
              Create, monetize, and grow your vertical micro-dramas on Versa TV.
            </p>
            <p className="text-xs text-[#8b8aa0]/60 font-body mb-8">
              Join 5,000+ creators earning up to 90% revenue share.
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-8 text-left">
              {[
                {
                  icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "80–90% revenue share on all content",
                },
                {
                  icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
                  text: "480K+ monthly active viewers",
                },
                {
                  icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
                  text: "AI-powered production tools",
                },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6C5CE7]/10 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-[#6C5CE7]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={item.icon}
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-[#f0eef5]/80 font-body">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Sign in button */}
            <button
              onClick={onSignIn}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] font-bold font-body text-base tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In to Get Started
            </button>

            <p className="text-[10px] text-[#8b8aa0]/50 font-body mt-4">
              Powered by Filmology Labs — $250M production facility
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding
  if (view === "onboarding" && user) {
    return (
      <CreatorOnboarding user={user} onComplete={handleOnboardingComplete} />
    );
  }

  // Dashboard
  if (view === "dashboard" && user && channel) {
    return (
      <CreatorDashboard
        user={user}
        channel={channel}
        onNavigate={handleNavigate}
      />
    );
  }

  // Content Manager
  if (view === "content" && channel) {
    return (
      <ContentManager
        channelId={channel.id}
        onBack={() => setView("dashboard")}
        onNewDrama={() => setView("new-drama")}
        onEditDrama={handleEditDrama}
        onManageEpisodes={handleManageEpisodes}
      />
    );
  }

  // New Drama
  if (view === "new-drama" && channel) {
    return (
      <DramaEditor
        channelId={channel.id}
        onBack={() => setView("content")}
        onSaved={handleDramaSaved}
      />
    );
  }

  // Edit Drama
  if (view === "edit-drama" && channel && editDramaId) {
    return (
      <DramaEditor
        channelId={channel.id}
        dramaId={editDramaId}
        onBack={() => setView("content")}
        onSaved={handleDramaSaved}
      />
    );
  }

  // Episodes
  if (view === "episodes" && episodesDramaId) {
    return (
      <EpisodeEditor
        dramaId={episodesDramaId}
        dramaTitle={episodesDramaTitle}
        onBack={() => setView("content")}
      />
    );
  }

  // Settings
  if (view === "settings" && user && channel) {
    return (
      <ChannelSettings
        user={user}
        channel={channel}
        onBack={() => setView("dashboard")}
        onChannelUpdated={handleChannelUpdated}
      />
    );
  }

  // Fallback
  return null;
}
