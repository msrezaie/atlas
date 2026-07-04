"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  XCircle,
  Flag as FlagIcon,
  Keyboard,
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
import { Flag } from "../ui/display/Flag";
import { Button } from "../ui/actions/Button";
import {
  genFlagQuestions,
  checkTypedAnswer,
  type FlagQuestion,
} from "../../lib/flagGuesser";
import type { PlayMode } from "../../lib/gameMode";

export interface FlagGuesserResult {
  mode: "flag";
  play: PlayMode;
  score: number;
  oppScore: number;
  longestStreak: number;
  correct: number;
  total: number;
  opponentName: string;
}

export interface FlagGuesserScreenProps {
  play: PlayMode;
  region: Region;
  roundLen: number;
  opponentName: string;
  onFinish: (result: FlagGuesserResult) => void;
  onHome: () => void;
}

const BY_ISO = Object.fromEntries(COUNTRIES.map((c) => [c.iso2, c]));
const calcPoints = (tl: number) =>
  Math.max(1, Math.round((tl / TIME_LIMIT) * 4));

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: 52,
  padding: "0 16px",
  background: "var(--surface-input)",
  border: "1px solid var(--border-neutral-strong)",
  borderRadius: "var(--radius-md)",
  color: "var(--fg)",
  fontFamily: "var(--font-body)",
  fontSize: 17,
  fontWeight: 600,
  textAlign: "center",
  outline: "none",
  transition: "border-color var(--dur-base) var(--ease-out)",
};

/**
 * Flag Guesser round — mixes "which flag is X?" multiple-choice with
 * "name this flag" typed-answer questions. Solo mixes both; 1v1 versus
 * only ever receives multiple-choice questions (see genFlagQuestions'
 * `allowTyped` — typing would skew a race by typing speed).
 */
export function FlagGuesserScreen({
  play,
  region,
  roundLen,
  opponentName,
  onFinish,
  onHome,
}: FlagGuesserScreenProps) {
  const versus = play === "versus";

  const [questions] = useState<FlagQuestion[]>(() =>
    genFlagQuestions(region, roundLen, !versus),
  );
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [graded, setGraded] = useState<Record<string, "correct" | "incorrect">>(
    {},
  );
  const [typedValue, setTypedValue] = useState("");
  const [typedStatus, setTypedStatus] = useState<"correct" | "incorrect" | null>(
    null,
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
    if (timeLeft === 0 && !refs.current.answered && q) settleSolo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => () => clearTimeout(advTimer.current), []);

  function reveal(): Record<string, "correct" | "incorrect"> {
    return q && q.kind === "mc" ? { [q.answerIso2]: "correct" } : {};
  }

  function nextSoon() {
    advTimer.current = setTimeout(() => {
      const next = refs.current.qi + 1;
      if (next >= questions.length) {
        onFinish({
          mode: "flag",
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
        setTypedValue("");
        setTypedStatus(null);
        setAnswered(false);
        refs.current.answered = false;
        refs.current.youMissed = false;
        setFeedback(null);
      }
    }, 1600);
  }

  function settleSolo(ok: boolean, wrongIso2?: string) {
    if (!q) return;
    refs.current.answered = true;
    setAnswered(true);
    if (ok) {
      refs.current.score += calcPoints(timeLeft);
      refs.current.streak++;
      refs.current.correct++;
      refs.current.longest = Math.max(
        refs.current.longest,
        refs.current.streak,
      );
    } else {
      refs.current.streak = 0;
    }
    if (q.kind === "mc") {
      const g: Record<string, "correct" | "incorrect"> = {
        [q.answerIso2]: "correct",
      };
      if (!ok && wrongIso2) g[wrongIso2] = "incorrect";
      setGraded(g);
    } else {
      setTypedStatus(ok ? "correct" : "incorrect");
    }
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
    if (refs.current.answered || !q || q.kind !== "mc") return;
    setPicked(iso2);
    const correct = iso2 === q.answerIso2;
    if (versus) {
      if (correct) decide("you");
      else {
        refs.current.youMissed = true;
        setGraded((s) => ({ ...s, [iso2]: "incorrect" }));
      }
    } else {
      settleSolo(correct, correct ? undefined : iso2);
    }
  }

  function handleTypedSubmit() {
    if (refs.current.answered || !q || q.kind !== "typed") return;
    const c = BY_ISO[q.answerIso2];
    if (!c) return;
    settleSolo(checkTypedAnswer(typedValue, c));
  }

  if (!q) return null;
  const isMc = q.kind === "mc";

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
          <Badge
            tone="primary"
            icon={isMc ? <FlagIcon size={12} /> : <Keyboard size={12} />}
          >
            {isMc ? "Pick the flag" : "Type the country"}
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

        {isMc ? (
          <>
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
              Which flag belongs to {BY_ISO[q.answerIso2]?.name}?
            </h2>
            <FlagChoiceGrid
              options={q.choices}
              value={picked}
              states={graded}
              onSelect={handlePick}
              disabled={answered}
              columns={2}
              showName={false}
            />
          </>
        ) : (
          <>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 23,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--fg)",
                margin: 0,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              Name this flag
            </h2>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "8px 0",
              }}
            >
              <Flag
                iso2={q.answerIso2}
                name={answered ? q.answerName : undefined}
                size="xl"
              />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTypedSubmit();
              }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                autoFocus
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                disabled={answered}
                placeholder="Country name…"
                style={{
                  ...inputStyle,
                  borderColor:
                    typedStatus === "correct"
                      ? "var(--success)"
                      : typedStatus === "incorrect"
                        ? "var(--danger)"
                        : "var(--border-neutral-strong)",
                }}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={answered || !typedValue.trim()}
              >
                Submit
              </Button>
            </form>
          </>
        )}
      </div>

      <FeedbackBar
        status={
          feedback === null ? null : feedback.ok ? "correct" : "incorrect"
        }
        correctAnswer={q.answerName}
        icon={feedback?.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      />
    </div>
  );
}
