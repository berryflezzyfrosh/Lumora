import {
  DEFAULT_CLIP_SETTINGS,
  MIN_CLIP_DURATION,
  type Clip,
  type ClipKeyframe,
  type ClipSettings,
  type MediaItem,
  type TimelineDoc,
  trackKindForMedia,
} from '@/lib/studio/types';

export type EditorState = {
  doc: TimelineDoc;
  past: TimelineDoc[];
  future: TimelineDoc[];
};

export type EditorAction =
  | { type: 'load'; doc: TimelineDoc }
  | { type: 'addMedia'; media: MediaItem }
  | {
      type: 'updateMediaText';
      mediaId: string;
      updates: Partial<Pick<MediaItem, 'text' | 'textColor' | 'fontSize'>>;
    }
  | {
      type: 'insertClip';
      mediaId: string;
      trackId: string;
      start: number;
      clipId?: string;
      offset?: number;
      duration?: number;
    }
  | { type: 'batch'; actions: EditorAction[] }
  | { type: 'split'; clipId: string; time: number }
  | { type: 'trimStart'; clipId: string; time: number }
  | { type: 'trimEnd'; clipId: string; time: number }
  | { type: 'move'; clipId: string; trackId: string; start: number }
  | { type: 'updateSettings'; clipId: string; settings: Partial<ClipSettings>; keyframe?: ClipKeyframe }
  | { type: 'upsertKeyframe'; clipId: string; keyframe: ClipKeyframe }
  | { type: 'removeKeyframe'; clipId: string; time: number }
  | { type: 'duplicate'; clipId: string }
  | { type: 'delete'; clipIds: string[] }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 100;
const MAX_STILL_CLIP_DURATION = 60 * 60;

export function createEditorState(doc: TimelineDoc): EditorState {
  return { doc, past: [], future: [] };
}

function newId() {
  return crypto.randomUUID();
}

function endOf(clip: Clip) {
  return clip.start + clip.duration;
}

function findClip(doc: TimelineDoc, clipId: string) {
  return doc.clips.find((clip) => clip.id === clipId);
}

function findMedia(doc: TimelineDoc, mediaId: string) {
  return doc.media.find((item) => item.id === mediaId);
}

function replaceClip(doc: TimelineDoc, updated: Clip): TimelineDoc {
  return { ...doc, clips: doc.clips.map((clip) => (clip.id === updated.id ? updated : clip)) };
}

function splitClip(doc: TimelineDoc, clipId: string, time: number): TimelineDoc {
  const clip = findClip(doc, clipId);
  if (!clip) return doc;
  const cut = time - clip.start;
  if (cut <= MIN_CLIP_DURATION || cut >= clip.duration - MIN_CLIP_DURATION) return doc;

  const left: Clip = { ...clip, duration: cut };
  const right: Clip = {
    ...clip,
    id: newId(),
    start: time,
    offset: clip.offset + cut,
    duration: clip.duration - cut,
  };
  return { ...doc, clips: doc.clips.flatMap((item) => (item.id === clipId ? [left, right] : [item])) };
}

function trimClipStart(doc: TimelineDoc, clipId: string, time: number): TimelineDoc {
  const clip = findClip(doc, clipId);
  if (!clip) return doc;
  const media = findMedia(doc, clip.mediaId);
  if (!media) return doc;
  const isImage = media.kind === 'image';
  const earliest = isImage ? 0 : Math.max(0, clip.start - clip.offset);
  const newStart = Math.min(Math.max(time, earliest), endOf(clip) - MIN_CLIP_DURATION);
  if (newStart === clip.start) return doc;
  return replaceClip(doc, {
    ...clip,
    start: newStart,
    offset: isImage ? clip.offset : clip.offset + (newStart - clip.start),
    duration: endOf(clip) - newStart,
  });
}

function trimClipEnd(doc: TimelineDoc, clipId: string, time: number): TimelineDoc {
  const clip = findClip(doc, clipId);
  const media = clip && findMedia(doc, clip.mediaId);
  if (!clip || !media) return doc;
  const maxDuration = media.kind === 'image' ? MAX_STILL_CLIP_DURATION : media.duration - clip.offset;
  const newDuration = Math.min(Math.max(time - clip.start, MIN_CLIP_DURATION), maxDuration);
  if (newDuration === clip.duration) return doc;
  return replaceClip(doc, { ...clip, duration: newDuration });
}

function moveClip(doc: TimelineDoc, clipId: string, trackId: string, start: number): TimelineDoc {
  const clip = findClip(doc, clipId);
  if (!clip) return doc;
  const track = doc.tracks.find((item) => item.id === trackId);
  const media = findMedia(doc, clip.mediaId);
  if (!track || !media || track.kind !== trackKindForMedia(media.kind)) return doc;
  return replaceClip(doc, { ...clip, trackId, start: Math.max(0, start) });
}

