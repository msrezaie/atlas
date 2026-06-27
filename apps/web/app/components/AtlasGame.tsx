"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "@vnedyalk0v/react19-simple-maps";
import { geoOrthographic, geoPath, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import {
  ArrowLeft, Globe, Flag, Brain, CheckCircle2, XCircle,
  Trophy, Flame, MapPin, Lock, Plus, Minus, RotateCcw,
} from "lucide-react";

import type { Country, Region, MapState, RoundResult } from "@atlas/types";
import { COUNTRIES } from "@atlas/data";
import { GEO_URL, NUM_TO_ISO2 } from "@atlas/data";
import { REGIONS, REGION_VIEW, CONTINENT_COLOR } from "@atlas/data";
import { TIME_LIMIT, ROUNDS } from "@atlas/game-logic/config";
import { shuffle, filterRegion } from "@atlas/game-logic/utils";
import type { FeatureCollection } from "geojson";

// ─── RotatingGlobe ────────────────────────────────────────────────────────────

function RotatingGlobe({ dimmed }: { dimmed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef  = useRef<unknown>(null);
  const rotRef    = useRef(-30);
  const rafRef    = useRef<number>(0);
  const stars     = useRef<{ x: number; y: number; r: number; a: number }[]>([]);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((d) => { worldRef.current = d; });

    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    stars.current = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.1 + 0.2,
      a: 0.2 + Math.random() * 0.5,
    }));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const ctx = canvas.getContext("2d")!;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars.current) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,210,255,${s.a})`;
        ctx.fill();
      }

      const cx = w / 2, cy = h / 2, radius = Math.min(w, h) * 0.41;
      const proj = geoOrthographic()
        .scale(radius).translate([cx, cy])
        .rotate([rotRef.current, -22, 0]).clipAngle(90);
      const path = geoPath(proj, ctx);
      const sphere = { type: "Sphere" } as unknown as GeoJSON.GeometryObject;

      const og = ctx.createRadialGradient(cx - radius * .25, cy - radius * .25, radius * .05, cx, cy, radius);
      og.addColorStop(0, "#0d3060");
      og.addColorStop(1, "#020b18");
      ctx.beginPath(); path(sphere); ctx.fillStyle = og; ctx.fill();

      ctx.beginPath();
      path(geoGraticule()() as unknown as GeoJSON.GeometryObject);
      ctx.strokeStyle = "rgba(0,180,155,0.07)";
      ctx.lineWidth = 0.5 * dpr;
      ctx.stroke();

      if (worldRef.current) {
        const topo = worldRef.current as Parameters<typeof feature>[0];
        const topoObj = topo as unknown as { objects: { countries: Parameters<typeof feature>[1] } };
        const countries = feature(topo, topoObj.objects.countries);
        ctx.beginPath();
        path(countries as unknown as GeoJSON.GeometryObject);
        ctx.fillStyle = "rgba(14,55,115,0.8)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,195,168,0.2)";
        ctx.lineWidth = 0.5 * dpr;
        ctx.stroke();
      }

      ctx.beginPath(); path(sphere);
      ctx.strokeStyle = "rgba(0,200,168,0.3)";
      ctx.lineWidth = 1.8 * dpr;
      ctx.stroke();

      const hg = ctx.createRadialGradient(cx - radius * .32, cy - radius * .32, 0, cx, cy, radius);
      hg.addColorStop(0, "rgba(130,210,255,0.09)");
      hg.addColorStop(0.45, "rgba(0,0,0,0)");
      ctx.beginPath(); path(sphere); ctx.fillStyle = hg; ctx.fill();

      rotRef.current += 0.035;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current!);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-700"
      style={{ zIndex: 0, opacity: dimmed ? 0.22 : 1 }}
    />
  );
}

// ─── TimerRing ────────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 26, c = 2 * Math.PI * r, pct = timeLeft / total;
  const color = pct > 0.6 ? "#00c8a8" : pct > 0.3 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg width="64" height="64" className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.35s ease" }} />
      </svg>
      <span className="text-lg font-black tabular-nums" style={{ color }}>{timeLeft}</span>
    </div>
  );
}

// ─── RegionFilter ─────────────────────────────────────────────────────────────

function RegionFilter({ value, onChange }: { value: Region; onChange: (r: Region) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {REGIONS.map((r) => (
        <button key={r} onClick={() => onChange(r)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            value === r
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-white/6 text-[#a0c8e0] hover:text-[#e8f4ff] hover:bg-white/12 border border-white/10"
          }`}>
          {r === "Oceania" ? "Australia/Oceania" : r}
        </button>
      ))}
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({
  score, streak, questionNum, total, onHome,
}: {
  score: number; streak: number; questionNum: number; total: number; onHome: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#020c1a]/90 backdrop-blur-md border-b border-white/8 sticky top-0 z-20">
      <button onClick={onHome}
        className="p-1.5 rounded-lg text-[#6b9ab8] hover:text-[#e8f4ff] hover:bg-white/10 transition-colors"
        aria-label="Back to home">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        <span className="text-xs tabular-nums text-[#6b9ab8] whitespace-nowrap font-semibold">
          {questionNum}/{total}
        </span>
        <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(questionNum / total) * 100}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {streak >= 2 && (
          <div className="flex items-center gap-0.5 text-amber-400 animate-pulse">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-black tabular-nums">{streak}</span>
          </div>
        )}
        <div className="font-black text-xl tabular-nums text-primary min-w-[40px] text-right">
          {score}
        </div>
      </div>
    </div>
  );
}

