import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import MediaBin from '@/components/studio/MediaBin';
import PreviewMonitor from '@/components/studio/PreviewMonitor';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import StudioHeader from '@/components/studio/StudioHeader';
import Timeline, { MAX_ZOOM, MIN_ZOOM } from '@/components/studio/Timeline';
import { createEditorState, editorReducer, type EditorAction } from '@/lib/studio/reducer';
import { createMediaUrl, uploadStudioMedia } from '@/lib/studio/persistence';
import { DEFAULT_IMAGE_DURATION, probeMediaFile, validateMediaFile } from '@/lib/studio/media';
import { clipCoversTime, clipsAtTime, timelineLength } from '@/lib/studio/timeline';
import { useAutosave } from '@/lib/studio/useAutosave';
import { usePlayhead } from '@/lib/studio/usePlayhead';
import { useStudioShortcuts } from '@/lib/studio/useStudioShortcuts';
import { FRAME_DURATION, trackKindForMedia, type TimelineDoc } from '@/lib/studio/types';
import { exportTimeline } from '@/lib/studio/export';

const DEFAULT_ZOOM = 40;

type ClipboardEntry = { mediaId: string; trackId: string; relativeStart: number; offset: number; duration: number };

type StudioWorkspaceProps = {
  projectId: string;
  userId: string;
  title: string;
  initialDoc: TimelineDoc;
  savedDoc: TimelineDoc;
};

function errorText(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Something went wrong.';
}

