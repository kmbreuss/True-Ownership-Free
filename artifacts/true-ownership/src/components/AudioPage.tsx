import type { ReactNode } from "react";
import { VIDEOS, isVideoReady, type VideoMeta, type VideoSurface } from "../videoConstants";
import "./audio-page.css";

// The registry remains the source of truth. Filling any existing empty source
// makes that recording appear here without maintaining a second playlist.
const journeyOrder: VideoSurface[] = ["entry-hall", "rc-intro", "rc-eyes", "framework", "a1-hub", "m4-hub", "m3-hub", "m1-hub", "m2-hub"];
const locations: Record<VideoSurface, string> = {
  "rc-intro": "Reality Check · Introduction", "rc-eyes": "Reality Check · Close your eyes",
  "entry-hall": "Welcome · Entry Hall", framework: "Framework · The 5As",
  "a1-hub": "A1 · All In", "m4-hub": "A1 · Values", "m3-hub": "A1 · Identity",
  "m1-hub": "A1 · Purpose", "m2-hub": "A1 · Vision",
};

export function availableRecordings(canOpen: (surface: VideoSurface) => boolean, registry = VIDEOS): VideoMeta[] {
  return Object.values(registry).filter(meta => isVideoReady(meta) && canOpen(meta.surface))
    .sort((a, b) => journeyOrder.indexOf(a.surface) - journeyOrder.indexOf(b.surface));
}

export function AudioPage({ canOpen, renderPlayer }: {
  canOpen: (surface: VideoSurface) => boolean;
  renderPlayer: (surface: VideoSurface) => ReactNode;
}) {
  const recordings = availableRecordings(canOpen);
  return <main className="na1-root ap-root">
    <div className="na1-shell ap-shell">
      <h1>Katherine’s recordings</h1>
      <ol className="ap-recordings">
        {recordings.map(meta => <li key={meta.id} data-recording={meta.surface}>
          <p className="ap-location">{locations[meta.surface]}</p>
          {renderPlayer(meta.surface)}
        </li>)}
      </ol>
      <p className="ap-more">More of Katherine’s recordings are on the way.</p>
    </div>
  </main>;
}
