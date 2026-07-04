import type { Region } from "@atlas/types";

export type GameMode = "find" | "trivia" | "flag";

/** Solo (beat your own best) vs versus (1v1 race). */
export type PlayMode = "solo" | "versus";

/** A configured round, handed from a hub/config screen to the play screen. */
export interface RoundConfig {
  mode: GameMode;
  play: PlayMode;
  region: Region;
  roundLen: number;
}

export const GAME_MODE_META: Record<
  GameMode,
  { title: string; short: string; description: string }
> = {
  find: {
    title: "Find the Country",
    short: "Find",
    description: "Locate the prompted country on the map",
  },
  trivia: {
    title: "Geo Trivia",
    short: "Trivia",
    description: "AI-generated country challenges",
  },
  flag: {
    title: "Flag Guesser",
    short: "Flags",
    description: "Match flags to countries, or type the name",
  },
};
