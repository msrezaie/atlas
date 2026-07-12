"use client";

import { useEffect, useRef, useState } from "react";
import {
  MATCH_SEARCH_MIN_MS,
  MATCH_SEARCH_MAX_MS,
} from "@atlas/game-logic/matchmaking";
import { getSupabaseBrowserClient } from "../supabase/client";
import { useAuth } from "../auth/AuthProvider";
import type { GameMode } from "../gameMode";
import type { MatchInfo } from "./types";

const BOT_NAMES = ["Mia", "Kenji", "Sofia", "Diego", "Amara", "Liam", "Noor", "Yuki"];

interface MatchRow {
  id: string;
  player_a: string;
  player_b: string | null;
  seed: number | string;
}

/**
 * Enter matchmaking for `mode`: atomically pair with a waiting player (via the
 * find_match RPC), listen for the pairing over realtime, and fall back to a bot
 * if no human is found within the search window. Resolves to a MatchInfo once.
 */
export function useMatchmaking(mode: GameMode): MatchInfo | null {
  const supabase = getSupabaseBrowserClient();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    doneRef.current = false;
    const uid = user.id;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Assigned after the closures that read them (via stopTimers) are defined,
    // so they have to be `let`.
    // eslint-disable-next-line prefer-const
    let botTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    // The in-flight find_match, if any (a real Promise wrapping the Supabase
    // thenable). leaveQueue awaits it so we never delete our row *before* a
    // still-running enqueue re-creates it. `pollSeq` tags each poll so only the
    // latest clears the ref.
    let pollInFlight: Promise<unknown> | null = null;
    let pollSeq = 0;

    const stopTimers = () => {
      clearTimeout(botTimer);
      clearInterval(pollTimer);
    };

    const cleanupChannel = () => {
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };

    // Leave the queue for good. A find_match on the heartbeat may still be
    // running (and about to re-enqueue us), so wait for it before deleting —
    // otherwise the row it re-creates lingers as a "ghost" that the next
    // searcher matches, even though we've paired, gone to a bot, or cancelled.
    const leaveQueue = async () => {
      try {
        await pollInFlight;
      } catch {
        /* ignore — we're leaving regardless */
      }
      await supabase.rpc("leave_queue");
    };

    async function resolveWithRow(row: MatchRow) {
      if (doneRef.current) return;
      doneRef.current = true;
      stopTimers();
      // We're paired — drop out of the queue now (a late heartbeat may have
      // re-enqueued us between pairing and this), not on unmount after the
      // reveal, so we can't be matched a second time as a ghost meanwhile.
      void leaveQueue();
      const amHost = row.player_a === uid;
      const oppId = amHost ? row.player_b : row.player_a;
      let oppName = "Opponent";
      if (oppId) {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", oppId)
          .single();
        if (data?.username) oppName = data.username as string;
      }
      cleanupChannel();
      setMatch({
        matchId: row.id,
        isBot: false,
        opponentName: oppName,
        opponentId: oppId,
        seed: row.seed,
        amHost,
      });
    }

    function fallbackToBot() {
      if (doneRef.current) return;
      doneRef.current = true;
      stopTimers();
      void leaveQueue();
      cleanupChannel();
      setMatch({
        matchId: "bot",
        isBot: true,
        opponentName: BOT_NAMES[(Math.random() * BOT_NAMES.length) | 0]!,
        opponentId: null,
        seed: (Math.random() * 4294967296) >>> 0,
        amHost: true,
      });
    }

    // One find_match attempt: pair with a waiting player if there is one, else
    // (re)enqueue us. Called on subscribe and then on a heartbeat, so our queue
    // row's timestamp keeps refreshing — a client that stops polling (closed
    // tab, cancelled search) goes stale within the freshness window and stops
    // being matchable, while two live searchers still find each other.
    async function poll() {
      if (doneRef.current) return;
      const seq = ++pollSeq;
      const p = supabase.rpc("find_match", { p_mode: mode });
      pollInFlight = Promise.resolve(p);
      const { data, error } = await p;
      if (pollSeq === seq) pollInFlight = null;
      if (doneRef.current) return;
      if (error) {
        // Don't instantly drop to a bot — stay in the queue window; the bot
        // timer handles the fallback so the search still lasts its 5–9s.
        console.warn("find_match failed:", error.message);
        return;
      }
      // We created the match (player_b) → a real row is returned. Enqueued →
      // null. PostgREST may hand back the row as an object OR a 1-element
      // array, so normalise and only treat it as a match when it has an id;
      // otherwise wait for the INSERT (someone pairs with us) or the bot.
      const row = (Array.isArray(data) ? data[0] : data) as
        | MatchRow
        | null
        | undefined;
      if (row && row.id) void resolveWithRow(row);
    }

    // Subscribe *before* calling find_match so we can't miss the INSERT that
    // pairs us while we're waiting.
    channel = supabase
      .channel(`mm-${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        (payload) => {
          const row = payload.new as MatchRow;
          if (row.player_a === uid || row.player_b === uid) void resolveWithRow(row);
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        void poll();
        // Heartbeat: keep our queue row fresh and re-check for a live opponent
        // until we resolve (match, bot, or unmount).
        pollTimer = setInterval(() => void poll(), 2000);
      });

    // Guard against a bad import yielding NaN (which would fire the timer at 0).
    const min = MATCH_SEARCH_MIN_MS || 5000;
    const max = MATCH_SEARCH_MAX_MS || 9000;
    const searchMs = min + Math.random() * Math.max(0, max - min);
    botTimer = setTimeout(fallbackToBot, searchMs);

    return () => {
      doneRef.current = true;
      stopTimers();
      void leaveQueue(); // stop searching if we bail mid-search (awaits in-flight)
      cleanupChannel();
    };
  }, [user, mode, supabase]);

  return match;
}
