"use client";

import CreatorHub from "./creators/CreatorHub";

interface CreatorsProps {
  user: { id: string; email?: string } | null;
  onSignIn: () => void;
}

export default function Creators({ user, onSignIn }: CreatorsProps) {
  return <CreatorHub user={user} onSignIn={onSignIn} />;
}
