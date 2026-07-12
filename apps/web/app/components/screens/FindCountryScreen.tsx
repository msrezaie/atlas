"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  XCircle,
  Radar,
  Swords,
} from "lucide-react";
import type { Country, MapState, Region } from "@atlas/types";
import { TIME_LIMIT, pointsForTime } from "@atlas/game-logic/config";
import { shuffle, filterRegion } from "@atlas/game-logic/utils";
import { seededShuffle } from "@atlas/game-logic/seed";
import { ScoreBar } from "../ui/game/ScoreBar";
import { VersusBar } from "../ui/game/VersusBar";
import { TimerRing } from "../ui/game/TimerRing";
import { Flag } from "../ui/display/Flag";
import { FeedbackBar } from "../ui/game/FeedbackBar";
import { WorldMapGame } from "../find-country/WorldMapGame";
import type { PlayMode } from "../../lib/gameMode";
import { useAuth } from "../../lib/auth/AuthProvider";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { useMatchChannel } from "../../lib/match/useMatchChannel";

/** The live-match context for a real 1v1 (absent for solo and bot games). */
export interface FindMatchContext {
  matchId: string;
  seed: number | string;
  amHost: boolean;
  opponentId: string | null;
  isBot: boolean;
}

export interface FindCountryResult {
  mode: "find";
  play: PlayMode;
  score: number;
  oppScore: number;
  longestStreak: number;
  correct: number;
  total: number;
  opponentName: string;
  /** Wall-clock time of the whole run in ms (from first question to finish). */
  durationMs?: number;
}

export interface FindCountryScreenProps {
  play: PlayMode;
  region: Region;
  roundLen: number;
  opponentName: string;
  /** Live-match context for a real 1v1. Null for solo; also null-ish (isBot) for
   *  a bot fallback, which keeps the simulated opponent path. */
  match?: FindMatchContext | null;
  onFinish: (result: FindCountryResult) => void;
  onHome: () => void;
}

// A player's guess outcome within a 1v1 round.
type GuessResult = "none" | "correct" | "wrong";

/**
 * Locate the prompted country on the shared map. Handles both solo (speed
 * scoring) and 1v1 versus (first correct answer wins the round).
 */
