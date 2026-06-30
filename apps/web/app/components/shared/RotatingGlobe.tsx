"use client";

import { useEffect, useRef } from "react";
import { geoOrthographic, geoPath, geoGraticule } from "d3-geo";
import { GEO_URL_GLOBE } from "@atlas/data";

export function RotatingGlobe({ dimmed }: { dimmed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const rotRef    = useRef(-30);
  const rafRef    = useRef<number>(0);
  const stars     = useRef<{ x: number; y: number; r: number; a: number }[]>([]);

  useEffect(() => {
    fetch(GEO_URL_GLOBE)
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
      canvas.width  = width  * dpr;
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
      const path   = geoPath(proj, ctx);
      const sphere = { type: "Sphere" } as unknown as GeoJSON.GeometryObject;

      const og = ctx.createRadialGradient(cx - radius * .25, cy - radius * .25, radius * .05, cx, cy, radius);
      og.addColorStop(0, "#0d3060");
      og.addColorStop(1, "#020b18");
      ctx.beginPath(); path(sphere); ctx.fillStyle = og; ctx.fill();

      ctx.beginPath();
      path(geoGraticule()() as unknown as GeoJSON.GeometryObject);
      ctx.strokeStyle = "rgba(0,180,155,0.07)";
      ctx.lineWidth   = 0.5 * dpr;
      ctx.stroke();

      if (worldRef.current) {
        const countries = worldRef.current as GeoJSON.FeatureCollection;
        ctx.beginPath();
        path(countries as unknown as GeoJSON.GeometryObject);
        ctx.fillStyle   = "rgba(14,55,115,0.8)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,195,168,0.2)";
        ctx.lineWidth   = 0.5 * dpr;
        ctx.stroke();
      }

      ctx.beginPath(); path(sphere);
      ctx.strokeStyle = "rgba(0,200,168,0.3)";
      ctx.lineWidth   = 1.8 * dpr;
      ctx.stroke();

      const hg = ctx.createRadialGradient(cx - radius * .32, cy - radius * .32, 0, cx, cy, radius);
      hg.addColorStop(0,    "rgba(130,210,255,0.09)");
      hg.addColorStop(0.45, "rgba(0,0,0,0)");
      ctx.beginPath(); path(sphere); ctx.fillStyle = hg; ctx.fill();

      rotRef.current   += 0.035;
      rafRef.current    = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
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