// ─── ResultsScreen ────────────────────────────────────────────────────────────

function ResultsScreen({
  result, bestScore, onPlayAgain, onHome,
}: {
  result: RoundResult; bestScore: number; onPlayAgain: () => void; onHome: () => void;
}) {
  const acc = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const isNewBest = result.score > 0 && result.score >= bestScore;
  const emoji = acc >= 90 ? "🏆" : acc >= 70 ? "⭐" : "🌍";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#061428]/92 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-3xl font-black text-[#e8f4ff]">Round Complete!</h2>
          {isNewBest && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 bg-amber-400/12 text-amber-300 border border-amber-500/22 px-3 py-1 rounded-full text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" /> New Best Score!
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {[
            ["Score",       result.score],
            ["Best Streak", result.longestStreak],
            ["Accuracy",    `${acc}%`],
          ].map(([l, v]) => (
            <div key={l as string} className="bg-white/5 rounded-2xl p-4 text-center border border-white/8">
              <div className="text-2xl font-black text-[#e8f4ff]">{v}</div>
              <div className="text-[11px] text-[#6b9ab8] mt-1 font-semibold uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onPlayAgain}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all">
            Play Again
          </button>
          <button onClick={onHome}
            className="w-full py-2.5 text-[#6b9ab8] hover:text-[#e8f4ff] font-semibold transition-colors text-sm">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CountryPath ──────────────────────────────────────────────────────────────
// Isolated so React.memo can skip re-rendering countries whose state hasn't changed.

interface CountryPathProps {
  geo: GeoJSON.Feature;
  rsmKey: string;
  iso2: string | undefined;
  mapState: MapState | "neutral";
  inPool: boolean;
  answered: boolean;
  continentBase: string;
  continentHover: string;
  continentBorder: string;
  onCountryClick: (iso2: string) => void;
}

const STYLE_STATIC = { default: { outline: "none", transition: "fill 0.18s ease" }, pressed: { outline: "none" } };

const CountryPath = memo(function CountryPath({
  geo, rsmKey, iso2, mapState, inPool, answered,
  continentBase, continentHover, continentBorder, onCountryClick,
}: CountryPathProps) {
  const fill   = mapState === "correct" ? "#16a34a"
               : mapState === "incorrect" ? "#b91c1c"
               : inPool ? continentBase : "#040b16";
  const stroke = mapState === "correct" ? "#4ade80"
               : mapState === "incorrect" ? "#f87171"
               : inPool ? continentBorder : "#030a12";
  const strokeWidth = mapState !== "neutral" ? 0.8 : inPool ? 0.4 : 0.1;

  const hoverFill = (inPool && answered === false && mapState === "neutral")
    ? continentHover : fill;

  const style = {
    ...STYLE_STATIC,
    hover: {
      fill: hoverFill,
      outline: "none",
      cursor: inPool && !answered ? "pointer" : "default",
    },
  };

  return (
    <Geography
      key={rsmKey}
      geography={geo}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={style}
      onClick={() => { if (inPool && !answered && iso2) onCountryClick(iso2); }}
    />
  );
}, (prev, next) =>
  prev.mapState   === next.mapState   &&
  prev.inPool     === next.inPool     &&
  prev.answered   === next.answered   &&
  prev.rsmKey     === next.rsmKey
);

// ─── WorldMapGame ─────────────────────────────────────────────────────────────

interface MapPosition { coordinates: [number, number]; zoom: number; }

function WorldMapGame({
  countryStates, onCountryClick, region, quizPool, answered,
}: {
  countryStates: Record<string, MapState>;
  onCountryClick: (iso2: string) => void;
  region: Region; quizPool: Set<string>; answered: boolean;
}) {
  const view = REGION_VIEW[region];
  const [pos, setPos] = useState<MapPosition>({ coordinates: view.center, zoom: view.zoom });

  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((topo) => {
        const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection;
        setGeoData(fc);
      })
      .catch((err) => console.error("topojson load failed:", err));
  }, []);

  useEffect(() => {
    const v = REGION_VIEW[region];
    setPos({ coordinates: v.center, zoom: v.zoom });
  }, [region]);

  const handleMoveEnd = useCallback(
    (p: { coordinates: [number, number]; zoom: number }) => setPos(p),
    []
  );

  const zoomIn    = () => setPos((p) => ({ ...p, zoom: Math.min(16, p.zoom * 1.5) }));
  const zoomOut   = () => setPos((p) => ({ ...p, zoom: Math.max(view.minZoom, p.zoom / 1.5) }));
  const resetView = () => setPos({ coordinates: view.center, zoom: view.zoom });

  const iso2Of = (geoId: string | number) => NUM_TO_ISO2[parseInt(geoId as string)];

  return (
    <div className="relative w-full h-full" style={{ background: "#030810" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 160 }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ZoomableGroup
          zoom={pos.zoom} center={pos.coordinates as never} onMoveEnd={handleMoveEnd}
          minZoom={view.minZoom} maxZoom={16}
        >
          {geoData ? (
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const rsmKey = (geo as unknown as { rsmKey: string }).rsmKey;
                  const iso2   = iso2Of(geo.id as string);
                  const country = iso2 ? COUNTRIES.find((c) => c.iso2 === iso2) : undefined;
                  const colors  = country ? CONTINENT_COLOR[country.continent] : { base: "#040b16", hover: "#040b16", border: "#030a12" };
                  return (
                    <CountryPath
                    key={rsmKey}
                    geo={geo}
                    rsmKey={rsmKey}
                    iso2={iso2}
                    mapState={countryStates[iso2 ?? ""] ?? "neutral"}
                    inPool={!!iso2 && quizPool.has(iso2)}
                    answered={answered}
                    continentBase={colors.base}
                    continentHover={colors.hover}
                    continentBorder={colors.border}
                    onCountryClick={onCountryClick}
                    />
                  );
                })
              }
            </Geographies>
          ) : <p>Loading data...</p>}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        {([
          { icon: <Plus className="w-3.5 h-3.5" />,    action: zoomIn    },
          { icon: <Minus className="w-3.5 h-3.5" />,   action: zoomOut   },
          { icon: <RotateCcw className="w-3 h-3" />,   action: resetView },
        ] as const).map(({ icon, action }, i) => (
          <button key={i} onClick={action}
            className="w-8 h-8 rounded-lg bg-[#061428]/90 border border-white/15 text-[#e8f4ff] flex items-center justify-center hover:bg-[#0a2040] transition-colors backdrop-blur-sm shadow-lg">
            {icon}
          </button>
        ))}
      </div>

      <p className="absolute bottom-4 left-4 text-[10px] text-[#6b9ab8]/55 font-medium select-none">
        Scroll to zoom · drag to pan
      </p>
    </div>
  );
}

// ─── FindCountry ──────────────────────────────────────────────────────────────

function FindCountry({
  onFinish, onHome,
}: {
  onFinish: (r: RoundResult) => void; onHome: () => void;
}) {
  const [phase, setPhase]               = useState<"setup" | "playing">("setup");
  const [region, setRegion]             = useState<Region>("World");
  const [numQuestions, setNumQuestions] = useState(ROUNDS);
  const [questions, setQuestions]       = useState<Country[]>([]);
  const [qi, setQi]                     = useState(0);
  const [countryStates, setCountryStates] = useState<Record<string, MapState>>({});
  const [answered, setAnswered]         = useState(false);
  const [feedbackOk, setFeedbackOk]     = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft]         = useState(TIME_LIMIT);
  const [score, setScore]               = useState(0);
  const [streak, setStreak]             = useState(0);

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
          score: scoreRef.current,
          longestStreak: lsRef.current,
          correct: correctRef.current,
          total: roundLen,
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

  // Restart timer for each new question
  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(TIME_LIMIT);
    const iv = setInterval(() => setTimeLeft((t) => (t > 1 ? t - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [qi, phase]);

  // Handle timeout
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
      scoreRef.current  += pts;
      streakRef.current++;
      correctRef.current++;
      lsRef.current = Math.max(lsRef.current, streakRef.current);
    } else {
      ns[iso2] = "incorrect";
      ns[current.iso2] = "correct";
      streakRef.current = 0;
    }

    setCountryStates(ns);
    setFeedbackOk(isCorrect);
    setScore(scoreRef.current);
    setStreak(streakRef.current);
    scheduleAdvance();
  };

  useEffect(() => () => clearTimeout(advTimer.current), []);

  // ── Setup screen ──
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

  // ── Playing screen ──
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

// ─── Home ─────────────────────────────────────────────────────────────────────

function Home({ bestScore, onPlay }: { bestScore: number; onPlay: () => void }) {
  const modes = [
    { id: "find-country", icon: <Globe className="w-6 h-6" />, title: "Find the Country", desc: "Locate countries on the world map", active: true  },
    { id: "guess-flag",   icon: <Flag  className="w-6 h-6" />, title: "Guess the Flag",   desc: "Identify countries by their flags",  active: false },
    { id: "geo-trivia",   icon: <Brain className="w-6 h-6" />, title: "Geo Trivia",        desc: "Capitals, comparisons & more",       active: false },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-primary/12 border border-primary/22 mb-5 shadow-xl shadow-primary/10">
          <MapPin className="w-9 h-9 text-primary" />
        </div>
        <h1
          className="text-6xl font-black tracking-tight text-[#e8f4ff]"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          Atlas
        </h1>
        <p className="text-[#6b9ab8] mt-2.5 text-sm font-medium">
          Learn world geography — one game at a time
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <p className="text-[11px] font-bold text-[#6b9ab8] uppercase tracking-widest px-1">
          Game Modes
        </p>
        {modes.map((mode) =>
          mode.active ? (
            <button key={mode.id} onClick={onPlay}
              className="w-full bg-gradient-to-br from-teal-500/12 to-cyan-600/6 border border-teal-500/18 rounded-2xl p-5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all group backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/14 border border-primary/18 flex items-center justify-center text-primary group-hover:bg-primary/22 transition-colors shrink-0">
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#e8f4ff]">{mode.title}</p>
                  <p className="text-xs text-[#6b9ab8] mt-0.5">{mode.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {bestScore > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="text-xs font-black tabular-nums">{bestScore}</span>
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Play →
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div key={mode.id}
              className="w-full bg-white/3 border border-white/7 rounded-2xl p-5 opacity-38 cursor-not-allowed backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#6b9ab8] shrink-0">
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#e8f4ff]">{mode.title}</p>
                  <p className="text-xs text-[#6b9ab8] mt-0.5">{mode.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3 h-3 text-[#6b9ab8]" />
                  <span className="text-[11px] font-semibold text-[#6b9ab8]">Soon</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Screen = "home" | "find-country" | "results";

export default function AtlasGame() {
  const [screen, setScreen]           = useState<Screen>("home");
  const [lastResult, setLastResult]   = useState<RoundResult | null>(null);
  const [bestScore, setBestScore]     = useState(0);

  const handleFinish = (result: RoundResult) => {
    setBestScore((prev) => Math.max(prev, result.score));
    setLastResult(result);
    setScreen("results");
  };

  return (
    <>
      <RotatingGlobe dimmed={screen === "find-country"} />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(2,8,20,0.6) 100%)",
        }}
      />
      <div className="relative" style={{ zIndex: 10 }}>
        {screen === "home" && (
          <Home bestScore={bestScore} onPlay={() => setScreen("find-country")} />
        )}
        {screen === "find-country" && (
          <FindCountry onFinish={handleFinish} onHome={() => setScreen("home")} />
        )}
        {screen === "results" && lastResult && (
          <ResultsScreen
            result={lastResult} bestScore={bestScore}
            onPlayAgain={() => setScreen("find-country")}
            onHome={() => setScreen("home")}
          />
        )}
      </div>
    </>
  );
}