function updateSettings(
  doc: TimelineDoc,
  clipId: string,
  settings: Partial<ClipSettings>,
  keyframe?: ClipKeyframe,
): TimelineDoc {
  const clip = findClip(doc, clipId);
  if (!clip) return doc;
  const nextSettings = { ...DEFAULT_CLIP_SETTINGS, ...clip.settings, ...settings };
  if (keyframe) {
    nextSettings.keyframes = [
      ...nextSettings.keyframes.filter((item) => Math.abs(item.time - keyframe.time) > 1 / 60),
      keyframe,
    ].sort((left, right) => left.time - right.time);
  }
  if (!keyframe && Object.keys(settings).every((key) => {
    const setting = key as keyof ClipSettings;
    return nextSettings[setting] === clip.settings?.[setting];
  })) return doc;
  return replaceClip(doc, {
    ...clip,
    settings: nextSettings,
  });
}

function updateMediaText(
  doc: TimelineDoc,
  mediaId: string,
  updates: Partial<Pick<MediaItem, 'text' | 'textColor' | 'fontSize'>>,
): TimelineDoc {
  const media = findMedia(doc, mediaId);
  if (!media || media.kind !== 'text') return doc;
  if (Object.entries(updates).every(([key, value]) => media[key as keyof typeof media] === value)) return doc;
  return {
    ...doc,
    media: doc.media.map((item) => item.id === mediaId ? { ...item, ...updates } : item),
  };
}

function updateKeyframe(doc: TimelineDoc, clipId: string, keyframe: ClipKeyframe | null, time?: number): TimelineDoc {
  const clip = findClip(doc, clipId);
  if (!clip) return doc;
  const settings = { ...DEFAULT_CLIP_SETTINGS, ...clip.settings };
  const targetTime = keyframe?.time ?? time;
  if (targetTime === undefined) return doc;
  const frames = settings.keyframes.filter((item) => Math.abs(item.time - targetTime) > 1 / 60);
  if (keyframe) frames.push(keyframe);
  frames.sort((left, right) => left.time - right.time);
  return replaceClip(doc, { ...clip, settings: { ...settings, keyframes: frames } });
}

function duplicateClip(doc: TimelineDoc, clipId: string): TimelineDoc {
  const clip = findClip(doc, clipId);
  if (!clip) return doc;
  const copy: Clip = { ...clip, id: newId(), start: endOf(clip) };
  return { ...doc, clips: [...doc.clips, copy] };
}

function reduceDoc(doc: TimelineDoc, action: EditorAction): TimelineDoc {
  switch (action.type) {
    case 'addMedia': {
      if (doc.media.some((item) => item.id === action.media.id)) return doc;
      return { ...doc, media: [...doc.media, action.media] };
    }
    case 'updateMediaText':
      return updateMediaText(doc, action.mediaId, action.updates);
    case 'insertClip': {
      const media = findMedia(doc, action.mediaId);
      const track = doc.tracks.find((item) => item.id === action.trackId);
      if (!media || !track || track.kind !== trackKindForMedia(media.kind)) return doc;
      const offset = Math.max(0, action.offset ?? 0);
      const maxDuration = media.kind === 'image' ? MAX_STILL_CLIP_DURATION : media.duration - offset;
      const duration = Math.min(action.duration ?? media.duration, maxDuration);
      if (duration < MIN_CLIP_DURATION) return doc;
      const clip: Clip = {
        id: action.clipId ?? newId(),
        mediaId: media.id,
        trackId: track.id,
        start: Math.max(0, action.start),
        offset,
        duration,
        settings: { ...DEFAULT_CLIP_SETTINGS },
      };
      return { ...doc, clips: [...doc.clips, clip] };
    }
    case 'batch':
      return action.actions.reduce(reduceDoc, doc);
    case 'split':
      return splitClip(doc, action.clipId, action.time);
    case 'trimStart':
      return trimClipStart(doc, action.clipId, action.time);
    case 'trimEnd':
      return trimClipEnd(doc, action.clipId, action.time);
    case 'move':
      return moveClip(doc, action.clipId, action.trackId, action.start);
    case 'updateSettings':
      return updateSettings(doc, action.clipId, action.settings, action.keyframe);
    case 'upsertKeyframe':
      return updateKeyframe(doc, action.clipId, action.keyframe);
    case 'removeKeyframe':
      return updateKeyframe(doc, action.clipId, null, action.time);
    case 'duplicate':
      return duplicateClip(doc, action.clipId);
    case 'delete': {
      const ids = new Set(action.clipIds);
      return { ...doc, clips: doc.clips.filter((clip) => !ids.has(clip.id)) };
    }
    default:
      return doc;
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'load') return createEditorState(action.doc);

  if (action.type === 'undo') {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;
    return {
      doc: previous,
      past: state.past.slice(0, -1),
      future: [state.doc, ...state.future],
    };
  }

  if (action.type === 'redo') {
    const next = state.future[0];
    if (!next) return state;
    return {
      doc: next,
      past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
    };
  }

  const nextDoc = reduceDoc(state.doc, action);
  if (nextDoc === state.doc) return state;
  return {
    doc: nextDoc,
    past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
    future: [],
  };
}
