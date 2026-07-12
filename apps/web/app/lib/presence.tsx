"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getSupabaseBrowserClient } from "./supabase/client";
import { useAuth } from "./auth/AuthProvider";

// App-wide "who's online" via a single Supabase Realtime presence channel. Only
// signed-in users join and are counted (signed-out visitors aren't tracked). The
// channel's presence state, keyed by user id, gives the live online count that
// the 1v1 hub and matchmaking screen show. One channel for the whole app, read
// through context, so we never open more than one connection.

interface PresenceValue {
  /** Distinct signed-in players currently online (includes you). 0 when signed
   *  out or not yet connected. */
  onlineCount: number;
}

const PresenceContext = createContext<PresenceValue>({ onlineCount: 0 });

export function PresenceProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const { user, profile } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);

  const username = profile?.username ?? "Player";

  useEffect(() => {
    // Only signed-in users are tracked and counted.
    if (!user) {
      setOnlineCount(0);
      return;
    }
    const channel = supabase.channel("online", {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ username, at: Date.now() });
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, user, username]);

  return (
    <PresenceContext.Provider value={{ onlineCount }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function useOnlineCount(): number {
  return useContext(PresenceContext).onlineCount;
}
