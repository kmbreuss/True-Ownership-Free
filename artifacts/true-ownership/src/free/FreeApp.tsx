import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { AppearanceProvider, useAppearance } from "../appearance/Appearance";
import { inheritedCSS, NewA1Veil, NA1_VEIL_TIMING } from "../App";
import { RealityCheck } from "../reality-check/RealityCheck";
import { loadRCState, saveRCState, type RCState } from "../rcConstants";
import { hydrateNewFlow, flushNewFlowForSignOut, resumeNewFlowAfterSignOutFailure } from "../newFlowSync";
import { accountGeneration } from "../lib/accountIsolation";
import { freeRequest, type Account } from "./api";
import { FreeRoad } from "./FreeRoad";
import { FreeEnding } from "./FreeEnding";
import { FreeCourse } from "./course/FreeCourse";
import "./free.css";

// The free entry never restores a legacy route or developer-preview state.
function keepFreeRoute() {
  sessionStorage.removeItem("to_dev_preview");
  if (location.pathname !== import.meta.env.BASE_URL || location.search || location.hash) {
    history.replaceState(null, "", import.meta.env.BASE_URL);
  }
}
keepFreeRoute();
window.addEventListener("hashchange", keepFreeRoute);
window.addEventListener("popstate", keepFreeRoute);
function Veil({ phase, text }: { phase: "rising" | "hold" | "falling" | "idle"; text: string }) {
  return phase === "idle" ? null : <NewA1Veil phase={phase} text={text} />;
}

