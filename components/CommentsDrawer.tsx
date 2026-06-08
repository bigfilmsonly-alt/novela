"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
}

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  episodeTitle: string;
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: "c1",
    user: "maya_watches",
    avatar: "M",
    text: "The cliffhanger at the end had me SCREAMING. Need episode 3 NOW.",
    time: "2h",
    likes: 342,
    liked: false,
  },
  {
    id: "c2",
    user: "dramaking99",
    avatar: "D",
    text: "This is better than most Netflix shows tbh. The pacing is insane for 90 seconds.",
    time: "4h",
    likes: 891,
    liked: false,
  },
  {
    id: "c3",
    user: "film.sarah",
    avatar: "S",
    text: "The cinematography in this episode is on another level. Who directed this??",
    time: "6h",
    likes: 167,
    liked: false,
  },
  {
    id: "c4",
    user: "binge.queen",
    avatar: "B",
    text: "I've watched this 4 times already. The foreshadowing is chef's kiss.",
    time: "8h",
    likes: 523,
    liked: false,
  },
  {
    id: "c5",
    user: "vertical_addict",
    avatar: "V",
    text: "Finally a platform that gets vertical storytelling right. Every second counts.",
    time: "12h",
    likes: 234,
    liked: false,
  },
  {
    id: "c6",
    user: "alex.creates",
    avatar: "A",
    text: "As a filmmaker, this inspires me to create for Versa TV. The creator tools look amazing.",
    time: "1d",
    likes: 89,
    liked: false,
  },
  {
    id: "c7",
    user: "night.owl.tv",
    avatar: "N",
    text: "Started watching at midnight, now it's 3am and I can't stop swiping. Send help.",
    time: "1d",
    likes: 712,
    liked: false,
  },
  {
    id: "c8",
    user: "plot_twist_pro",
    avatar: "P",
    text: "Called the twist in episode 1 but episode 2 completely blindsided me. Well played.",
    time: "2d",
    likes: 156,
    liked: false,
  },
];

const AVATAR_COLORS = [
  "from-[#6C5CE7] to-[#a855f7]",
  "from-[#FFAB00] to-[#ff6b35]",
  "from-[#00D2FF] to-[#3b82f6]",
  "from-[#f43f5e] to-[#ec4899]",
  "from-[#10b981] to-[#14b8a6]",
  "from-[#8b5cf6] to-[#6366f1]",
  "from-[#f59e0b] to-[#d97706]",
  "from-[#06b6d4] to-[#0891b2]",
];

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function CommentsDrawer({
  isOpen,
  onClose,
  episodeTitle,
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const toggleLike = useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  }, []);

  const addComment = useCallback(() => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `user-${Date.now()}`,
      user: "you",
      avatar: "Y",
      text: newComment.trim(),
      time: "now",
      likes: 0,
      liked: false,
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment("");
  }, [newComment]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-md bg-[#0d0d18] rounded-t-3xl overflow-hidden animate-[slide-up_0.3s_ease-out]"
        style={{ maxHeight: "70%" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[#f0eef5]">
                Comments
              </h3>
              <p className="text-[11px] text-[#8b8aa0] font-body truncate max-w-[240px]">
                {episodeTitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8b8aa0] font-body tabular-nums">
                {comments.length}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-[#8b8aa0]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="overflow-y-auto no-scrollbar px-5 py-3 space-y-4" style={{ maxHeight: "calc(70vh - 140px)" }}>
          {comments.map((comment, i) => (
            <div key={comment.id} className="flex gap-3 animate-[fade-in_0.2s_ease-out]" style={{ animationDelay: `${i * 0.03}s` }}>
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-[10px] font-bold text-white">
                  {comment.avatar}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-[#f0eef5] font-body">
                    {comment.user}
                  </span>
                  <span className="text-[10px] text-[#8b8aa0]/60 font-body">
                    {comment.time}
                  </span>
                </div>
                <p className="text-[13px] text-[#f0eef5]/80 leading-relaxed font-body">
                  {comment.text}
                </p>

                {/* Like + Reply */}
                <div className="flex items-center gap-4 mt-1.5">
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className="flex items-center gap-1 group"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-all ${
                        comment.liked ? "text-[#6C5CE7] scale-110" : "text-[#8b8aa0]/50"
                      }`}
                      fill={comment.liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className={`text-[11px] tabular-nums ${comment.liked ? "text-[#6C5CE7]" : "text-[#8b8aa0]/50"}`}>
                      {formatCount(comment.likes)}
                    </span>
                  </button>
                  <button className="text-[11px] text-[#8b8aa0]/50 font-body font-medium">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] px-4 py-3 bg-[#0a0a14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">Y</span>
            </div>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="w-full bg-white/6 rounded-full px-4 py-2.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/40 border border-white/[0.06]"
              />
            </div>
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="w-9 h-9 rounded-full bg-[#6C5CE7] flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
