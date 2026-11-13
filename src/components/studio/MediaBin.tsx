import { useEffect, useRef, useState, type DragEvent } from 'react';
import { AudioLines, Film, GripVertical, Image as ImageIcon, Loader2, Plus, Type, Upload } from 'lucide-react';
import { formatSeconds } from '@/lib/studio/timeline';
import { MEDIA_DRAG_TYPE } from '@/components/studio/dragTypes';
import type { MediaItem, TimelineDoc } from '@/lib/studio/types';

type MediaBinProps = {
  doc: TimelineDoc;
  importing: number;
  importError: string | null;
  compact?: boolean;
  initialFilter?: 'all' | 'video' | 'image' | 'audio';
  onImport: (files: File[]) => void;
  onAddToTimeline: (mediaId: string) => void;
  onAddText: () => void;
};

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes('Files');
}

export default function MediaBin({
  doc,
  importing,
  importError,
  compact = false,
  initialFilter = 'all',
  onImport,
  onAddToTimeline,
  onAddText,
}: MediaBinProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [kindFilter, setKindFilter] = useState<'all' | 'video' | 'image' | 'audio'>(initialFilter);

  useEffect(() => {
    setKindFilter(initialFilter);
  }, [initialFilter]);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) onImport(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  };

  const usageCount = (mediaId: string) => doc.clips.filter((clip) => clip.mediaId === mediaId).length;
  const filteredMedia = doc.media.filter(
    (item) => !compact || kindFilter === 'all' || item.kind === kindFilter,
  );

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Media</h2>
        <span className="text-xs text-ink-muted">{doc.media.length} imported</span>
      </div>

      <div
        onDragOver={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`flex ${
          compact ? 'flex-row flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-left' : 'flex-col items-center gap-3 rounded-2xl px-4 py-6 text-center'
        } border-2 border-dashed transition ${
          dragging ? 'border-brand-400 bg-brand-500/10' : 'border-surface-border bg-surface-subtle'
        }`}
      >
        {importing > 0 ? (
          <Loader2 className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} animate-spin text-brand-text`} aria-label="Importing" />
        ) : (
          <Upload className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} text-brand-text`} />
        )}
        <p className={`${compact ? 'flex-1' : ''} text-xs text-ink-muted`}>
          {importing > 0 ? `Importing ${importing} file${importing === 1 ? '' : 's'}...` : 'Drop video, image, or audio here'}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={importing > 0}
          className={`btn-secondary !px-4 !py-2 text-xs disabled:opacity-50 ${compact ? '!py-1.5' : ''}`}
        >
          {compact ? 'Import' : 'Choose files'}
        </button>
        {!compact && <button type="button" onClick={onAddText} className="btn-secondary !px-4 !py-2 text-xs">
          <Type className="h-3.5 w-3.5" /> Add text
        </button>}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {importError && (
        <p role="alert" className="rounded-xl border border-error-500/40 bg-error-500/10 p-3 text-xs text-error-600 dark:text-error-400">
          {importError}
        </p>
      )}

      {compact && (
        <div className="flex shrink-0 gap-1 overflow-x-auto py-1">
          {([
            { id: 'all', label: 'All' },
            { id: 'video', label: 'Videos' },
            { id: 'image', label: 'Photos' },
            { id: 'audio', label: 'Audio' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKindFilter(id)}
              aria-pressed={kindFilter === id}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                kindFilter === id ? 'bg-brand-500/10 text-brand-text' : 'text-ink-muted hover:bg-surface-subtle'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {doc.media.length === 0 && (
          <li className="py-8 text-center text-xs text-ink-muted">Your imported files appear here.</li>
        )}
        {filteredMedia.map((item) => (
          <MediaRow
            key={item.id}
            item={item}
            uses={usageCount(item.id)}
            onAdd={() => onAddToTimeline(item.id)}
          />
        ))}
        {doc.media.length > 0 && filteredMedia.length === 0 && (
          <li className="py-4 text-center text-xs text-ink-muted">No {kindFilter} files imported yet.</li>
        )}
      </ul>
    </section>
  );
}

function MediaRow({ item, uses, onAdd }: { item: MediaItem; uses: number; onAdd: () => void }) {
  const Icon = item.kind === 'video' ? Film : item.kind === 'image' ? ImageIcon : item.kind === 'text' ? Type : AudioLines;
  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MEDIA_DRAG_TYPE, item.id);
        event.dataTransfer.effectAllowed = 'copy';
      }}
      className="group flex cursor-grab items-center gap-3 rounded-xl border border-surface-border bg-surface-panel p-3 transition hover:border-brand-400/60 active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 shrink-0 text-ink-muted/60" />
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          item.kind === 'audio'
            ? 'bg-success-500/15 text-success-600 dark:text-success-400'
            : 'bg-brand-500/15 text-brand-text'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={item.name}>
          {item.name}
        </p>
        <p className="text-xs text-ink-muted">
          {item.kind === 'text' ? 'Text overlay' : formatSeconds(item.duration)} · {uses} on timeline
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${item.name} to timeline`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-brand-500/10 hover:text-brand-text"
      >
        <Plus className="h-4 w-4" />
      </button>
    </li>
  );
}
