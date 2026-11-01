import React from "react";

export const A1_END_SEAL = "Clarity is the first thing you own.";
export function Claimed() {
  return <section className="a1-end-claimed">
    <div className="a1-end-star" aria-hidden="true">★</div>
    <p className="a1-end-label a1-end-eyebrow">A1 · ALL IN · CLAIMED</p>
    <h1 className="a1-end-title">You know who you are now. That's how Future B starts.</h1>
    <p className="a1-end-seal">{A1_END_SEAL}</p>
    <div className="a1-end-next">
      <p className="a1-end-label">NEXT · A2 · ALIGN</p>
      <p>See where your time and money really go, and where Future B needs them to go.</p>
    </div>
  </section>;
}
