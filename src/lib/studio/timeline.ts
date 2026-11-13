import {
  DEFAULT_CLIP_SETTINGS,
  FRAME_DURATION,
  type Clip,
  type ClipSettings,
  type TimelineDoc,
} from '@/lib/studio/types';

const MIN_TIMELINE_SECONDS = 30;

export function clipEnd(clip: Clip) {
  return clip.start + clip.duration;
}

export function timelineLength(doc: TimelineDoc) {
  const furthest = doc.clips.reduce((max, clip) => Math.max(max, clipEnd(clip)), 0);
  return Math.max(MIN_TIMELINE_SECONDS, Math.ceil(furthest + 10));
}

export function snapToFrame(seconds: number) {
  return Math.round(seconds / FRAME_DURATION) * FRAME_DURATION;
}

export function clipCoversTime(clip: Clip, time: number) {
  return time >= clip.start && time < clipEnd(clip);
}

export function clipsAtTime(doc: TimelineDoc, time: number) {
  return doc.clips.filter((clip) => clipCoversTime(clip, time));
}

// Tracks are listed top to bottom, so the first video track with a clip under the playhead wins.
export function topVideoClipAt(doc: TimelineDoc, time: number): Clip | undefined {
  for (const track of doc.tracks) {
    if (track.kind !== 'video') continue;
    const clip = doc.clips.find((item) => item.trackId === track.id && clipCoversTime(item, time));
    if (clip) return clip;
  }
  return undefined;
}

export function formatTimecode(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const frames = Math.floor((safe - Math.floor(safe)) * 30);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

export function formatSeconds(seconds: number) {
  return `${seconds.toFixed(2)}s`;
}

export function evaluateClipSettings(clip: Clip, timelineTime: number): ClipSettings {
  const settings = { ...DEFAULT_CLIP_SETTINGS, ...clip.settings };
  const keyframes = [...(settings.keyframes ?? [])].sort((left, right) => left.time - right.time);
  if (keyframes.length === 0) return settings;

  const localTime = Math.min(clip.duration, Math.max(0, timelineTime - clip.start));
  const before = [...keyframes].reverse().find((keyframe) => keyframe.time <= localTime);
  const after = keyframes.find((keyframe) => keyframe.time >= localTime);
  if (!before) {
    const first = keyframes[0];
    return { ...settings, scale: first.scale, rotation: first.rotation, opacity: first.opacity };
  }
  if (!after || after.time === before.time) {
    return { ...settings, scale: before.scale, rotation: before.rotation, opacity: before.opacity };
  }
  const progress = (localTime - before.time) / (after.time - before.time);
  return {
    ...settings,
    scale: before.scale + (after.scale - before.scale) * progress,
    rotation: before.rotation + (after.rotation - before.rotation) * progress,
    opacity: before.opacity + (after.opacity - before.opacity) * progress,
  };
}
