import { MarketingPage } from "../components/marketing/MarketingPage";

export const metadata = { title: "Privacy · Atlas" };

export default function PrivacyPage() {
  return (
    <MarketingPage
      title="Privacy"
      lead="A short, plain-language note — to be replaced with a full policy later."
    >
      <p>
        Atlas is currently a demo. You can play the games without an account, and
        your best scores are stored locally in your own browser — they are not
        sent to a server.
      </p>
      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Best scores</strong> — kept in your browser&apos;s local storage
          on your device. Clearing your browser data removes them.
        </li>
        <li>
          <strong>Sign-in</strong> — the sign-in screen is illustrative in this
          demo and does not create a real account or collect credentials.
        </li>
      </ul>
      <p>
        When Atlas adds real accounts and multiplayer, this page will be updated
        with a complete privacy policy describing what is collected and why.
      </p>
    </MarketingPage>
  );
}