function Registration() {
  const { login } = useAuth();
  const [signup, setSignup] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    try {
      if (signup) await freeRequest("/free/signup", { firstName: String(form.get("firstName")).trim(), email, password, consent: form.get("consent") === "on" });
      const failure = await login(email, password);
      if (failure) { setError(signup ? `Your account was created. ${failure}` : failure); if (signup) setSignup(false); }
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="free-registration">
    <p className="free-eyebrow">TRUE OWNERSHIP · FREE</p>
    <h1>Two futures.<br /><em>One choice.</em></h1>
    <p>A little space to see where you are,<br />and where you want to go.</p>
    <form onSubmit={submit}>
      <h2>{signup ? "Welcome in." : "Welcome back."}</h2>
      {signup && <label>First name<input name="firstName" autoComplete="given-name" required maxLength={100}/></label>}
      <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
      <label>Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} maxLength={72}/></label>
      {signup && <><p className="free-password-help">At least 8 characters. Choose your own password.</p><label className="free-consent"><input name="consent" type="checkbox"/><span>Send me my results and occasional emails from Katherine</span></label></>}
      <button className="free-primary" disabled={busy}>{busy ? "Please wait…" : signup ? "Begin my Reality Check →" : "Sign in →"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <button className="free-auth-switch" onClick={() => { setSignup(!signup); setError(""); }}>{signup ? "Already have an account? Sign in" : "New here? Create an account"}</button>
    <p className="free-small">About 10 minutes · just you · saved as you go</p>
  </main>;
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const { logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="free-password-form" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      await flushNewFlowForSignOut();
      const response = await fetch("/api/auth/me/password", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.get("current"), newPassword: data.get("next") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Password could not be changed.");
      // The existing endpoint revokes all sessions. Reload clears stale mounted state.
      location.replace(import.meta.env.BASE_URL);
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { resumeNewFlowAfterSignOutFailure(); setBusy(false); }
  }}>
    <h2>Change password</h2>
    <label>Current password<input type="password" name="current" autoComplete="current-password" required maxLength={72}/></label>
    <label>New password<input type="password" name="next" autoComplete="new-password" required minLength={8} maxLength={72}/></label>
    <p>You'll sign in again with your new password.</p>
    <button disabled={busy} className="free-primary">Save new password</button><button type="button" onClick={onClose}>Cancel</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}

function SignedIn() {
  const { user, refresh } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [state, setState] = useState<RCState | null>(null);
  const [room, setRoom] = useState(false);
  const [resume, setResume] = useState(false);
  const [revision, setRevision] = useState(0);
  const [password, setPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [joinedNow, setJoinedNow] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const stamp = accountGeneration();
    setError("");
    (async () => {
      const [answers, metadata] = await Promise.all([
        fetch("/api/userdata").then(async response => { if (!response.ok) throw new Error("Your answers could not load. Please retry."); return response.json(); }),
        freeRequest<Account>("/free/account", undefined, "GET"),
      ]);
      if (cancelled || stamp !== accountGeneration()) return;
      await hydrateNewFlow(answers, user!.id);
      if (cancelled || stamp !== accountGeneration()) return;
      setAccount(metadata); setState(loadRCState());
    })().catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your account."); });
    return () => { cancelled = true; };
  }, [user!.id, retry]);
  useEffect(() => {
    const update = () => setState(loadRCState());
    window.addEventListener("to-answer-saved", update);
    return () => window.removeEventListener("to-answer-saved", update);
  }, []);
  function showEnding() {
    if (!state?.complete) return;
    const saved = loadRCState();
    // A new-flow answer shows the ending on the course's own last screen.
    saveRCState({ ...saved, step: 13, ...(saved.fcScreen !== undefined ? { fcScreen: 26 } : {}) });
    setRevision(n => n + 1); setResume(true); setRoom(true); setSaved(false);
  }
  if (!account || !state) return <main className="free-loading" role="status">{error ? <><p role="alert">{error}</p><button onClick={() => setRetry(n => n + 1)}>Retry loading my answers</button></> : "Loading your saved road…"}</main>;
  return <>
    <AccountMenu onPassword={() => setPassword(!password)} />
    {password && <PasswordForm onClose={() => setPassword(false)}/>}
    <div className="free-course">
      <FreeRoad state={state} onEnding={showEnding}/>
      <div className="free-course-content">
        {saved && <p className="free-saved-message" role="status">Your Future B is saved. Your road will be here when you're ready.</p>}
        {state.complete && <button className="free-return-ending" onClick={showEnding}>Your Future B · {account.waitlistedAt ? "On the waitlist ✓" : "Join the waitlist →"}</button>}
        <RealityCheck key={`${user!.id}-${revision}`} freeCourse room={room} resume={resume}
          memberName={account.firstName ?? ""} onSaveName={async firstName => {
            await freeRequest("/free/account", { firstName }, "PATCH");
            setAccount(a => a ? { ...a, firstName } : a);
          }}
          onEnter={() => { setRoom(true); setSaved(false); setResume(!!state.startedAt); }}
          onClose={() => { setRoom(false); setState(loadRCState()); }}
          onEntryHall={() => setRoom(false)} onBeginA1={showEnding}
          devTools={null} Veil={Veil} timing={NA1_VEIL_TIMING} course={ctx => <FreeCourse ctx={ctx} account={account} onAccount={setAccount} onJoined={() => setJoinedNow(true)}/>}
          ending={s => <FreeEnding state={s} account={account} onAccount={setAccount} joinedNow={joinedNow} onLater={() => { setRoom(false); setSaved(true); }}/>}
        />
      </div>
    </div>
  </>;
}

function AccountMenu({ onPassword }: { onPassword: () => void }) {
  const { user, logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="free-account-row"><details><summary>Account ▾</summary><div className="free-account-menu">
    <p>{user?.email}</p>
    <button onClick={onPassword}>Change password</button>
    {user?.role === "owner" && <a href="/api/free/leads.csv" download>Export leads CSV</a>}
    <button disabled={busy} onClick={async () => { setError(""); setBusy(true); try { await logout(); } catch (err) { setError(err instanceof Error ? err.message : "Sign out failed."); } finally { setBusy(false); } }}>Sign out</button>
    {error && <p role="alert">{error}</p>}
  </div></details></div>;
}

function Experience() {
  const { user, isLoading } = useAuth();
  const { theme, choose } = useAppearance();
  return <div className="free-app">
    <style>{inheritedCSS}</style>
    <header className="free-header"><a href={import.meta.env.BASE_URL} aria-label="True Ownership Free start">TRUE OWNERSHIP<span>FREE · THE REALITY CHECK</span></a>
      <button className="free-theme" aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"} onClick={() => choose(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀" : "☾"}</button>
    </header>
    {isLoading ? <p className="free-loading" role="status">Opening your road…</p> : user ? <SignedIn key={user.id}/> : <Registration/>}
  </div>;
}
export default function FreeApp() { return <AppearanceProvider><Experience/></AppearanceProvider>; }
