import React, { useState } from "react";
import { isDevPreview } from "../devPreview";

export function RCDevReset() {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (!import.meta.env.DEV) return null;
  return <div>
    <button disabled={busy || isDevPreview()} onClick={async () => {
      if (!window.confirm("Reset Reality Check for your signed-in account? This clears only to_rc_state_v1 and to_setaside_v1, including saved RC rounds. No other progress will be changed.")) return;
      setBusy(true); setError("");
      try {
        const { resetRealityCheckForDev } = await import("../newFlowSync");
        await resetRealityCheckForDev();
        window.location.reload();
      } catch (e) { setError(e instanceof Error ? e.message : "Reset failed."); setBusy(false); }
    }}>{busy ? "Resetting…" : "Reset Reality Check"}</button>
    {isDevPreview() && <p>Exit Preview to reset your account’s Reality Check.</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
