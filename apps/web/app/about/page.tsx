import { MarketingPage } from "../components/marketing/MarketingPage";

export const metadata = { title: "About · Atlas" };

export default function AboutPage() {
  return (
    <MarketingPage
      title="About Atlas"
      lead="Atlas is a geography game about seeing the whole world — not memorising it for a test."
    >
      <p>
        Atlas turns learning world geography into something you actually want to
        do. Locate countries on a live, zoomable map, answer AI-generated trivia,
        match flags to names, race another player head-to-head, or simply wander
        the globe and read up on any of the 198 countries.
      </p>
      <h2>Three ways to play</h2>
      <ul>
        <li>
          <strong>Solo</strong> — practice at your own pace across Find the
          Country, Geo Trivia and Flag Guesser, and beat your best score.
        </li>
        <li>
          <strong>1v1 Online</strong> — get matched against another player and
          race through ten worldwide rounds; fastest correct answer wins.
        </li>
        <li>
          <strong>Explore</strong> — open any country for its flag, capital,
          languages, landmarks, colonial history and notable facts.
        </li>
      </ul>
      <p>
        This is an in-progress demo. Accounts, live multiplayer and leaderboards
        are illustrative for now.
      </p>
    </MarketingPage>
  );
}
