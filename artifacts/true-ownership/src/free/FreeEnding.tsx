import { useState } from "react";
import type { RCState } from "../rcConstants";
import { flushNewFlowForSignOut, resumeNewFlowAfterSignOutFailure } from "../newFlowSync";
import { freeRequest, type Account } from "./api";
import { RoadAhead, FreeRoad } from "./FreeRoad";
import { saveFutureB } from "./poster";

export function FreeEnding({ state, account, onAccount, onLater, joinedNow = false }: {
  state: RCState; account: Account; onAccount: (a: Account) => void; onLater: () => void; joinedNow?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(joinedNow);
  async function save(action: "join" | "poster" | "later") {
    setBusy(true); setError("");
    try {
      // Reuse the existing flush barrier: success means actual account persistence.
      await flushNewFlowForSignOut();
      if (action === "join") {
        onAccount(await freeRequest<Account>("/free/waitlist"));
        setJoined(true);
      } else if (action === "poster") await saveFutureB(state, account.firstName ?? "");
      else onLater();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save. Please try again."); }
    finally { resumeNewFlowAfterSignOutFailure(); setBusy(false); }
  }
  return <section className="free-ending" aria-label="Your Future B and waitlist">
    <FreeRoad state={state} onEnding={() => {}} compact />
    <p className="rc-eyebrow">YOU CHOSE FUTURE B</p>
    {state.futureB1.doing.trim() && <blockquote>“{state.futureB1.doing}”</blockquote>}
    <h2>Willpower won't get you there. This will.</h2>
    {state.fcScreen === undefined && <RoadAhead />}
    <p className="free-opens-copy">The full True Ownership path opens soon. Your road and your answers are saved and waiting.</p>
    {account.waitlistedAt ? <div role="status"><p className="free-waitlist-status">On the waitlist ✓</p>
      {joined && <p>You're on the list. We'll let you know the moment your road opens.</p>}</div>
      : <button className="free-primary" disabled={busy || !state.complete} onClick={() => void save("join")}>Join the waitlist →</button>}
    <button className="free-poster-button" disabled={busy} onClick={() => void save("poster")}>Save my Future B</button>
    <button className="free-later" disabled={busy} onClick={() => void save("later")}>Not yet. Keep my Future B saved</button>
    {busy && <p role="status">Saving…</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