export function FindCountryScreen({
  play,
  region,
  roundLen,
  opponentName,
  match,
  onFinish,
  onHome,
}: FindCountryScreenProps) {
  const versus = play === "versus";
  const { user } = useAuth();
  const myUid = user?.id ?? null;
  const oppUid = match?.opponentId ?? null;
  // A real human match syncs over realtime; a bot match (or a missing/absent
  // opponent id) keeps the simulated-opponent path below.
  const realVersus =
    versus && !!match && !match.isBot && !!match.opponentId && !!myUid;
  const botVersus = versus && !realVersus;
  const amHost = realVersus && !!match?.amHost;

  // Real matches seed the question order off the shared match seed, so both
  // players get an identical sequence; everything else is a fresh shuffle.
  const [questions] = useState<Country[]>(() => {
    const pool = filterRegion(region);
    if (versus && match && match.seed != null) {
      return seededShuffle(pool, match.seed).slice(0, roundLen);
    }
    return shuffle(pool).slice(0, roundLen);
  });
  // Every country in the region is clickable, not just the ones that ended
  // up in this round's question sample — the round length only controls how
  // many prompts get asked, not what's selectable on the map.
  const quizPool = useMemo(
    () => new Set(filterRegion(region).map((c) => c.iso2)),
    [region],
  );
  const [qi, setQi] = useState(0);
  // The countdown (and the 1v1 opponent) only start once the map has actually
  // loaded — otherwise the clock ticks against a blank map the player can't
  // click yet.
  const [mapReady, setMapReady] = useState(false);
  const [states, setStates] = useState<Record<string, MapState>>({});
  const [answered, setAnswered] = useState(false);
  // 1v1: locks the map after your single guess (until the round resolves), so
  // the board reads as "used" even though the round is still live.
  const [inputLocked, setInputLocked] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const refs = useRef({
    score: 0,
    streak: 0,
    longest: 0,
    correct: 0,
    opp: 0,
    answered: false,
    youResult: "none" as GuessResult,
    oppResult: "none" as GuessResult,
    // Each side's guess time (ms from round start), so the host can break a
    // both-correct tie in favour of whoever was actually faster.
    youElapsed: Infinity,
    oppElapsed: Infinity,
    qi: 0,
  });
  const supabase = getSupabaseBrowserClient();
  const oppTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const advTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Non-host safety net: if the host's resolve never arrives (dropped message or
  // host disconnect), resolve the round locally so play never stalls.
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startRef = useRef(0);
  // Set once, when the game truly begins (map ready) — used to measure the whole
  // run for the "fastest" leaderboard.
  const gameStartRef = useRef(0);
  // Countries that were the *answer* of a resolved 1v1 round — their mark
  // (green if found, red if missed) persists for the rest of the game. Distinct
  // from transient wrong picks, which clear when the round advances.
  const resolvedTargets = useRef<Set<string>>(new Set());
  const current = questions[qi];

  // Live sync for a real 1v1. The host consumes the opponent's guesses and
  // broadcasts each round's outcome; the non-host applies the outcomes it
  // receives. (Both handlers are hoisted function declarations below.)
  const { sendGuess, sendResolve } = useMatchChannel(
    realVersus ? match!.matchId : null,
    realVersus,
    (m) => handleOpponentGuess(m),
    (m) => handleResolveMsg(m),
  );

  useEffect(() => {
    refs.current.qi = qi;
  }, [qi]);

  useEffect(() => {
    if (mapReady && !gameStartRef.current) gameStartRef.current = performance.now();
  }, [mapReady]);

  // countdown — held at full until the map is ready, then decremented from a
  // start timestamp every 100ms so we can show tenths and score sub-second speed
  // accurately (drift-free vs. a naive per-tick subtract).
  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
    if (!mapReady) return;
    startRef.current = performance.now();
    const iv = setInterval(() => {
      const tl = Math.max(0, TIME_LIMIT - (performance.now() - startRef.current) / 1000);
      setTimeLeft(tl);
      if (tl <= 0) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, [qi, mapReady]);

  // Bot opponent (bot match only) — makes ONE guess at a random time once the
  // map is ready, then the round resolver decides. A wrong bot guess no longer
  // instantly ends the round; it records the miss and waits for you. In a real
  // match the opponent's result arrives over realtime instead (see below).
  useEffect(() => {
    if (!botVersus || !current || !mapReady) return;
    const willBeCorrect = Math.random() < 0.72;
    const delay = 1800 + Math.random() * 4200;
    oppTimer.current = setTimeout(() => {
      if (refs.current.answered || refs.current.oppResult !== "none") return;
      refs.current.oppResult = willBeCorrect ? "correct" : "wrong";
      resolveRound();
    }, delay);
    return () => clearTimeout(oppTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, mapReady]);

  // Real match, non-host — arm the safety net each round. Normally the host's
  // resolve lands well before this; it only fires if the host goes silent.
  useEffect(() => {
    if (!realVersus || amHost || !current || !mapReady) return;
    fallbackTimer.current = setTimeout(
      () => {
        if (refs.current.answered) return;
        applyOutcome(refs.current.youResult === "correct" ? "you" : "none");
      },
      (TIME_LIMIT + 2) * 1000,
    );
    return () => clearTimeout(fallbackTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, mapReady]);

  // timeout — when the clock hits zero. Solo: the round is a miss. 1v1: anyone
  // who hasn't guessed is counted as a miss, then the round resolves. In a real
  // match only the host resolves on timeout (the non-host waits for the host's
  // resolve, with its fallback timer as the ultimate backstop).
  useEffect(() => {
    if (timeLeft > 0 || refs.current.answered || !current) return;
    if (botVersus) {
      if (refs.current.youResult === "none") refs.current.youResult = "wrong";
      if (refs.current.oppResult === "none") refs.current.oppResult = "wrong";
      resolveRound();
    } else if (realVersus && amHost) {
      if (refs.current.youResult === "none") refs.current.youResult = "wrong";
      if (refs.current.oppResult === "none") refs.current.oppResult = "wrong";
      hostResolve();
    } else if (!versus) {
      decideSolo(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(
    () => () => {
      clearTimeout(advTimer.current);
      clearTimeout(fallbackTimer.current);
    },
    [],
  );

  function nextSoon() {
    advTimer.current = setTimeout(() => {
      const next = refs.current.qi + 1;
      if (next >= roundLen) {
        // Host records the final result once (loser can't overwrite it).
        if (realVersus && amHost && match) {
          const winnerId =
            refs.current.score > refs.current.opp
              ? myUid
              : refs.current.score < refs.current.opp
                ? oppUid
                : null;
          void supabase.rpc("finish_match", {
            p_match_id: match.matchId,
            p_winner: winnerId,
          });
        }
        onFinish({
          mode: "find",
          play,
          score: refs.current.score,
          oppScore: refs.current.opp,
          longestStreak: refs.current.longest,
          correct: refs.current.correct,
          total: roundLen,
          opponentName,
          durationMs: gameStartRef.current
            ? Math.round(performance.now() - gameStartRef.current)
            : undefined,
        });
      } else {
        setQi(next);
        // Solo keeps every found/missed mark for the whole game. 1v1 keeps only
        // each round's *answer* (green if found, red if missed) — a wrong pick is
        // red just for the round it was made, so on advance we drop any mark that
        // isn't a resolved target.
        if (versus) {
          setStates((prev) => {
            const kept: Record<string, MapState> = {};
            for (const [iso2, st] of Object.entries(prev)) {
              if (resolvedTargets.current.has(iso2)) kept[iso2] = st;
            }
            return kept;
          });
        }
        setAnswered(false);
        setInputLocked(false);
        refs.current.answered = false;
        refs.current.youResult = "none";
        refs.current.oppResult = "none";
        refs.current.youElapsed = Infinity;
        refs.current.oppElapsed = Infinity;
        setFeedback(null);
      }
    }, 1500);
  }

  function decideSolo(youWin: boolean) {
    if (!current) return;
    refs.current.answered = true;
    setAnswered(true);
    const ns: Record<string, MapState> = {};
    if (youWin) {
      ns[current.iso2] = "correct";
      refs.current.score += pointsForTime(timeLeft);
      refs.current.streak++;
      refs.current.correct++;
      refs.current.longest = Math.max(
        refs.current.longest,
        refs.current.streak,
      );
      setFeedback({ ok: true });
    } else {
      ns[current.iso2] = "incorrect";
      refs.current.streak = 0;
      setFeedback({ ok: false });
    }
    setStates((prev) => ({ ...prev, ...ns }));
    setScore(refs.current.score);
    setStreak(refs.current.streak);
    nextSoon();
  }

  // Apply a settled 1v1 round outcome to the board and scores, from *your*
  // perspective ("you" won, the "opp" won, or a "none" draw). Shared by every
  // resolution path (bot, host, and a non-host receiving the host's verdict).
  function applyOutcome(winner: "you" | "opp" | "none") {
    if (refs.current.answered || !current) return;
    refs.current.answered = true;
    setAnswered(true);
    clearTimeout(oppTimer.current);
    clearTimeout(fallbackTimer.current);
    // The map is *your* perspective, so the answer is green only if YOU found it;
    // if the opponent won or the round timed out, you missed it → red (persists).
    const ns: Record<string, MapState> = {
      [current.iso2]: winner === "you" ? "correct" : "incorrect",
    };
    resolvedTargets.current.add(current.iso2);
    if (winner === "you") {
      refs.current.score += 1;
      refs.current.correct++;
      setFeedback({ ok: true });
    } else if (winner === "opp") {
      refs.current.opp += 1;
      setFeedback({ ok: false });
    } else {
      setFeedback({ ok: false });
    }
    setStates((prev) => ({ ...prev, ...ns }));
    setScore(refs.current.score);
    setOppScore(refs.current.opp);
    nextSoon();
  }

  // Decide a round from the two recorded results: first correct wins; if both
  // are correct, the faster elapsed time breaks the tie; if both guessed and
  // neither is correct, it's a draw. Returns null while still undecided (only
  // one side has acted, with a wrong guess) — a wrong guess never ends the round.
  function decideWinner(): "you" | "opp" | "none" | null {
    const y = refs.current.youResult;
    const o = refs.current.oppResult;
    if (y === "correct" && o === "correct") {
      return refs.current.youElapsed <= refs.current.oppElapsed ? "you" : "opp";
    }
    if (y === "correct") return "you";
    if (o === "correct") return "opp";
    if (y !== "none" && o !== "none") return "none";
    return null;
  }

  // Bot match: resolve locally as soon as the outcome is settled.
  function resolveRound() {
    if (refs.current.answered || !current) return;
    const winner = decideWinner();
    if (winner === null) return; // still waiting on a player's guess
    applyOutcome(winner);
  }

  // Real match, host: resolve authoritatively, broadcast the verdict (as the
  // winner's user id) so the non-host applies the same result, then apply it.
  function hostResolve() {
    if (refs.current.answered || !current) return;
    const winner = decideWinner();
    if (winner === null) return;
    const winnerId = winner === "you" ? myUid : winner === "opp" ? oppUid : null;
    sendResolve({ round: refs.current.qi, winnerId });
    applyOutcome(winner);
  }

  // Real match, host: record the opponent's guess as it arrives, then re-check.
  function handleOpponentGuess(m: { round: number; correct: boolean; elapsedMs: number }) {
    if (!amHost || m.round !== refs.current.qi) return;
    if (refs.current.answered || refs.current.oppResult !== "none") return;
    refs.current.oppResult = m.correct ? "correct" : "wrong";
    refs.current.oppElapsed = m.elapsedMs;
    hostResolve();
  }

  // Real match, non-host: apply the host's verdict for the current round.
  function handleResolveMsg(m: { round: number; winnerId: string | null }) {
    if (amHost || m.round !== refs.current.qi || refs.current.answered) return;
    const winner = m.winnerId === myUid ? "you" : m.winnerId === null ? "none" : "opp";
    applyOutcome(winner);
  }

  function handleClick(iso2: string) {
    if (refs.current.answered || !current) return;
    const correct = iso2 === current.iso2;
    if (!versus) {
      decideSolo(correct);
      return;
    }
    // One guess per round. A wrong guess records your miss and locks you out,
    // but the round only resolves once the opponent has also acted (or time
    // runs out).
    if (refs.current.youResult !== "none") return;
    refs.current.youResult = correct ? "correct" : "wrong";
    refs.current.youElapsed = performance.now() - startRef.current;
    setInputLocked(true);
    if (!correct) setStates((s) => ({ ...s, [iso2]: "incorrect" }));

    if (realVersus) {
      // Broadcast your guess; the host resolves. If you *are* the host, resolve
      // now (first correct wins); otherwise wait for the host's verdict.
      sendGuess({
        round: refs.current.qi,
        playerId: myUid!,
        correct,
        elapsedMs: refs.current.youElapsed,
      });
      if (amHost) hostResolve();
    } else {
      resolveRound(); // bot match
    }
  }

  if (!current) return null;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {versus ? (
        <VersusBar
          you={{ name: "You", score }}
          opponent={{ name: opponentName, score: oppScore }}
          round={qi + 1}
          total={roundLen}
        />
      ) : (
        <ScoreBar
          score={score}
          streak={streak}
          questionNum={qi + 1}
          total={roundLen}
          onHome={onHome}
          backIcon={<ArrowLeft size={16} />}
          flameIcon={<Flame size={16} />}
        />
      )}

      <div
        style={{
          borderBottom: "1px solid var(--border-neutral)",
          padding: "10px 16px",
          background: "color-mix(in srgb, var(--ink-950) 88%, transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <TimerRing timeLeft={timeLeft} total={TIME_LIMIT} decimals={1} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <p className="atlas-eyebrow" style={{ marginBottom: 4 }}>
              Find on the map
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <Flag iso2={current.iso2} name={current.name} size="lg" />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "var(--fg)",
                }}
              >
                {current.name}
              </span>
            </div>
          </div>
          {!versus ? (
            (() => {
              const stakePts = pointsForTime(timeLeft);
              const stakeColor =
                stakePts >= 3
                  ? "var(--primary)"
                  : stakePts === 2
                    ? "var(--amber-400)"
                    : "var(--danger)";
              return (
                <div style={{ minWidth: 58, textAlign: "center" }}>
                  <div className="atlas-eyebrow" style={{ color: "var(--fg-subtle)" }}>
                    Worth
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 24,
                        fontWeight: 900,
                        color: answered ? "var(--fg-subtle)" : stakeColor,
                        fontVariantNumeric: "tabular-nums",
                        transition: "color var(--dur-base) var(--ease-out)",
                      }}
                    >
                      {answered ? "·" : `+${stakePts}`}
                    </span>
                    {!answered && (
                      <span
                        style={{ fontSize: 11, color: "var(--fg-subtle)", fontWeight: 700 }}
                      >
                        pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div
              style={{
                width: 44,
                display: "flex",
                justifyContent: "center",
                color: "var(--c-asia)",
              }}
            >
              {!answered ? (
                <span
                  style={{
                    animation: "atlas-pulse 1s ease-in-out infinite",
                    display: "flex",
                  }}
                >
                  <Radar size={22} />
                </span>
              ) : (
                <Swords size={20} />
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", minHeight: 0, position: "relative" }}>
        <WorldMapGame
          countryStates={states}
          onCountryClick={handleClick}
          region={region}
          quizPool={quizPool}
          answered={answered || inputLocked}
          onReady={() => setMapReady(true)}
        />
        {/* Overlaid at the bottom of the map, not a layout sibling — so showing
            it never resizes the map. (Handed to the referee avatar in v3.3.) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <FeedbackBar
            status={
              feedback === null ? null : feedback.ok ? "correct" : "incorrect"
            }
            correctAnswer={current.name}
            icon={feedback?.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          />
        </div>
      </div>
    </div>
  );
}
