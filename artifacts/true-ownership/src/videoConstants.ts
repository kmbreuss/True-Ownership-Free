// Ship 5.8 · Single source of truth for all True Ownership video metadata.
// Each surface in the ?newA1=1 app maps to one entry here. Only surfaces
// with a populated vimeoId are "ready" — the rest render the same card UI
// in placeholder mode (play click shows a "Video coming soon" toast). As
// Katherine records each video, only this file changes — no UI work.

import { RC_INTRO_VIDEO_URL, RC_EYES_AUDIO_URL } from "./rcConstants";

export type VideoSurface =
  | "entry-hall"
  | "rc-intro"
  | "rc-eyes"
  | "framework"
  | "a1-hub"
  | "m1-hub"
  | "m2-hub"
  | "m3-hub"
  | "m4-hub";

export type MediaType = "video" | "audio";

export type VideoMeta = {
  id: string; // unique identifier
  surface: VideoSurface; // which surface in the app it renders on
  number: string; // "00" | "01" | "02" ... — displayed as italic gold eyebrow
  title: string; // displayed title on the card
  speaker: string; // currently always "Katherine"
  durationLabel: string; // "7:43" | "45 sec" — shows in muted meta line
  mediaType: MediaType; // "video" — drives player choice (audio is future)
  vimeoId: string | null; // Vimeo numeric ID, e.g. "1198147066"
  videoUrl?: string | null; // Existing native-video source, e.g. Reality Check.
  vimeoHash: string | null; // Unlock hash for private videos, e.g. "92f1bb6e8a"
  audioUrl: string | null; // future: local /audio path for audio variants
  posterUrl: string | null; // future: thumbnail/hero photo
  transcript: string | null; // future: collapsible transcript text
};

export const VIDEOS: Record<VideoSurface, VideoMeta> = {
  "entry-hall": {
    id: "entry-hall-welcome",
    surface: "entry-hall",
    number: "00",
    title: "Welcome to True Ownership",
    speaker: "Katherine",
    durationLabel: "7:43",
    mediaType: "video",
    vimeoId: "1198160228",
    vimeoHash: "65896b5663",
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
  "rc-intro": {
    id: "rc-introduction", surface: "rc-intro", number: "", title: "Katherine introduces the Reality Check",
    speaker: "Katherine", durationLabel: "2 min", mediaType: "video",
    vimeoId: null, vimeoHash: null, videoUrl: RC_INTRO_VIDEO_URL || null,
    audioUrl: null, posterUrl: null, transcript: null,
  },
  "rc-eyes": {
    id: "rc-close-your-eyes", surface: "rc-eyes", number: "", title: "Close your eyes",
    speaker: "Katherine", durationLabel: "0:45", mediaType: "audio",
    vimeoId: null, vimeoHash: null, audioUrl: RC_EYES_AUDIO_URL || null,
    posterUrl: null, transcript: null,
  },
  framework: {
    id: "framework-5a",
    surface: "framework",
    number: "01",
    title: "Walk your spine — the 5A Framework",
    speaker: "Katherine",
    durationLabel: "6:28",
    mediaType: "video",
    vimeoId: "1198243013",
    vimeoHash: "705008f567",
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
  "a1-hub": {
    id: "a1-hub-orientation",
    surface: "a1-hub",
    number: "02",
    title: "Before you begin — how to show up",
    speaker: "Katherine",
    durationLabel: "45 sec",
    mediaType: "video",
    vimeoId: null,
    vimeoHash: null,
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
  "m1-hub": {
    id: "m1-purpose-intro",
    surface: "m1-hub",
    number: "03",
    title: "Name the why",
    speaker: "Katherine",
    durationLabel: "45 sec",
    mediaType: "video",
    vimeoId: null,
    vimeoHash: null,
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
  "m2-hub": {
    id: "m2-vision-intro",
    surface: "m2-hub",
    number: "04",
    title: "See it before you build it",
    speaker: "Katherine",
    durationLabel: "45 sec",
    mediaType: "video",
    vimeoId: null,
    vimeoHash: null,
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
  "m3-hub": {
    id: "m3-identity-intro",
    surface: "m3-hub",
    number: "05",
    title: "What's already true",
    speaker: "Katherine",
    durationLabel: "45 sec",
    mediaType: "video",
    vimeoId: null,
    vimeoHash: null,
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
  "m4-hub": {
    id: "m4-values-intro",
    surface: "m4-hub",
    number: "06",
    title: "Get the order right",
    speaker: "Katherine",
    durationLabel: "45 sec",
    mediaType: "video",
    vimeoId: null,
    vimeoHash: null,
    audioUrl: null,
    posterUrl: null,
    transcript: null,
  },
};

/**
 * Whether a video is ready to play (vs. placeholder mode where the card
 * shows but the play button only toasts "Video coming soon").
 */
export function isVideoReady(meta: VideoMeta): boolean {
  if (meta.mediaType === "video") return !!(meta.vimeoId?.trim() || meta.videoUrl?.trim());
  if (meta.mediaType === "audio") return !!meta.audioUrl?.trim();
  return false;
}

/**
 * Build the Vimeo embed URL from meta. Returns null if the video isn't
 * ready (placeholder mode). The `?h=` unlock hash is required for private
 * videos — without it the embed fails with "video unavailable".
 */
export function getVimeoEmbedUrl(meta: VideoMeta): string | null {
  if (meta.vimeoId === null) return null;
  const hashParam = meta.vimeoHash ? `?h=${meta.vimeoHash}` : "";
  return `https://player.vimeo.com/video/${meta.vimeoId}${hashParam}`;
}
