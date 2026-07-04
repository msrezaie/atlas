import { MarketingPage } from "../components/marketing/MarketingPage";

export const metadata = { title: "How to Play · Atlas" };

export default function HowToPlayPage() {
  return (
    <MarketingPage
      title="How to Play"
      lead="Pick a mode from the home screen and you're in — here's what to expect."
    >
      <h2>Find the Country</h2>
      <p>
        You are given a country name (and its flag). Click it on the map. Answer
        fast for more points — up to 4 for a quick answer, fewer as the 10-second
        timer runs down. Solo lets you pick a region and how many rounds.
      </p>
      <h2>Geo Trivia</h2>
      <p>
        Answer AI-generated questions (largest population, official language,
        capital city and more) by picking the right country&apos;s flag.
      </p>
      <h2>Flag Guesser</h2>
      <p>
        Match a flag to its country — sometimes by choosing from a set of flags,
        sometimes by typing the country&apos;s name.
      </p>
      <h2>1v1 Online</h2>
      <p>
        Every 1v1 match is a fixed, fair, ten-country worldwide round. There&apos;s
        no setup — just get matched and race. The fastest correct answer takes
        each round.
      </p>
      <h2>Explore</h2>
      <p>
        Browse the world map or the country list and open any country to read its
        details. Selecting a country zooms the map to fit it; regions frame the
        whole continent.
      </p>
    </MarketingPage>
  );
}
