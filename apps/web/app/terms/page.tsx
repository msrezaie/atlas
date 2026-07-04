import { MarketingPage } from "../components/marketing/MarketingPage";

export const metadata = { title: "Terms · Atlas" };

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms of Use"
      lead="Placeholder terms for the demo — a full version will follow."
    >
      <p>
        Atlas is provided as-is for fun and learning. By using it you agree to
        play nicely and not to misuse or attempt to disrupt the service.
      </p>
      <h2>Content</h2>
      <p>
        Country facts are compiled for educational, illustrative purposes and may
        contain simplifications or errors. Flag images are served from a
        third-party provider. Nothing here should be treated as authoritative
        reference data.
      </p>
      <h2>Changes</h2>
      <p>
        As Atlas grows beyond this demo — with accounts, multiplayer and
        leaderboards — these terms will be expanded accordingly.
      </p>
    </MarketingPage>
  );
}
