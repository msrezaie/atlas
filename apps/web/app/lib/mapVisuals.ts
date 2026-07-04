// Shared water rendering between the game map (WorldMapGame) and the
// Learning Mode explorer map (LearningMap) — both are flat MapLibre
// GeoJSON maps over the same ocean tone, so the pattern is a single
// source of truth rather than two copies that can drift apart.
export const WATER = "#70D6EB";

/**
 * A small tileable "wavy water" texture — the water base tone plus faint
 * sine-wave rows, drawn once and registered as a MapLibre background-pattern
 * (patterns replace background-color, so the base tone is baked into the
 * tile itself). Tile size (28) keeps the row spacing and wavelength in a
 * clean ratio so it tiles seamlessly in both directions.
 */
export function buildWavePattern(dpr: number): ImageData {
  const size = 28;
  const px = Math.round(size * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = WATER;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1.5;
  const rows = 3;
  const rowGap = size / rows;
  const wavelength = size / 2;
  const amplitude = 3.5;

  for (let r = 0; r < rows; r++) {
    const y = rowGap * r + rowGap / 2;
    ctx.beginPath();
    for (let x = 0; x <= size; x++) {
      const yy = y + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, px, px);
}
