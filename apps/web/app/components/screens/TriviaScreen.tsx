"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  Radar,
} from "lucide-react";
import type { Region } from "@atlas/types";
import { COUNTRIES } from "@atlas/data";
import { TIME_LIMIT } from "@atlas/game-logic/config";
import { ScoreBar } from "../ui/game/ScoreBar";
import { VersusBar } from "../ui/game/VersusBar";
import { TimerRing } from "../ui/game/TimerRing";
import { FlagChoiceGrid } from "../ui/game/FlagChoiceGrid";
import { FeedbackBar } from "../ui/game/FeedbackBar";
import { Badge } from "../ui/display/Badge";
import { genTrivia, type TriviaQuestion } from "../../lib/trivia";
import type { PlayMode } from "./ModeIntroScreen";

export interface TriviaResult {
  mode: "trivia";
  play: PlayMode;
  score: number;
  oppScore: number;
  longestStreak: number;
  correct: number;
  total: number;
  opponentName: string;
}

export interface TriviaScreenProps {
  play: PlayMode;
  region: Region;
  roundLen: number;
  opponentName: string;
  onFinish: (result: TriviaResult) => void;
  onHome: () => void;
}

const BY_ISO = Object.fromEntries(COUNTRIES.map((c) => [c.iso2, c]));
const calcPoints = (tl: number) =>
  Math.max(1, Math.round((tl / TIME_LIMIT) * 4));

/**
 * AI-generated question, answered by picking a country flag. Solo (speed
 * scoring) and 1v1 versus (first correct answer wins the round).
 */
export function TriviaScreen({
  play,
  region,
  roundLen,
  opponentName,
  onFinish,
  onHome,
}: TriviaScreenProps) {
  const versus = play === "versus";

  const [questions] = useState<TriviaQuestion[]>(() =>
    genTrivia(region, roundLen),
  );
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [graded, setGraded] = useState<Record<string, "correct" | "incorrect">>(
    {},
  );
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
  const q = questions[qi];

  useEffect(() => {
    refs.current.qi = qi;
  }, [qi]);

  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
    const iv = setInterval(() => setTimeLeft((t) => (t > 1 ? t - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [qi]);

  useEffect(() => {
    if (!versus || !q) return;
    const willBeCorrect = Math.random() < 0.7;
    const delay = 2000 + Math.random() * 4500;
    oppTimer.current = setTimeout(() => {
      if (refs.current.answered) return;
      if (willBeCorrect) decide("opp");
      else if (refs.current.youMissed) decide("none");
    }, delay);
    return () => clearTimeout(oppTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi]);

  useEffect(() => {
    if (versus) return;
    if (timeLeft === 0 && !refs.current.answered && q) settleSolo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => () => clearTimeout(advTimer.current), []);

  function reveal(): Record<string, "correct" | "incorrect"> {
    return q ? { [q.answerIso2]: "correct" } : {};
  }

  function nextSoon() {
    advTimer.current = setTimeout(() => {
      const next = refs.current.qi + 1;
      if (next >= questions.length) {
        onFinish({
          mode: "trivia",
          play,
          score: refs.current.score,
          oppScore: refs.current.opp,
          longestStreak: refs.current.longest,
          correct: refs.current.correct,
          total: questions.length,
          opponentName,
        });
      } else {
        setQi(next);
        setPicked(null);
        setGraded({});
        setAnswered(false);
        refs.current.answered = false;
        refs.current.youMissed = false;
        setFeedback(null);
      }
    }, 1600);
  }

  function settleSolo(iso2: string | null) {
    if (!q) return;
    refs.current.answered = true;
    setAnswered(true);
    const ok = iso2 === q.answerIso2;
    const g = reveal();
    if (ok) {
      refs.current.score += calcPoints(timeLeft);
      refs.current.streak++;
      refs.current.correct++;
      refs.current.longest = Math.max(
        refs.current.longest,
        refs.current.streak,
      );
    } else {
      if (iso2) g[iso2] = "incorrect";
      refs.current.streak = 0;
    }
    setGraded(g);
    setFeedback({ ok });
    setScore(refs.current.score);
    setStreak(refs.current.streak);
    nextSoon();
  }

  function decide(winner: "you" | "opp" | "none") {
    if (refs.current.answered) return;
    refs.current.answered = true;
    setAnswered(true);
    clearTimeout(oppTimer.current);
    const g = reveal();
    if (winner === "you") {
      refs.current.score += 1;
      refs.current.correct++;
      setFeedback({ ok: true });
    } else {
      refs.current.opp += winner === "opp" ? 1 : 0;
      setFeedback({ ok: false });
    }
    setGraded(g);
    setScore(refs.current.score);
    setOppScore(refs.current.opp);
    nextSoon();
  }

  function handlePick(iso2: string) {
    if (refs.current.answered || !q) return;
    setPicked(iso2);
    const correct = iso2 === q.answerIso2;
    if (versus) {
      if (correct) decide("you");
      else {
        refs.current.youMissed = true;
        setGraded((s) => ({ ...s, [iso2]: "incorrect" }));
      }
    } else {
      settleSolo(iso2);
    }
  }

  if (!q) return null;

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
          total={questions.length}
        />
      ) : (
        <ScoreBar
          score={score}
          streak={streak}
          questionNum={qi + 1}
          total={questions.length}
          onHome={onHome}
          backIcon={<ArrowLeft size={16} />}
          flameIcon={<Flame size={16} />}
        />
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Badge tone="primary" icon={<Sparkles size={12} />}>
            AI Question
          </Badge>
          {!versus && (
            <TimerRing
              timeLeft={timeLeft}
              total={TIME_LIMIT}
              size={38}
              stroke={4}
            />
          )}
          {versus && !answered && (
            <span
              style={{
                color: "var(--c-asia)",
                display: "flex",
                animation: "atlas-pulse 1s ease-in-out infinite",
              }}
            >
              <Radar size={20} />
            </span>
          )}
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "var(--fg)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {q.prompt}
        </h2>

        <FlagChoiceGrid
          options={q.choices}
          value={picked}
          states={graded}
          onSelect={handlePick}
          disabled={answered}
          columns={2}
        />
      </div>

      <FeedbackBar
        status={
          feedback === null ? null : feedback.ok ? "correct" : "incorrect"
        }
        correctAnswer={BY_ISO[q.answerIso2]?.name}
        icon={feedback?.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      />
    </div>
  );
}
