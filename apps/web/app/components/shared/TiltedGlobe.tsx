"use client";

import { useEffect, useRef } from "react";
import { geoOrthographic, geoPath, geoGraticule } from "d3-geo";
import { GEO_URL_GLOBE } from "@atlas/data";

export type GlobeAnchor = "bottom" | "right" | "left" | "center" | "top";

export interface TiltedGlobeProps {
  /** Which edge of the parent the globe's center is pushed past, so only a
   *  slice shows — like a horizon seen from orbit. Changing this eases the
   *  globe's framing to the new anchor instead of snapping. @default "bottom" */
  anchor?: GlobeAnchor;
  spin?: boolean;
  /** GeoJSON FeatureCollection URL. @default GEO_URL_GLOBE */
  src?: string;
  className?: string;
}

interface Frame {
  r: number;
  tx: number;
  ty: number;
}

/** Target scale + translate for a given anchor, in the current viewport. */
function targetFrame(anchor: GlobeAnchor, W: number, H: number): Frame {
  switch (anchor) {
    case "bottom":
      // Big globe pushed below the viewport so only the top cap shows —
      // the horizon of a planet seen from orbit.
      return { r: Math.max(W * 0.62, H * 0.95), tx: W * 0.5, ty: 0 } as Frame; // ty set below (depends on r)
    case "right": {
      const r = Math.min(W, H) * 0.42;
      return { r, tx: W + r * 0.12, ty: H * 0.62 };
    }
    case "left": {
      const r = Math.min(W, H) * 0.42;
      return { r, tx: -r * 0.12, ty: H * 0.62 };
    }
    case "center":
    default: {
      const r = Math.min(W, H) * 0.42;
      return { r, tx: W * 0.5, ty: H * 0.5 };
    }
  }
}
// `bottom`'s ty depends on r (H + r * 0.42), computed after r is known.
function resolveTarget(anchor: GlobeAnchor, W: number, H: number): Frame {
  const f = targetFrame(anchor, W, H);
  if (anchor === "bottom") f.ty = H + f.r * 0.42;
  return f;
}

/**
 * d3 geoOrthographic canvas, anchored past an edge so only a slice of the
 * globe is visible — an "earth from space" horizon. Slow auto-spin never
 * stops or resets; only the framing (scale + position) eases toward a new
 * anchor's target when `anchor` changes, so screen transitions read as one
 * continuous globe rather than a cut.
 */
