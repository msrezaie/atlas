"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "../supabase/client";

// In-match live sync for a real 1v1: a single Supabase Realtime *broadcast*
// channel, `match:<matchId>`, shared by both players. Two message types travel
// over it:
//
//   guess   — a player's one guess for a round: { round, playerId, correct,
//             elapsedMs }. Both clients send theirs; the host consumes them.
//   resolve — the round's outcome as decided by the host: { round, winnerId }
//             (the winning player's id, or null for a draw). The host sends it;
//             the non-host applies it.
//
// The host (matches.player_a) is the single authority that resolves each round,
// so the two clients can never disagree about who won a close race. See
// FindCountryScreen for how these are wired to gameplay.

export interface GuessMsg {
  round: number;
  playerId: string;
  correct: boolean;
  elapsedMs: number;
}

export interface ResolveMsg {
  round: number;
  winnerId: string | null;
}

export interface MatchChannel {
  sendGuess: (m: GuessMsg) => void;
  sendResolve: (m: ResolveMsg) => void;
}

/**
 * Join the match's broadcast channel and wire up guess/resolve messaging.
 * Inert unless `enabled` (i.e. a real human match, not solo or a bot). The
 * handlers are read through a ref so updating them never re-subscribes.
 */
export function useMatchChannel(
  matchId: string | null,
  enabled: boolean,
  onGuess: (m: GuessMsg) => void,
  onResolve: (m: ResolveMsg) => void,
): MatchChannel {
  const supabase = getSupabaseBrowserClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Latest handlers, so the subscribe effect can stay keyed only on the match.
  const handlers = useRef({ onGuess, onResolve });
  handlers.current = { onGuess, onResolve };

  useEffect(() => {
    if (!enabled || !matchId) return;
    const channel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "guess" }, ({ payload }) =>
        handlers.current.onGuess(payload as GuessMsg),
      )
      .on("broadcast", { event: "resolve" }, ({ payload }) =>
        handlers.current.onResolve(payload as ResolveMsg),
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [supabase, matchId, enabled]);

  const send = (event: "guess" | "resolve", payload: GuessMsg | ResolveMsg) => {
    if (!channelRef.current) return;
    void channelRef.current.send({ type: "broadcast", event, payload });
  };

  return {
    sendGuess: (m) => send("guess", m),
    sendResolve: (m) => send("resolve", m),
  };
}
