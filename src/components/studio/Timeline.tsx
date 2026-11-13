import { useEffect, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { AudioLines, Film, Image as ImageIcon, Minus, Plus, Type } from 'lucide-react';
import { MEDIA_DRAG_TYPE } from '@/components/studio/dragTypes';
import { clipEnd, snapToFrame, timelineLength } from '@/lib/studio/timeline';
import type { EditorAction } from '@/lib/studio/reducer';
import { MIN_CLIP_DURATION, type Clip, type TimelineDoc } from '@/lib/studio/types';

export const TRACK_HEADER_WIDTH = 160;
const TRACK_HEIGHT = 56;
const RULER_HEIGHT = 32;
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 160;

type Preview = { trackId: string; start: number; duration: number };
type DragMode = 'move' | 'trimStart' | 'trimEnd';
type DragState = { mode: DragMode; clip: Clip; originX: number; mediaDuration: number; trackKind: string };

type TimelineProps = {
  doc: TimelineDoc;
  pixelsPerSecond: number;
  time: number;
  selectedIds: Set<string>;
  onZoom: (direction: -1 | 1) => void;
  onSeek: (seconds: number) => void;
  onSelect: (clipId: string, additive: boolean) => void;
  onEdit: (action: EditorAction) => void;
  onDropMedia: (mediaId: string, trackId: string, start: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function rulerStep(pixelsPerSecond: number) {
  if (pixelsPerSecond >= 60) return 1;
  if (pixelsPerSecond >= 24) return 5;
  return 10;
}

function formatRulerLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export default function Timeline({
  doc,
  pixelsPerSecond,
  time,
  selectedIds,
  onZoom,
  onSeek,
  onSelect,
  onEdit,
  onDropMedia,
}: TimelineProps) {
  const [preview, setPreview] = useState<Record<string, Preview>>({});
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<Record<string, Preview>>({});
  const seekRef = useRef(onSeek);
  seekRef.current = onSeek;
  const rulerRef = useRef<HTMLDivElement>(null);

  const width = timelineLength(doc) * pixelsPerSecond;
  const step = rulerStep(pixelsPerSecond);
  const ticks = Array.from({ length: Math.floor(timelineLength(doc) / step) + 1 }, (_, index) => index * step);

  useEffect(() => {
    if (!dragging) return;

    const updatePreview = (next: Preview | null) => {
      previewRef.current = next ? { [dragging.clip.id]: next } : {};
      setPreview(previewRef.current);
    };

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.originX) / pixelsPerSecond;
      const { clip } = drag;

      if (drag.mode === 'move') {
        const target = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('[data-track-id]');
        const trackId = target && target.dataset.trackKind === drag.trackKind ? target.dataset.trackId! : clip.trackId;
        updatePreview({ trackId, start: Math.max(0, snapToFrame(clip.start + dx)), duration: clip.duration });
      } else if (drag.mode === 'trimStart') {
        const earliest = drag.mediaDuration === 60 * 60
          ? 0
          : Math.max(0, clip.start - clip.offset);
        const start = clamp(snapToFrame(clip.start + dx), earliest, clipEnd(clip) - MIN_CLIP_DURATION);
        updatePreview({ trackId: clip.trackId, start, duration: clipEnd(clip) - start });
      } else {
        const maxDuration = drag.mediaDuration - clip.offset;
        const duration = clamp(snapToFrame(clipEnd(clip) + dx) - clip.start, MIN_CLIP_DURATION, maxDuration);
        updatePreview({ trackId: clip.trackId, start: clip.start, duration });
      }
    };

    const onUp = () => {
      const drag = dragRef.current;
      const next = previewRef.current[dragging.clip.id];
      const { clip } = dragging;
      dragRef.current = null;
      previewRef.current = {};
      setPreview({});
      setDragging(null);
      if (!drag || !next) return;

      if (drag.mode === 'move') {
        if (next.start !== clip.start || next.trackId !== clip.trackId) {
          onEdit({ type: 'move', clipId: clip.id, trackId: next.trackId, start: next.start });
        }
      } else if (drag.mode === 'trimStart') {
        if (next.start !== clip.start) onEdit({ type: 'trimStart', clipId: clip.id, time: next.start });
      } else if (next.duration !== clip.duration) {
        onEdit({ type: 'trimEnd', clipId: clip.id, time: clip.start + next.duration });
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, pixelsPerSecond, onEdit]);

  useEffect(() => {
    if (!scrubbing) return;
    const seekAt = (clientX: number) => {
      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return;
      seekRef.current((clientX - rect.left) / pixelsPerSecond);
    };
    const onMove = (event: PointerEvent) => seekAt(event.clientX);
    const onUp = () => setScrubbing(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [scrubbing, pixelsPerSecond]);

  const startClipDrag = (event: ReactPointerEvent, clip: Clip, mode: DragMode) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    onSelect(clip.id, event.shiftKey || event.metaKey || event.ctrlKey);
    const media = doc.media.find((item) => item.id === clip.mediaId);
    const trackKind = doc.tracks.find((track) => track.id === clip.trackId)?.kind ?? 'video';
    if (!media) return;
    const drag: DragState = {
      mode,
      clip,
      originX: event.clientX,
      mediaDuration: media.kind === 'image' ? 60 * 60 : media.duration,
      trackKind,
    };
    dragRef.current = drag;
    setDragging(drag);
  };

  const displayed = (clip: Clip) => {
    const override = preview[clip.id];
    return override ? { ...clip, ...override } : clip;
  };

  const handleTrackDrop = (event: DragEvent, trackId: string) => {
    const mediaId = event.dataTransfer.getData(MEDIA_DRAG_TYPE);
    if (!mediaId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    onDropMedia(mediaId, trackId, Math.max(0, snapToFrame((event.clientX - rect.left) / pixelsPerSecond)));
  };

  const playhead = (
    <div
      className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-accent-400"
      style={{ left: time * pixelsPerSecond }}
    />
  );

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface-panel">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
        <h2 className="text-sm font-semibold text-ink">Timeline</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onZoom(-1)}
            disabled={pixelsPerSecond <= MIN_ZOOM}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-ink-muted">{Math.round(pixelsPerSecond)}px/s</span>
          <button
            type="button"
            onClick={() => onZoom(1)}
            disabled={pixelsPerSecond >= MAX_ZOOM}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="relative" style={{ width: TRACK_HEADER_WIDTH + width, minWidth: '100%' }}>
          <div className="flex sticky top-0 z-30 bg-surface-panel" style={{ height: RULER_HEIGHT }}>
            <div
              className="sticky left-0 z-30 border-b border-r border-surface-border bg-surface-panel"
              style={{ width: TRACK_HEADER_WIDTH }}
            />
            <div
              ref={rulerRef}
              role="slider"
              aria-label="Playhead"
              aria-valuenow={Math.round(time * 100) / 100}
              onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                seekRef.current((event.clientX - rect.left) / pixelsPerSecond);
                setScrubbing(true);
              }}
              className="relative cursor-pointer select-none border-b border-surface-border bg-surface-subtle"
              style={{ width, height: RULER_HEIGHT }}
            >
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute top-0 flex h-full flex-col justify-end pb-1 text-[10px] tabular-nums text-ink-muted"
                  style={{ left: tick * pixelsPerSecond }}
                >
                  <span className="pl-1">{formatRulerLabel(tick)}</span>
                  <span className="absolute bottom-0 left-0 h-2 w-px bg-ink-muted/50" />
                </span>
              ))}
              {playhead}
            </div>
          </div>

          {doc.tracks.map((track) => (
            <div key={track.id} className="flex" style={{ height: TRACK_HEIGHT }}>
              <div
                className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-surface-border bg-surface-panel px-3"
                style={{ width: TRACK_HEADER_WIDTH }}
              >
                {track.kind === 'audio' ? (
                  <AudioLines className="h-4 w-4 text-success-600 dark:text-success-400" />
                ) : (
                  <Film className="h-4 w-4 text-brand-text" />
                )}
                <span className="truncate text-xs font-semibold text-ink">{track.name}</span>
              </div>
              <div
                data-track-id={track.id}
                data-track-kind={track.kind}
                onDragOver={(event) => {
                  if (!Array.from(event.dataTransfer.types).includes(MEDIA_DRAG_TYPE)) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(event) => handleTrackDrop(event, track.id)}
                onPointerDown={() => onSelect('', false)}
                className="relative border-b border-surface-border bg-surface-base/60"
                style={{ width, height: TRACK_HEIGHT }}
              >
                {doc.clips
                  .filter((clip) => clip.trackId === track.id || preview[clip.id]?.trackId === track.id)
                  .map((clip) => {
                    const view = displayed(clip);
                    if (view.trackId !== track.id) return null;
                    const selected = selectedIds.has(clip.id);
                    const media = doc.media.find((item) => item.id === clip.mediaId);
                    const isAudio = track.kind === 'audio';
                    const isImage = media?.kind === 'image';
                    return (
                      <div
                        key={clip.id}
                        onPointerDown={(event) => startClipDrag(event, clip, 'move')}
                        className={`group absolute top-1.5 flex h-[calc(100%-12px)] cursor-grab touch-none select-none items-center overflow-hidden rounded-lg border px-2 text-xs font-medium text-white shadow-sm transition-shadow active:cursor-grabbing ${
                          isAudio ? 'border-success-500 bg-success-600/90' : 'border-brand-300 bg-brand-600/90'
                        } ${selected ? 'ring-2 ring-accent-400 ring-offset-1 ring-offset-surface-panel' : ''}`}
                        style={{ left: view.start * pixelsPerSecond, width: Math.max(view.duration * pixelsPerSecond, 6) }}
                        title={media?.name}
                      >
                        <span
                          onPointerDown={(event) => startClipDrag(event, clip, 'trimStart')}
                          className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-white/0 transition hover:bg-white/40"
                        />
                        <span className="mr-1 shrink-0">
                          {isImage ? <ImageIcon className="h-3 w-3" /> : media?.kind === 'text' ? <Type className="h-3 w-3" /> : null}
                        </span>
                        <span className="truncate">{media?.kind === 'text' ? media.text || 'Text overlay' : media?.name ?? 'Missing media'}</span>
                        <span
                          onPointerDown={(event) => startClipDrag(event, clip, 'trimEnd')}
                          className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-white/0 transition hover:bg-white/40"
                        />
                      </div>
                    );
                  })}
                {playhead}
              </div>
            </div>
          ))}
          {doc.tracks.length === 0 && (
            <p className="p-6 text-center text-sm text-ink-muted">No tracks yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
