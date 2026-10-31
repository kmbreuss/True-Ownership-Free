import React, { useState } from "react";
import { RC_INTRO_VIDEO_URL } from "../rcConstants";

export function RCStartVideo() {
  const [playing, setPlaying] = useState(false);
  return <aside className="rc-start-video">
    {playing && RC_INTRO_VIDEO_URL ? <video controls autoPlay src={RC_INTRO_VIDEO_URL} aria-label="Katherine introduces the Reality Check" /> :
      <div className="rc-video-split"><div>Person A</div><div>Person B</div>
        {RC_INTRO_VIDEO_URL && <button aria-label="Play Katherine's introduction" onClick={() => setPlaying(true)}>▶</button>}
      </div>}
    <p className="rc-eyebrow">WATCH FIRST · KATHERINE · 2 MIN</p>
    <p><em>Most of us are both. Which one shows up more?</em></p>
  </aside>;
}
