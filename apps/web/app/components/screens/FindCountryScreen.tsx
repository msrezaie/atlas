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
import { TIME_LIMIT } from "@atlas/game-logic/config";
import { shuffle, filterRegion } from "@atlas/game-logic/utils";
import { ScoreBar } from "../ui/game/ScoreBar";
import { VersusBar } from "../ui/game/VersusBar";
import { TimerRing } from "../ui/game/TimerRing";
import { Flag } from "../ui/display/Flag";
import { FeedbackBar } from "../ui/game/FeedbackBar";
import { WorldMapGame } from "../find-country/WorldMapGame";
import type { PlayMode } from "./ModeIntroScreen";

export interface FindCountryResult {
  mode: "find";
  play: PlayMode;
  score: number;
  oppScore: number;
  longestStreak: number;
  correct: number;
  total: number;
  opponentName: string;
}

export interface FindCountryScreenProps {
  play: PlayMode;
  region: Region;
  roundLen: number;
  opponentName: string;
  onFinish: (result: FindCountryResult) => void;
  onHome: () => void;
}

const calcPoints = (tl: number) =>
  Math.max(1, Math.round((tl / TIME_LIMIT) * 4));

/**
 * Locate the prompted country on the shared map. Handles both solo (speed
 * scoring) and 1v1 versus (first correct answer wins the round).
 */
export function FindCountryScreen({
  play,
  region,
  roundLen,
  opponentName,
  onFinish,
  onHome,
}: FindCountryScreenProps) {
  const versus = play === "versus";

  const [questions] = useState<Country[]>(() =>
    shuffle(filterRegion(region)).slice(0, roundLen),
  );
  // Every country in the region is clickable, not just the ones that ended
  // up in this round's question sample — the round length only controls how
  // many prompts get asked, not what's selectable on the map.
  const quizPool = useMemo(
    () => new Set(filterRegion(region).map((c) => c.iso2)),
    [region],
  );
  const [qi, setQi] = useState(0);
  const [states, setStates] = useState<Record<string, MapState>>({});
  const [answered, setAnswered] = useState(false);
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
    youMissed: false,
    qi: 0,
  });
  const oppTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const advTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = questions[qi];

  useEffect(() => {
    refs.current.qi = qi;
  }, [qi]);

  // countdown
  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
    const iv = setInterval(() => setTimeLeft((t) => (t > 1 ? t - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [qi]);

  // opponent behaviour (versus only) — schedule their attempt for this round
  useEffect(() => {
    if (!versus || !current) return;
    const willBeCorrect = Math.random() < 0.72;
    const delay = 1800 + Math.random() * 4200;
    oppTimer.current = setTimeout(() => {
      if (refs.current.answered) return;
      if (willBeCorrect) decide("opp");
      else if (refs.current.youMissed) decide("none");
    }, delay);
    return () => clearTimeout(oppTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi]);

  // solo timeout
  useEffect(() => {
    if (versus) return;
    if (timeLeft === 0 && !refs.current.answered && current) decideSolo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => () => clearTimeout(advTimer.current), []);

  function nextSoon() {
    advTimer.current = setTimeout(() => {
      const next = refs.current.qi + 1;
      if (next >= roundLen) {
        onFinish({
          mode: "find",
          play,
          score: refs.current.score,
          oppScore: refs.current.opp,
          longestStreak: refs.current.longest,
          correct: refs.current.correct,
          total: roundLen,
          opponentName,
        });
      } else {
        setQi(next);
        // states are intentionally NOT reset here — found/missed countries
        // stay marked on the map for the rest of the round.
        setAnswered(false);
        refs.current.answered = false;
        refs.current.youMissed = false;
        setFeedback(null);
      }
    }, 1500);
  }

  function decideSolo(youWin: boolean, iso2?: string) {
    if (!current) return;
    refs.current.answered = true;
    setAnswered(true);
    const ns: Record<string, MapState> = {};
    if (youWin) {
      ns[current.iso2] = "correct";
      refs.current.score += calcPoints(timeLeft);
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

  function decide(winner: "you" | "opp" | "none") {
    if (refs.current.answered || !current) return;
    refs.current.answered = true;
    setAnswered(true);
    clearTimeout(oppTimer.current);
    const ns: Record<string, MapState> = { [current.iso2]: "correct" };
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

  function handleClick(iso2: string) {
    if (refs.current.answered || !current) return;
    const correct = iso2 === current.iso2;
    if (versus) {
      if (correct) decide("you");
      else {
        refs.current.youMissed = true;
        setStates((s) => ({ ...s, [iso2]: "incorrect" }));
      }
    } else {
      decideSolo(correct, correct ? undefined : iso2);
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
          {!versus && <TimerRing timeLeft={timeLeft} total={TIME_LIMIT} />}
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
              <Flag iso2={current.iso2} name={current.name} size="md" />
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
            <div style={{ width: 48, textAlign: "center" }}>
              <div className="atlas-eyebrow">pts</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {answered ? "·" : calcPoints(timeLeft)}
              </div>
            </div>
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

      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <WorldMapGame
          countryStates={states}
          onCountryClick={handleClick}
          region={region}
          quizPool={quizPool}
          answered={answered}
        />
      </div>

      <FeedbackBar
        status={
          feedback === null ? null : feedback.ok ? "correct" : "incorrect"
        }
        correctAnswer={current.name}
        icon={feedback?.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      />
    </div>
  );
}
