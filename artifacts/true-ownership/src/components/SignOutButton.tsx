import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../lib/auth-context";

export function SignOutButton({ className = "" }: { className?: string }) {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try { await logout(); }
    catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed. Please try again.");
      setBusy(false);
    }
  };
  return <>
    <button type="button" className={className} onClick={signOut} disabled={busy}>Sign out</button>
    {error && <p className="pn-signout-error" role="alert">{error}</p>}
    {busy && createPortal(<div className="pn-signout-busy" role="dialog" aria-modal="true" aria-label="Signing out">
      <p role="status">Saving your answers and signing out…</p>
    </div>, document.body)}
  </>;
}
