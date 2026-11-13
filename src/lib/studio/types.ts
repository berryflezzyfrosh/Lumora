export type MediaKind = 'video' | 'audio' | 'image' | 'text';
export type TrackKind = 'video' | 'audio';
export type ClipAnimation = 'none' | 'zoom-in' | 'zoom-out' | 'slide-left' | 'slide-right';
export type ClipEffect = 'none' | 'vintage' | 'monochrome' | 'warm' | 'cool' | 'soft-focus';
export type ClipTransition = 'none' | 'fade' | 'wipe-left' | 'zoom';

export type ClipKeyframe = {
  time: number;
  scale: number;
  rotation: number;
  opacity: number;
};

export type ClipSettings = {
  scale: number;
  rotation: number;
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  fadeIn: number;
  fadeOut: number;
  animation: ClipAnimation;
  effect: ClipEffect;
  transitionIn: ClipTransition;
  transitionDuration: number;
  volume: number;
  keyframes: ClipKeyframe[];
};

export const DEFAULT_CLIP_SETTINGS: ClipSettings = {
  scale: 100,
  rotation: 0,
  opacity: 100,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  fadeIn: 0,
  fadeOut: 0,
  animation: 'none',
  effect: 'none',
  transitionIn: 'none',
  transitionDuration: 0.5,
  volume: 100,
  keyframes: [],
};

export type MediaItem = {
  id: string;
  name: string;
  kind: MediaKind;
  duration: number;
  path: string;
  text?: string;
  textColor?: string;
  fontSize?: number;
};

export type Track = {
  id: string;
  kind: TrackKind;
  name: string;
};

export type Clip = {
  id: string;
  mediaId: string;
  trackId: string;
  start: number;
  offset: number;
  duration: number;
  settings?: ClipSettings;
};

export function trackKindForMedia(kind: MediaKind): TrackKind {
  return kind === 'audio' ? 'audio' : 'video';
}

export type TimelineDoc = {
  version: 1;
  media: MediaItem[];
  tracks: Track[];
  clips: Clip[];
};

export const MIN_CLIP_DURATION = 0.1;
export const FRAME_DURATION = 1 / 30;

export function createEmptyDoc(): TimelineDoc {
  return {
    version: 1,
    media: [],
    tracks: [
      { id: 'v2', kind: 'video', name: 'Video 2' },
      { id: 'v1', kind: 'video', name: 'Video 1' },
      { id: 'a1', kind: 'audio', name: 'Audio 1' },
    ],
    clips: [],
  };
}

export function isTimelineDoc(value: unknown): value is TimelineDoc {
  if (!value || typeof value !== 'object') return false;
  const doc = value as Partial<TimelineDoc>;
  return (
    doc.version === 1 &&
    Array.isArray(doc.media) &&
    Array.isArray(doc.tracks) &&
    Array.isArray(doc.clips)
  );
}
