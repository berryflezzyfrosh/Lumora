import { useEffect, useState, type KeyboardEvent } from 'react';
import { Copy, Scissors, Trash2 } from 'lucide-react';
import { clipEnd, evaluateClipSettings, formatSeconds } from '@/lib/studio/timeline';
import type { EditorAction } from '@/lib/studio/reducer';
import {
  DEFAULT_CLIP_SETTINGS,
  MIN_CLIP_DURATION,
  type Clip,
  type ClipAnimation,
  type ClipSettings,
  type TimelineDoc,
} from '@/lib/studio/types';

type PropertiesPanelProps = {
  doc: TimelineDoc;
  selectedClips: Clip[];
  playheadInside: boolean;
  playheadTime: number;
  onEdit: (action: EditorAction) => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function NumberField({ label, value, min, onCommit }: { label: string; value: number; min: number; onCommit: (next: number) => void }) {
  const [draft, setDraft] = useState(value.toFixed(2));

  useEffect(() => {
    setDraft(value.toFixed(2));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < min) {
      setDraft(value.toFixed(2));
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') setDraft(value.toFixed(2));
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <input
        type="number"
        step="0.1"
        min={min}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className="input-base !py-2 text-sm tabular-nums"
      />
    </label>
  );
}

function SettingRange({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string) => {
    const next = Number(raw);
    if (Number.isFinite(next) && next !== value) onCommit(next);
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between text-xs font-medium text-ink-muted">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(draft)}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={draft}
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerUp={(event) => commit(event.currentTarget.value)}
        onBlur={(event) => commit(event.currentTarget.value)}
        className="w-full accent-brand-500"
        aria-label={label}
      />
    </label>
  );
}

export default function PropertiesPanel({
  doc,
  selectedClips,
  playheadInside,
  playheadTime,
  onEdit,
  onSplit,
  onDuplicate,
  onDelete,
}: PropertiesPanelProps) {
  const count = selectedClips.length;
  const clip = count === 1 ? selectedClips[0] : undefined;
  const media = clip ? doc.media.find((item) => item.id === clip.mediaId) : undefined;
  const track = clip ? doc.tracks.find((item) => item.id === clip.trackId) : undefined;
  const settings = clip ? evaluateClipSettings(clip, playheadTime) : DEFAULT_CLIP_SETTINGS;
  const updateSettings = (patch: Partial<ClipSettings>) => {
    if (!clip) return;
    const keyframe = (clip.settings?.keyframes?.length ?? 0) > 0 && playheadInside
      ? {
          time: playheadTime - clip.start,
          scale: patch.scale ?? settings.scale,
          rotation: patch.rotation ?? settings.rotation,
          opacity: patch.opacity ?? settings.opacity,
        }
      : undefined;
    onEdit({ type: 'updateSettings', clipId: clip.id, settings: patch, keyframe });
  };
  const keyframeHere = clip?.settings?.keyframes?.some((keyframe) =>
    Math.abs(keyframe.time - (playheadTime - clip.start)) < 1 / 60,
  ) ?? false;

  return (
    <section className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-ink">Properties</h2>
        <p className="mt-1 text-xs text-ink-muted">
          {count === 0 && 'Select a clip on the timeline to edit it.'}
          {count > 1 && `${count} clips selected. Split, duplicate or delete them together.`}
          {clip && media && track && `${media.name} on ${track.name}`}
        </p>
      </div>

      {clip && media && (
        <>
        {media.kind === 'text' && (
          <div className="flex flex-col gap-3 border-b border-surface-border pb-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-muted">Overlay text</span>
              <textarea
                value={media.text ?? ''}
                maxLength={240}
                onChange={(event) => onEdit({
                  type: 'updateMediaText',
                  mediaId: media.id,
                  updates: { text: event.target.value },
                })}
                className="input-base min-h-20 resize-y !py-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 items-center gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">Text color</span>
                <input
                  type="color"
                  value={media.textColor ?? '#ffffff'}
                  onChange={(event) => onEdit({
                    type: 'updateMediaText',
                    mediaId: media.id,
                    updates: { textColor: event.target.value },
                  })}
                  className="h-10 w-full cursor-pointer rounded-lg border border-surface-border bg-surface-panel p-1"
                />
              </label>
              <NumberField
                label="Font size (px)"
                value={media.fontSize ?? 64}
                min={12}
                onCommit={(fontSize) => onEdit({
                  type: 'updateMediaText',
                  mediaId: media.id,
                  updates: { fontSize: Math.min(160, fontSize) },
                })}
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Start (s)"
            value={clip.start}
            min={0}
            onCommit={(start) => onEdit({ type: 'move', clipId: clip.id, trackId: clip.trackId, start })}
          />
          <NumberField
            label="Duration (s)"
            value={clip.duration}
            min={MIN_CLIP_DURATION}
            onCommit={(duration) =>
              onEdit({ type: 'trimEnd', clipId: clip.id, time: clip.start + duration })
            }
          />
          <div className="col-span-2 grid grid-cols-2 gap-3 rounded-2xl border border-surface-border bg-surface-subtle p-4 text-xs">
            <div>
              <p className="text-ink-muted">Source in</p>
              <p className="mt-1 font-semibold tabular-nums text-ink">{formatSeconds(clip.offset)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Source out</p>
              <p className="mt-1 font-semibold tabular-nums text-ink">{formatSeconds(clip.offset + clip.duration)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Ends at</p>
              <p className="mt-1 font-semibold tabular-nums text-ink">{formatSeconds(clipEnd(clip))}</p>
            </div>
            <div>
              <p className="text-ink-muted">Source length</p>
              <p className="mt-1 font-semibold tabular-nums text-ink">{formatSeconds(media.duration)}</p>
            </div>
          </div>
        </div>
        {track?.kind === 'video' && (
          <div className="flex flex-col gap-4 border-t border-surface-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Transform & effects</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <NumberField
                label="Scale (%)"
                value={settings.scale}
                min={10}
                onCommit={(scale) => updateSettings({ scale: Math.min(300, scale) })}
              />
              <NumberField
                label="Rotation (deg)"
                value={settings.rotation}
                min={-360}
                onCommit={(rotation) => updateSettings({ rotation: Math.max(-360, Math.min(360, rotation)) })}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-surface-border bg-surface-subtle p-3">
              <span className="text-xs text-ink-muted">
                {clip.settings?.keyframes?.length ?? 0} animation keyframes
              </span>
              <div className="flex gap-2">
                {keyframeHere && (
                  <button
                    type="button"
                    onClick={() => onEdit({
                      type: 'removeKeyframe',
                      clipId: clip.id,
                      time: playheadTime - clip.start,
                    })}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface-panel"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  disabled={!playheadInside}
                  onClick={() => updateSettings({
                    keyframes: [
                      ...(clip.settings?.keyframes ?? []).filter((keyframe) =>
                        Math.abs(keyframe.time - (playheadTime - clip.start)) > 1 / 60,
                      ),
                      {
                        time: playheadTime - clip.start,
                        scale: settings.scale,
                        rotation: settings.rotation,
                        opacity: settings.opacity,
                      },
                    ],
                  })}
                  className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {keyframeHere ? 'Update keyframe' : 'Add keyframe'}
                </button>
              </div>
            </div>
            <SettingRange label="Opacity" value={settings.opacity} min={0} max={100} onCommit={(opacity) => updateSettings({ opacity })} />
            <SettingRange label="Brightness" value={settings.brightness} min={0} max={200} onCommit={(brightness) => updateSettings({ brightness })} />
            <SettingRange label="Contrast" value={settings.contrast} min={0} max={200} onCommit={(contrast) => updateSettings({ contrast })} />
            <SettingRange label="Saturation" value={settings.saturation} min={0} max={200} onCommit={(saturation) => updateSettings({ saturation })} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Fade in (s)" value={settings.fadeIn} min={0} onCommit={(fadeIn) => updateSettings({ fadeIn: Math.min(clip.duration, fadeIn) })} />
              <NumberField label="Fade out (s)" value={settings.fadeOut} min={0} onCommit={(fadeOut) => updateSettings({ fadeOut: Math.min(clip.duration, fadeOut) })} />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-muted">Motion preset</span>
              <select
                value={settings.animation}
                onChange={(event) => updateSettings({ animation: event.target.value as ClipAnimation })}
                className="input-base !py-2 text-sm"
              >
                <option value="none">None</option>
                <option value="zoom-in">Zoom in</option>
                <option value="zoom-out">Zoom out</option>
                <option value="slide-left">Slide from left</option>
                <option value="slide-right">Slide from right</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-muted">Visual filter</span>
              <select
                value={settings.effect}
                onChange={(event) => onEdit({
                  type: 'updateSettings',
                  clipId: clip.id,
                  settings: { effect: event.target.value as ClipSettings['effect'] },
                })}
                className="input-base !py-2 text-sm"
              >
                <option value="none">Original</option>
                <option value="vintage">Vintage</option>
                <option value="monochrome">Monochrome</option>
                <option value="warm">Warm</option>
                <option value="cool">Cool</option>
                <option value="soft-focus">Soft focus</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-muted">In transition</span>
                <select
                  value={settings.transitionIn}
                  onChange={(event) => onEdit({
                    type: 'updateSettings',
                    clipId: clip.id,
                    settings: { transitionIn: event.target.value as ClipSettings['transitionIn'] },
                  })}
                  className="input-base !py-2 text-sm"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade</option>
                  <option value="wipe-left">Wipe</option>
                  <option value="zoom">Zoom</option>
                </select>
              </label>
              <NumberField
                label="Transition (s)"
                value={settings.transitionDuration}
                min={0.1}
                onCommit={(transitionDuration) => onEdit({
                  type: 'updateSettings',
                  clipId: clip.id,
                  settings: { transitionDuration: Math.min(3, transitionDuration) },
                })}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Filters and transitions are previewed live and saved with this clip.
            </p>
          </div>
        )}
        {track?.kind === 'audio' && (
          <div className="flex flex-col gap-4 border-t border-surface-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Audio</h3>
            <SettingRange label="Volume" value={settings.volume} min={0} max={100} onCommit={(volume) => onEdit({
              type: 'updateSettings',
              clipId: clip.id,
              settings: { volume },
            })} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Fade in (s)" value={settings.fadeIn} min={0} onCommit={(fadeIn) => onEdit({
                type: 'updateSettings',
                clipId: clip.id,
                settings: { fadeIn: Math.min(clip.duration, fadeIn) },
              })} />
              <NumberField label="Fade out (s)" value={settings.fadeOut} min={0} onCommit={(fadeOut) => onEdit({
                type: 'updateSettings',
                clipId: clip.id,
                settings: { fadeOut: Math.min(clip.duration, fadeOut) },
              })} />
            </div>
          </div>
        )}
        </>
      )}

      {count > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSplit}
            disabled={!playheadInside}
            className="btn-secondary !justify-start !py-2.5 text-sm disabled:opacity-40"
          >
            <Scissors className="h-4 w-4" /> Split at playhead
          </button>
          <button type="button" onClick={onDuplicate} className="btn-secondary !justify-start !py-2.5 text-sm">
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-full border border-error-500/40 px-5 py-2.5 text-sm font-semibold text-error-600 transition hover:bg-error-500/10 dark:text-error-400"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}

      {count === 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface-subtle p-4 text-xs text-ink-muted">
          <p>{doc.clips.length} clips on {doc.tracks.length} tracks.</p>
          <p className="mt-2">Drag media from the left onto a track, then trim and arrange clips on the timeline.</p>
        </div>
      )}
    </section>
  );
}
