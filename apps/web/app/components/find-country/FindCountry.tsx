"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Globe, CheckCircle2, XCircle } from "lucide-react";

import type { Country, Region, MapState, RoundResult } from "@atlas/types";
import { COUNTRIES } from "@atlas/data";
import { TIME_LIMIT, ROUNDS } from "@atlas/game-logic/config";
import { shuffle, filterRegion } from "@atlas/game-logic/utils";

import { TimerRing }    from "../shared/TimerRing";
import { RegionFilter } from "../shared/RegionFilter";
import { ScoreBar }     from "../shared/ScoreBar";
import { WorldMapGame } from "./WorldMapGame";

interface FindCountryProps {
  onFinish: (r: RoundResult) => void;
  onHome: () => void;
}

export function FindCountry({ onFinish, onHome }: FindCountryProps) {
  const [phase, setPhase]             = useState<"setup" | "playing">("setup");
  const [region, setRegion]           = useState<Region>("World");
  const [numQuestions, setNumQuestions] = useState(ROUNDS);
  const [questions, setQuestions]     = useState<Country[]>([]);
  const [qi, setQi]                   = useState(0);
  const [countryStates, setCountryStates] = useState<Record<string, MapState>>({});
  const [answered, setAnswered]       = useState(false);
  const [feedbackOk, setFeedbackOk]   = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft]       = useState(TIME_LIMIT);
  const [score, setScore]             = useState(0);
  const [streak, setStreak]           = useState(0);

  const scoreRef    = useRef(0);
  const streakRef   = useRef(0);
  const lsRef       = useRef(0);
  const correctRef  = useRef(0);
  const answeredRef = useRef(false);
  const qiRef       = useRef(0);
  const advTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pool     = filterRegion(region);
  const quizPool = new Set(pool.map((c) => c.iso2));
  const current  = questions[qi];
  const maxQ     = pool.length;
  const roundLen = Math.min(numQuestions, maxQ);

  useEffect(() => { qiRef.current = qi; }, [qi]);

  useEffect(() => {
    setNumQuestions((q) => Math.min(q, filterRegion(region).length));
  }, [region]);

  const calcPoints = (tl: number) => Math.max(1, Math.round((tl / TIME_LIMIT) * 4));

  const scheduleAdvance = () => {
    clearTimeout(advTimer.current);
    advTimer.current = setTimeout(() => {
      const next = qiRef.current + 1;
      if (next >= roundLen) {
        onFinish({
          score:         scoreRef.current,
          longestStreak: lsRef.current,
          correct:       correctRef.current,
          total:         roundLen,
        });
      } else {
        setQi(next);
        setCountryStates({});
        setAnswered(false);
        answeredRef.current = false;
        setFeedbackOk(null);
      }
    }, 1400);
  };

  const startGame = () => {
    const q = shuffle(pool).slice(0, roundLen);
    setQuestions(q); setQi(0); qiRef.current = 0;
    setCountryStates({}); setAnswered(false); answeredRef.current = false;
    setFeedbackOk(null); setTimeLeft(TIME_LIMIT);
    scoreRef.current = 0; streakRef.current = 0; lsRef.current = 0; correctRef.current = 0;
    setScore(0); setStreak(0);
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(TIME_LIMIT);
    const iv = setInterval(() => setTimeLeft((t) => (t > 1 ? t - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [qi, phase]);

  useEffect(() => {
    if (timeLeft === 0 && !answeredRef.current && phase === "playing" && current) {
      answeredRef.current = true;
      setAnswered(true);
      setFeedbackOk(false);
      setCountryStates({ [current.iso2]: "correct" });
      streakRef.current = 0;
      setStreak(0);
      scheduleAdvance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleCountryClick = (iso2: string) => {
    if (answeredRef.current || !current) return;
    answeredRef.current = true;
    setAnswered(true);

    const isCorrect = iso2 === current.iso2;
    const pts = isCorrect ? calcPoints(timeLeft) : 0;
    const ns: Record<string, MapState> = {};

    if (isCorrect) {
      ns[iso2] = "correct";
      scoreRef.current += pts;
      streakRef.current++;
      correctRef.current++;
      lsRef.current = Math.max(lsRef.current, streakRef.current);
    } else {
      ns[iso2]          = "incorrect";
      ns[current.iso2]  = "correct";
      streakRef.current = 0;
    }

    setCountryStates(ns);
    setFeedbackOk(isCorrect);
    setScore(scoreRef.current);
    setStreak(streakRef.current);
    scheduleAdvance();
  };

  useEffect(() => () => clearTimeout(advTimer.current), []);

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center gap-3 px-5 py-4 bg-[#020c1a]/75 backdrop-blur-md border-b border-white/8">
          <button onClick={onHome}
            className="p-1.5 rounded-lg text-[#6b9ab8] hover:text-[#e8f4ff] hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-[#e8f4ff] text-base">Find the Country</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#061428]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl">
            <div className="flex flex-col items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#e8f4ff]">Find the Country</h2>
                <p className="text-[#6b9ab8] text-sm mt-1">
                  Locate countries fast — speed earns bonus points
                </p>
              </div>

              <div className="w-full space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-[#6b9ab8] uppercase tracking-widest mb-2">Region</p>
                  <RegionFilter value={region} onChange={setRegion} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-[#6b9ab8] uppercase tracking-widest">Questions</p>
                    <span className="text-sm font-black text-primary tabular-nums">{roundLen}</span>
                  </div>
                  <input type="range" min={1} max={maxQ} value={roundLen}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #00c8a8 ${((roundLen - 1) / Math.max(1, maxQ - 1)) * 100}%, rgba(255,255,255,0.1) 0%)`,
                      accentColor: "#00c8a8",
                    }}
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-[#6b9ab8]">
                    <span>1</span>
                    <span className="text-[#6b9ab8]/60">{maxQ} available</span>
                    <span>{maxQ}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-primary/8 border border-primary/15 rounded-xl px-4 py-3">
                  <span className="text-primary text-lg">⚡</span>
                  <p className="text-xs text-[#a0c8e0] font-medium leading-relaxed">
                    Answer in <strong className="text-[#e8f4ff]">3 s</strong> for{" "}
                    <strong className="text-primary">4 pts</strong> · slower earns fewer · {TIME_LIMIT}s limit
                  </p>
                </div>
              </div>

              <button onClick={startGame}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all">
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  // ── Playing screen ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ScoreBar score={score} streak={streak} questionNum={qi + 1} total={roundLen} onHome={onHome} />

      <div className="bg-[#020c1a]/90 backdrop-blur-md border-b border-white/8 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <TimerRing timeLeft={timeLeft} total={TIME_LIMIT} />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-[#6b9ab8] font-bold uppercase tracking-widest mb-0.5">
              Find on the map
            </p>
            <div className="flex items-center justify-center gap-2">
              <img
                src={`https://flagcdn.com/${current.iso2}.svg`}
                alt={`Flag of ${current.name}`}
                className="w-8 h-5 object-cover rounded border border-white/12 shadow"
              />
              <span className="text-xl font-black text-[#e8f4ff]">{current.name}</span>
            </div>
          </div>
          <div className="w-14 shrink-0 flex flex-col items-center">
            <span className="text-[10px] text-[#6b9ab8] font-semibold uppercase">pts</span>
            <span className="text-xl font-black text-primary tabular-nums">
              {answered ? "" : calcPoints(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <WorldMapGame
          countryStates={countryStates}
          onCountryClick={handleCountryClick}
          region={region}
          quizPool={quizPool}
          answered={answered}
        />
      </div>

      <div
        aria-live="polite"
        className={`shrink-0 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 ${
          feedbackOk === null
            ? "h-0 opacity-0"
            : feedbackOk
            ? "h-10 bg-green-900/80 text-green-300 border-t border-green-800/35"
            : "h-10 bg-red-900/80 text-red-300 border-t border-red-800/35"
        }`}>
        {feedbackOk === true  && <><CheckCircle2 className="w-4 h-4 shrink-0" /> Correct!</>}
        {feedbackOk === false && <><XCircle      className="w-4 h-4 shrink-0" /> It was <strong className="ml-1">{current.name}</strong></>}
      </div>
    </div>
  );
}