export default function StudioWorkspace({ projectId, userId, title, initialDoc, savedDoc }: StudioWorkspaceProps) {
  const [editor, dispatch] = useReducer(editorReducer, initialDoc, createEditorState);
  const doc = editor.doc;
  const canUndo = editor.past.length > 0;
  const canRedo = editor.future.length > 0;

  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_ZOOM);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const clipboard = useRef<ClipboardEntry[]>([]);
  const mediaRef = useRef(doc.media);
  mediaRef.current = doc.media;
  const mediaKey = doc.media
    .filter((item) => item.kind !== 'text')
    .map((item) => `${item.id}:${item.path}`)
    .join('|');

  const endTime = timelineLength(doc);
  const playhead = usePlayhead(endTime);
  const { time } = playhead;
  const autosave = useAutosave(projectId, doc, savedDoc);

  const selectedClips = useMemo(
    () => doc.clips.filter((clip) => selectedIds.has(clip.id)),
    [doc.clips, selectedIds],
  );
  const playheadInside = selectedClips.some((clip) => clipCoversTime(clip, time));

  useEffect(() => {
    let active = true;
    const refreshTimers: number[] = [];

    for (const item of mediaRef.current) {
      if (item.kind === 'text') continue;
      const loadUrl = async () => {
        try {
          const url = await createMediaUrl(item.path);
          if (!active) return;
          setUrls((current) => ({ ...current, [item.id]: url }));
          refreshTimers.push(
            window.setTimeout(() => void loadUrl(), 50 * 60 * 1000),
          );
        } catch {
          if (active) setImportError(`${item.name} could not be loaded for preview. Try again later.`);
        }
      };
      void loadUrl();
    }

    return () => {
      active = false;
      refreshTimers.forEach(window.clearTimeout);
    };
  }, [mediaKey]);

  const handleEdit = useCallback((action: EditorAction) => dispatch(action), []);

  const handleSelect = useCallback((clipId: string, additive: boolean) => {
    if (!clipId) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds((current) => {
      if (!additive) return new Set([clipId]);
      const next = new Set(current);
      if (next.has(clipId)) next.delete(clipId);
      else next.add(clipId);
      return next;
    });
  }, []);

  const handleImport = async (files: File[]) => {
    setImportError(null);
    setImporting((count) => count + files.length);
    const errors: string[] = [];

    for (const file of files) {
      const invalid = validateMediaFile(file);
      if (invalid) {
        errors.push(invalid);
        setImporting((count) => count - 1);
        continue;
      }
      try {
        const probed = await probeMediaFile(file);
        const mediaId = crypto.randomUUID();
        const path = await uploadStudioMedia(userId, projectId, mediaId, file);
        dispatch({
          type: 'addMedia',
          media: { id: mediaId, name: file.name, kind: probed.kind, duration: probed.duration, path },
        });
      } catch (caught) {
        errors.push(errorText(caught));
      } finally {
        setImporting((count) => count - 1);
      }
    }

    if (errors.length > 0) setImportError(errors.join(' '));
  };

  const addToTimeline = (mediaId: string) => {
    const media = doc.media.find((item) => item.id === mediaId);
    const track = media && doc.tracks.find((item) => item.kind === trackKindForMedia(media.kind));
    if (!track) return;
    const trackEnd = doc.clips
      .filter((clip) => clip.trackId === track.id)
      .reduce((end, clip) => Math.max(end, clip.start + clip.duration), 0);
    dispatch({
      type: 'insertClip',
      mediaId,
      trackId: track.id,
      start: trackEnd,
      ...(media.kind === 'image' ? { duration: DEFAULT_IMAGE_DURATION } : {}),
    });
  };

  const addText = () => {
    const track = doc.tracks.find((item) => item.kind === 'video');
    if (!track) return;
    const id = crypto.randomUUID();
    const start = doc.clips
      .filter((clip) => clip.trackId === track.id)
      .reduce((end, clip) => Math.max(end, clip.start + clip.duration), 0);
    dispatch({
      type: 'batch',
      actions: [
        {
          type: 'addMedia',
          media: {
            id,
            name: 'Text overlay',
            kind: 'text',
            duration: 5,
            path: '',
            text: 'Your title',
            textColor: '#ffffff',
            fontSize: 64,
          },
        },
        { type: 'insertClip', clipId: id, mediaId: id, trackId: track.id, start, duration: 5 },
      ],
    });
    setSelectedIds(new Set([id]));
  };

  const zoomBy = (direction: -1 | 1) =>
    setPixelsPerSecond((value) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(direction > 0 ? value * 1.25 : value / 1.25))),
    );

  const splitAtPlayhead = () => {
    const selectedUnderPlayhead = selectedClips.filter((clip) => clipCoversTime(clip, time));
    const candidates = selectedUnderPlayhead.length > 0 ? selectedUnderPlayhead : clipsAtTime(doc, time);
    if (candidates.length === 0) return;
    dispatch({
      type: 'batch',
      actions: candidates.map((clip) => ({ type: 'split', clipId: clip.id, time })),
    });
  };

  const deleteSelected = () => {
    if (selectedClips.length === 0) return;
    dispatch({ type: 'delete', clipIds: selectedClips.map((clip) => clip.id) });
    setSelectedIds(new Set());
  };

  const duplicateSelected = () => {
    if (selectedClips.length === 0) return;
    dispatch({ type: 'batch', actions: selectedClips.map((clip) => ({ type: 'duplicate', clipId: clip.id })) });
  };

  const copySelected = () => {
    if (selectedClips.length === 0) return;
    const base = Math.min(...selectedClips.map((clip) => clip.start));
    clipboard.current = selectedClips.map((clip) => ({
      mediaId: clip.mediaId,
      trackId: clip.trackId,
      relativeStart: clip.start - base,
      offset: clip.offset,
      duration: clip.duration,
    }));
  };

  const pasteAtPlayhead = () => {
    if (clipboard.current.length === 0) return;
    playhead.stop();
    dispatch({
      type: 'batch',
      actions: clipboard.current.map((entry) => ({
        type: 'insertClip',
        mediaId: entry.mediaId,
        trackId: entry.trackId,
        start: time + entry.relativeStart,
        offset: entry.offset,
        duration: entry.duration,
      })),
    });
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportProgress(0);
    setExportError(null);
    playhead.stop();
    try {
      const blob = await exportTimeline(doc, urls, setExportProgress);
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${title.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'lumora-export'}.webm`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    } catch (caught) {
      setExportError(errorText(caught));
    } finally {
      setExporting(false);
    }
  };

  useStudioShortcuts({
    togglePlay: playhead.togglePlaying,
    stepFrames: (direction, seconds) => {
      playhead.stop();
      playhead.seek(time + direction * (seconds ? 1 : FRAME_DURATION));
    },
    goToStart: () => {
      playhead.stop();
      playhead.seek(0);
    },
    split: splitAtPlayhead,
    deleteSelected,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    copy: copySelected,
    paste: pasteAtPlayhead,
    duplicate: duplicateSelected,
    zoom: zoomBy,
  });

  return (
    <div className="flex h-screen flex-col bg-surface-base">
      <StudioHeader
        title={title}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        saveStatus={autosave.status}
        saveError={autosave.error}
        onRetry={() => void autosave.retry()}
        exporting={exporting}
        exportProgress={exportProgress}
        onExport={() => void handleExport()}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className="min-h-0 rounded-3xl border border-surface-border bg-surface-panel p-4">
          <MediaBin
            doc={doc}
            importing={importing}
            importError={importError}
            onImport={handleImport}
            onAddToTimeline={addToTimeline}
            onAddText={addText}
          />
        </div>

        <div className="min-h-[280px] lg:min-h-0">
          <PreviewMonitor doc={doc} time={time} playing={playhead.playing} urls={urls} />
        </div>

        <div className="min-h-0 rounded-3xl border border-surface-border bg-surface-panel p-4">
          <PropertiesPanel
            doc={doc}
            selectedClips={selectedClips}
            playheadInside={playheadInside}
            playheadTime={time}
            onEdit={handleEdit}
            onSplit={splitAtPlayhead}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
          />
        </div>
      </div>

      <div className="flex h-[300px] shrink-0 flex-col gap-3 px-4 pb-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-surface-border bg-surface-panel px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={playhead.togglePlaying}
              className="btn-primary !px-5 !py-2 text-sm"
            >
              {playhead.playing ? 'Pause' : 'Play'}
            </button>
            <span className="text-xs text-ink-muted">Space to play, S to split, Delete to remove</span>
          </div>
        </div>
        {exportError && (
          <p role="alert" className="rounded-xl border border-error-500/40 bg-error-500/10 px-4 py-2 text-xs text-error-600 dark:text-error-400">
            Export failed: {exportError}
          </p>
        )}
        <div className="min-h-0 flex-1">
          <Timeline
            doc={doc}
            pixelsPerSecond={pixelsPerSecond}
            time={time}
            selectedIds={selectedIds}
            onZoom={zoomBy}
            onSeek={(seconds) => {
              playhead.stop();
              playhead.seek(seconds);
            }}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDropMedia={(mediaId, trackId, start) => dispatch({ type: 'insertClip', mediaId, trackId, start })}
          />
        </div>
      </div>
    </div>
  );
}
