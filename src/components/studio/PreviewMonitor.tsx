import { useEffect, useRef, type RefObject } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { clipsAtTime, evaluateClipSettings, formatTimecode } from '@/lib/studio/timeline';
import { DEFAULT_CLIP_SETTINGS, type Clip, type TimelineDoc } from '@/lib/studio/types';

type PreviewMonitorProps = {
  doc: TimelineDoc;
  time: number;
  playing: boolean;
  urls: Record<string, string>;
};

const DRIFT_TOLERANCE_SECONDS = 0.3;
const SEEK_TOLERANCE_SECONDS = 0.04;

function useSyncedMedia(ref: RefObject<HTMLMediaElement>, targetTime: number, playing: boolean) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!playing) {
      element.pause();
      if (Math.abs(element.currentTime - targetTime) > SEEK_TOLERANCE_SECONDS) element.currentTime = targetTime;
      return;
    }
    if (Math.abs(element.currentTime - targetTime) > DRIFT_TOLERANCE_SECONDS) element.currentTime = targetTime;
    if (element.paused) void element.play().catch(() => undefined);
  }, [ref, targetTime, playing]);
}

function sourceTimeFor(clip: Clip, time: number) {
  return clip.offset + (time - clip.start);
}

function getVisualStyle(clip: Clip, time: number): React.CSSProperties {
  const settings = evaluateClipSettings(clip, time);
  const progress = Math.min(1, Math.max(0, (time - clip.start) / clip.duration));
  const fadeIn = settings.fadeIn > 0 ? Math.min(1, (time - clip.start) / settings.fadeIn) : 1;
  const fadeOut = settings.fadeOut > 0 ? Math.min(1, (clip.start + clip.duration - time) / settings.fadeOut) : 1;
  const opacity = Math.max(0, Math.min(1, (settings.opacity / 100) * fadeIn * fadeOut));
  let scale = settings.scale / 100;
  let translateX = 0;
  let clipPath: string | undefined;

  if (settings.animation === 'zoom-in') scale *= 1 + progress * 0.15;
  if (settings.animation === 'zoom-out') scale *= 1.15 - progress * 0.15;
  if (settings.animation === 'slide-left') translateX = (1 - progress) * 100;
  if (settings.animation === 'slide-right') translateX = (progress - 1) * 100;

  const transitionProgress = settings.transitionDuration > 0
    ? Math.min(1, Math.max(0, (time - clip.start) / settings.transitionDuration))
    : 1;
  if (settings.transitionIn === 'wipe-left') {
    clipPath = `inset(0 ${(1 - transitionProgress) * 100}% 0 0)`;
  } else if (settings.transitionIn === 'zoom') {
    scale *= 0.8 + transitionProgress * 0.2;
  }
  const transitionOpacity = settings.transitionIn === 'fade' ? transitionProgress : 1;

  const effectFilter = {
    none: '',
    vintage: ' sepia(35%) saturate(115%) contrast(95%)',
    monochrome: ' grayscale(100%)',
    warm: ' sepia(18%) saturate(125%)',
    cool: ' hue-rotate(15deg) saturate(110%)',
    'soft-focus': ' blur(1.2px) contrast(96%)',
  }[settings.effect];

  return {
    filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)${effectFilter}`,
    opacity: opacity * transitionOpacity,
    transform: `translateX(${translateX}%) rotate(${settings.rotation}deg) scale(${scale})`,
    clipPath,
  };
}

function AudioClip({ clip, url, time, playing }: { clip: Clip; url: string; time: number; playing: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useSyncedMedia(ref, sourceTimeFor(clip, time), playing);
  const settings = { ...DEFAULT_CLIP_SETTINGS, ...clip.settings };
  const elapsed = time - clip.start;
  const fadeIn = settings.fadeIn > 0 ? Math.min(1, elapsed / settings.fadeIn) : 1;
  const fadeOut = settings.fadeOut > 0 ? Math.min(1, (clip.start + clip.duration - time) / settings.fadeOut) : 1;
  const volume = Math.max(0, Math.min(1, (settings.volume / 100) * fadeIn * fadeOut));
  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  return <audio ref={ref} src={url} preload="auto" />;
}

export default function PreviewMonitor({ doc, time, playing, urls }: PreviewMonitorProps) {
  const audioClips = clipsAtTime(doc, time).filter((clip) => doc.tracks.find((track) => track.id === clip.trackId)?.kind === 'audio');
  const videoLayers = doc.tracks
    .filter((track) => track.kind === 'video')
    .flatMap((track) =>
      clipsAtTime(doc, time)
        .filter((clip) => clip.trackId === track.id)
        .map((clip) => ({ clip, media: doc.media.find((item) => item.id === clip.mediaId) })),
    )
    .filter((item) => item.media)
    .reverse();

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-surface-border bg-black">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {videoLayers.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-center text-white/70">
            <Film className="h-8 w-8" />
            <p className="text-sm">Nothing at the playhead</p>
          </div>
        )}
        {videoLayers.map(({ clip, media }) => {
          if (!media || media.kind === 'audio') return null;
          if (media.kind === 'text') {
            return (
              <div
                key={clip.id}
                className="pointer-events-none absolute inset-x-5 top-1/2 z-10 -translate-y-1/2 text-center font-bold [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]"
                style={{
                  ...getVisualStyle(clip, time),
                  color: media.textColor ?? '#ffffff',
                  fontSize: `clamp(1rem, ${Math.min(14, (media.fontSize ?? 64) / 8)}vw, ${media.fontSize ?? 64}px)`,
                }}
              >
                {media.text || 'Text overlay'}
              </div>
            );
          }
          const url = urls[media.id];
          if (!url) return <Loader2 key={clip.id} className="absolute h-6 w-6 animate-spin text-white" />;
          return (
            <VisualClip
              key={clip.id}
              clip={clip}
              kind={media.kind}
              name={media.name}
              url={url}
              time={time}
              playing={playing}
            />
          );
        })}
        <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 font-mono text-xs tabular-nums text-white">
          {formatTimecode(time)}
        </span>
      </div>
      {audioClips.map((clip) => {
        const mediaId = clip.mediaId;
        const media = doc.media.find((item) => item.id === mediaId);
        const url = urls[mediaId];
        return url && media?.kind === 'audio'
          ? <AudioClip key={clip.id} clip={clip} url={url} time={time} playing={playing} />
          : null;
      })}
    </div>
  );
}

function VisualClip({
  clip,
  kind,
  name,
  url,
  time,
  playing,
}: {
  clip: Clip;
  kind: 'video' | 'image';
  name: string;
  url: string;
  time: number;
  playing: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useSyncedMedia(ref, kind === 'video' ? sourceTimeFor(clip, time) : 0, playing && kind === 'video');
  const style = {
    ...getVisualStyle(clip, time),
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
  };

  return kind === 'image' ? (
    <img src={url} alt={name} className="pointer-events-none" style={style} />
  ) : (
    <video
      ref={ref}
      src={url}
      playsInline
      muted
      preload="auto"
      className="pointer-events-none"
      style={style}
    />
  );
}
