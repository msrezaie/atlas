"use client";

import type { Region } from "@atlas/types";
import { REGIONS } from "@atlas/data";

export function RegionFilter({ value, onChange }: { value: Region; onChange: (r: Region) => void }) {
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