export function TiltedGlobe({
  anchor = "bottom",
  spin = true,
  src = GEO_URL_GLOBE,
  className,
}: TiltedGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const rafRef = useRef(0);
  const anchorRef = useRef(anchor);
  const spinRef = useRef(spin);

  useEffect(() => {
    anchorRef.current = anchor;
    spinRef.current = spin;
  }, [anchor, spin]);

  useEffect(() => {
    let alive = true;
    fetch(src)
      .then((r) => r.json())
      .then((land) => {
        if (alive) landRef.current = land as GeoJSON.FeatureCollection;
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src]);

  // Mounts once — never re-runs when `anchor`/`spin` change, so the canvas,
  // lambda spin phase, and starfield persist across screen navigation. The
  // frame (scale/position) eases toward whatever `anchorRef` currently
  // points at every tick, which is what makes the transition smooth.
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let W = 0,
      H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lambda = 30;

    const projection = geoOrthographic().clipAngle(90).precision(0.4);
    const path = geoPath(projection, ctx);
    const sphere = { type: "Sphere" } as unknown as GeoJSON.GeometryObject;
    const graticule = geoGraticule()();

    // Animated framing — eases toward resolveTarget(anchorRef.current) every
    // tick. Starts matching the initial anchor so there's no pop-in.
    const frame: Frame = { r: 0, tx: 0, ty: 0 };
    let frameInit = false;

    function resize() {
      const rect = parent!.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!frameInit) {
        const t = resolveTarget(anchorRef.current, W, H);
        frame.r = t.r;
        frame.tx = t.tx;
        frame.ty = t.ty;
        frameInit = true;
      }
    }

    let stars: { x: number; y: number; r: number; a: number }[] = [];
    function seedStars() {
      stars = Array.from({ length: Math.round((W * H) / 5200) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.5 + 0.2,
      }));
    }

    function draw() {
      const land = landRef.current;

      // Ease the framing toward the current anchor's target every frame.
      // Exponential smoothing (not time-based) — simple, frame-rate-stable
      // enough at 60fps, and naturally re-targets mid-flight if anchor
      // changes again before settling.
      const target = resolveTarget(anchorRef.current, W, H);
      const ease = 0.055;
      frame.r += (target.r - frame.r) * ease;
      frame.tx += (target.tx - frame.tx) * ease;
      frame.ty += (target.ty - frame.ty) * ease;

      projection.scale(frame.r).translate([frame.tx, frame.ty]);
      projection.rotate([lambda, -20, -8]); // fixed axial tilt
      const [cx, cy] = projection.translate();
      const R = projection.scale();

      ctx!.clearRect(0, 0, W, H);

      for (const s of stars) {
        ctx!.globalAlpha = s.a;
        ctx!.fillStyle = "#dbeafe";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      const glow = ctx!.createRadialGradient(
        cx,
        cy,
        R * 0.86,
        cx,
        cy,
        R * 1.16,
      );
      glow.addColorStop(0, "rgba(0,200,168,0.28)");
      glow.addColorStop(0.5, "rgba(0,200,168,0.10)");
      glow.addColorStop(1, "rgba(0,200,168,0)");
      ctx!.fillStyle = glow;
      ctx!.beginPath();
      ctx!.arc(cx, cy, R * 1.16, 0, 2 * Math.PI);
      ctx!.fill();

      const ocean = ctx!.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.5,
        R * 0.1,
        cx,
        cy,
        R,
      );
      ocean.addColorStop(0, "#0d3a52");
      ocean.addColorStop(0.55, "#082742");
      ocean.addColorStop(1, "#03101f");
      ctx!.beginPath();
      path(sphere);
      ctx!.fillStyle = ocean;
      ctx!.fill();

      ctx!.beginPath();
      path(graticule as unknown as GeoJSON.GeometryObject);
      ctx!.strokeStyle = "rgba(0,200,168,0.12)";
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      if (land) {
        ctx!.beginPath();
        path(land as unknown as GeoJSON.GeometryObject);
        ctx!.fillStyle = "#12406b";
        ctx!.fill();
        ctx!.strokeStyle = "rgba(92,242,216,0.35)";
        ctx!.lineWidth = 0.4;
        ctx!.stroke();
      }

      // terminator shading (day/night) — dark sweep on the right
      const term = ctx!.createRadialGradient(
        cx - R * 0.4,
        cy - R * 0.55,
        R * 0.2,
        cx,
        cy,
        R,
      );
      term.addColorStop(0, "rgba(2,11,24,0)");
      term.addColorStop(0.7, "rgba(2,11,24,0)");
      term.addColorStop(1, "rgba(2,11,24,0.55)");
      ctx!.beginPath();
      path(sphere);
      ctx!.fillStyle = term;
      ctx!.fill();

      // crisp rim
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx!.strokeStyle = "rgba(92,242,216,0.45)";
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }

    function tick() {
      if (spinRef.current && !reduced) lambda += 0.06;
      draw();
      rafRef.current = requestAnimationFrame(tick);
    }

    function onResize() {
      resize();
      seedStars();
      draw();
    }
    resize();
    seedStars();
    draw();

    let ro: ResizeObserver | undefined;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(onResize);
      ro.observe(parent);
    } else {
      window.addEventListener("resize", onResize);
    }

    // Always run the loop (even if `spin` starts false) since the framing
    // easing needs frames too; `spinRef` just gates the lambda increment.
    if (!reduced) rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", position: "absolute", inset: 0 }}
    />
  );
}
