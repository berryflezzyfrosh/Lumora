import { DEFAULT_CLIP_SETTINGS, type Clip, type MediaItem, type TimelineDoc } from '@/lib/studio/types';
import { clipEnd, evaluateClipSettings } from '@/lib/studio/timeline';

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;
const FRAME_RATE = 30;

function waitForVideo(video: HTMLVideoElement) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('A media file took too long to prepare for export.'));
    }, 30_000);
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
    };
    const onReady = () => {
      cleanup();
      resolve(video);
    };
    const onError = () => {
      cleanup();
      reject(new Error('A media file could not be decoded for export.'));
    };
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('An image could not be decoded for export.'));
    image.src = url;
  });
}

function getEffectFilter(effect: NonNullable<Clip['settings']>['effect']) {
  switch (effect) {
    case 'vintage': return 'sepia(35%) saturate(115%) contrast(95%)';
    case 'monochrome': return 'grayscale(100%)';
    case 'warm': return 'sepia(18%) saturate(125%)';
    case 'cool': return 'hue-rotate(15deg) saturate(110%)';
    case 'soft-focus': return 'blur(1.2px) contrast(96%)';
    default: return '';
  }
}

function drawText(
  context: CanvasRenderingContext2D,
  media: MediaItem,
  clip: Clip,
  time: number,
) {
  const settings = evaluateClipSettings(clip, time);
  const elapsed = Math.max(0, time - clip.start);
  const transitionProgress = settings.transitionDuration > 0
    ? Math.min(1, elapsed / settings.transitionDuration)
    : 1;
  const fadeIn = settings.fadeIn > 0 ? Math.min(1, elapsed / settings.fadeIn) : 1;
  const fadeOut = settings.fadeOut > 0 ? Math.min(1, (clipEnd(clip) - time) / settings.fadeOut) : 1;
  const transitionAlpha = settings.transitionIn === 'fade' ? transitionProgress : 1;
  const text = media.text || 'Text overlay';
  const progress = Math.min(1, Math.max(0, elapsed / clip.duration));
  let scale = settings.scale / 100;
  let translateX = 0;
  if (settings.animation === 'zoom-in') scale *= 1 + progress * 0.15;
  if (settings.animation === 'zoom-out') scale *= 1.15 - progress * 0.15;
  if (settings.animation === 'slide-left') translateX = (1 - progress) * OUTPUT_WIDTH;
  if (settings.animation === 'slide-right') translateX = (progress - 1) * OUTPUT_WIDTH;
  if (settings.transitionIn === 'zoom') scale *= 0.8 + transitionProgress * 0.2;

  context.save();
  if (settings.transitionIn === 'wipe-left') {
    context.beginPath();
    context.rect(0, 0, OUTPUT_WIDTH * transitionProgress, OUTPUT_HEIGHT);
    context.clip();
  }
  context.globalAlpha = (settings.opacity / 100) * fadeIn * fadeOut * transitionAlpha;
  context.filter = [
    `brightness(${settings.brightness}%)`,
    `contrast(${settings.contrast}%)`,
    `saturate(${settings.saturation}%)`,
    getEffectFilter(settings.effect),
  ].filter(Boolean).join(' ') || 'none';
  context.translate(OUTPUT_WIDTH / 2 + translateX, OUTPUT_HEIGHT / 2);
  context.rotate((settings.rotation * Math.PI) / 180);
  context.scale(scale, scale);
  context.fillStyle = media.textColor ?? '#ffffff';
  context.strokeStyle = 'rgba(0,0,0,0.8)';
  context.lineWidth = Math.max(2, (media.fontSize ?? 64) / 18);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `700 ${media.fontSize ?? 64}px Inter, Arial, sans-serif`;
  const lines = text.split('\n').slice(0, 4);
  const lineHeight = (media.fontSize ?? 64) * 1.15;
  const firstY = -((lines.length - 1) * lineHeight) / 2;
  for (const [index, line] of lines.entries()) {
    context.strokeText(line, 0, firstY + index * lineHeight, OUTPUT_WIDTH - 100);
    context.fillText(line, 0, firstY + index * lineHeight, OUTPUT_WIDTH - 100);
  }
  context.restore();
}

function drawVisual(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dimensions: { width: number; height: number },
  clip: Clip,
  time: number,
) {
  const settings = evaluateClipSettings(clip, time);
  const elapsed = time - clip.start;
  const progress = Math.min(1, Math.max(0, elapsed / clip.duration));
  const transitionProgress = settings.transitionDuration > 0
    ? Math.min(1, Math.max(0, elapsed / settings.transitionDuration))
    : 1;
  const fadeIn = settings.fadeIn > 0 ? Math.min(1, elapsed / settings.fadeIn) : 1;
  const fadeOut = settings.fadeOut > 0 ? Math.min(1, (clipEnd(clip) - time) / settings.fadeOut) : 1;
  const transitionAlpha = settings.transitionIn === 'fade' ? transitionProgress : 1;
  let scale = settings.scale / 100;
  if (settings.animation === 'zoom-in') scale *= 1 + progress * 0.15;
  if (settings.animation === 'zoom-out') scale *= 1.15 - progress * 0.15;
  if (settings.transitionIn === 'zoom') scale *= 0.8 + transitionProgress * 0.2;
  const fit = Math.min(OUTPUT_WIDTH / dimensions.width, OUTPUT_HEIGHT / dimensions.height) * scale;
  const width = dimensions.width * fit;
  const height = dimensions.height * fit;
  const filter = [
    `brightness(${settings.brightness}%)`,
    `contrast(${settings.contrast}%)`,
    `saturate(${settings.saturation}%)`,
    getEffectFilter(settings.effect),
  ].filter(Boolean).join(' ');

  context.save();
  if (settings.transitionIn === 'wipe-left') {
    context.beginPath();
    context.rect(0, 0, OUTPUT_WIDTH * transitionProgress, OUTPUT_HEIGHT);
    context.clip();
  }
  context.globalAlpha = (settings.opacity / 100) * fadeIn * fadeOut * transitionAlpha;
  context.filter = filter || 'none';
  context.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2);
  context.rotate((settings.rotation * Math.PI) / 180);
  context.drawImage(source, -width / 2, -height / 2, width, height);
  context.restore();
}

export async function exportTimeline(
  doc: TimelineDoc,
  urls: Record<string, string>,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error('Video export is not supported by this browser. Try a current version of Chrome or Edge.');
  }
  const clips = doc.clips.filter((clip) => doc.media.some((media) => media.id === clip.mediaId));
  if (clips.length === 0) throw new Error('Add at least one clip before exporting.');
  const duration = Math.max(...clips.map(clipEnd));
  const mediaById = new Map(doc.media.map((media) => [media.id, media]));
  const imageSources = new Map<string, HTMLImageElement>();
  const videoSources = new Map<string, HTMLVideoElement>();
  const playbackTimers: number[] = [];
  const canvas = window.document.createElement('canvas');
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the video export canvas.');

  const videoMedia = new Set(
    clips.map((clip) => mediaById.get(clip.mediaId)).filter((media): media is MediaItem => media?.kind === 'video'),
  );
  const imageMedia = new Set(
    clips.map((clip) => mediaById.get(clip.mediaId)).filter((media): media is MediaItem => media?.kind === 'image'),
  );
  const audioClips = clips.filter((clip) => mediaById.get(clip.mediaId)?.kind === 'audio');
  const preparedAudio: Array<{ clip: Clip; buffer: AudioBuffer }> = [];
  let audioContext: AudioContext | null = null;
  let recordingStream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;

  try {
    if (audioClips.length > 0) {
      audioContext = new window.AudioContext();
      await audioContext.resume();
    }

    await Promise.all([
      ...[...imageMedia].map(async (media) => {
        const url = urls[media.id];
        if (!url) throw new Error(`${media.name} is not ready to export.`);
        imageSources.set(media.id, await loadImage(url));
      }),
      ...[...videoMedia].map(async (media) => {
        const url = urls[media.id];
        if (!url) throw new Error(`${media.name} is not ready to export.`);
        const video = window.document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        videoSources.set(media.id, video);
        const ready = waitForVideo(video);
        video.src = url;
        await ready;
      }),
      ...audioClips.map(async (clip) => {
        const media = mediaById.get(clip.mediaId);
        const url = media ? urls[media.id] : undefined;
        if (!url) throw new Error(`${media?.name ?? 'Audio'} is not ready to export.`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${media?.name ?? 'Audio'} could not be downloaded for export.`);
        const buffer = await audioContext!.decodeAudioData(await response.arrayBuffer());
        preparedAudio.push({ clip, buffer });
      }),
    ]);

    const canvasStream = canvas.captureStream(FRAME_RATE);
    const streams = [...canvasStream.getVideoTracks()];
    if (audioClips.length > 0) {
      const activeAudioContext = audioContext;
      if (!activeAudioContext) throw new Error('Audio export could not be initialized.');
      const destination = activeAudioContext.createMediaStreamDestination();
      for (const { clip, buffer } of preparedAudio) {
        if (clip.offset >= buffer.duration) continue;
        const source = activeAudioContext.createBufferSource();
        source.buffer = buffer;
        const playbackDuration = Math.min(clip.duration, buffer.duration - clip.offset);
        const gain = activeAudioContext.createGain();
        const settings = { ...DEFAULT_CLIP_SETTINGS, ...clip.settings };
        const startAt = activeAudioContext.currentTime + clip.start;
        const endAt = startAt + playbackDuration;
        const targetVolume = settings.volume / 100;
        gain.gain.setValueAtTime(settings.fadeIn > 0 ? 0 : targetVolume, startAt);
        if (settings.fadeIn > 0) {
          gain.gain.linearRampToValueAtTime(targetVolume, startAt + Math.min(settings.fadeIn, playbackDuration));
        }
        if (settings.fadeOut > 0) {
          gain.gain.setValueAtTime(targetVolume, Math.max(startAt, endAt - Math.min(settings.fadeOut, playbackDuration)));
          gain.gain.linearRampToValueAtTime(0, endAt);
        }
        source.connect(gain);
        gain.connect(destination);
        source.start(startAt, clip.offset, playbackDuration);
      }
      streams.push(...destination.stream.getAudioTracks());
      await activeAudioContext.resume();
    }

    recordingStream = new MediaStream(streams);
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!mimeType) throw new Error('This browser does not support a compatible WebM video encoder.');
    recorder = new MediaRecorder(recordingStream, { mimeType });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const recordingComplete = new Promise<Blob>((resolve, reject) => {
      if (!recorder) {
        reject(new Error('Video recorder failed to initialize.'));
        return;
      }
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = () => reject(new Error('Video export failed while recording.'));
    });

    for (const clip of clips) {
      const media = mediaById.get(clip.mediaId);
      if (media?.kind !== 'video') continue;
      const video = videoSources.get(media.id);
      if (!video) continue;
      playbackTimers.push(window.setTimeout(() => {
        video.currentTime = clip.offset;
        void video.play().catch(() => undefined);
      }, Math.max(0, clip.start * 1000)));
      playbackTimers.push(window.setTimeout(() => video.pause(), Math.max(0, clipEnd(clip) * 1000)));
    }

    recorder.start(250);
    const startedAt = performance.now();
    let lastProgressUpdate = 0;
    await new Promise<void>((resolve, reject) => {
      const render = (now: number) => {
        try {
          const time = Math.min(duration, (now - startedAt) / 1000);
          context.fillStyle = '#000000';
          context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
          const active = clips
            .filter((clip) => clip.start <= time && time < clipEnd(clip))
            .sort((left, right) => {
              const leftIndex = doc.tracks.findIndex((track) => track.id === left.trackId);
              const rightIndex = doc.tracks.findIndex((track) => track.id === right.trackId);
              return rightIndex - leftIndex;
            });
          for (const clip of active) {
            const media = mediaById.get(clip.mediaId);
            if (!media || media.kind === 'audio') continue;
            if (media.kind === 'text') {
              drawText(context, media, clip, time);
              continue;
            }
            if (media.kind === 'image') {
              const image = imageSources.get(media.id);
              if (image) drawVisual(context, image, { width: image.naturalWidth, height: image.naturalHeight }, clip, time);
              continue;
            }
            const video = videoSources.get(media.id);
            if (video?.readyState && video.videoWidth > 0) {
              drawVisual(context, video, { width: video.videoWidth, height: video.videoHeight }, clip, time);
            }
          }
          if (now - lastProgressUpdate >= 250 || time >= duration) {
            lastProgressUpdate = now;
            onProgress(time / duration);
          }
          if (time >= duration) {
            resolve();
            return;
          }
          requestAnimationFrame(render);
        } catch (caught) {
          reject(caught);
        }
      };
      requestAnimationFrame(render);
    });
    if (recorder.state !== 'inactive') recorder.stop();
    return await recordingComplete;
  } finally {
    if (recorder?.state !== 'inactive') recorder?.stop();
    playbackTimers.forEach(window.clearTimeout);
    videoSources.forEach((element) => {
      element.pause();
      element.removeAttribute('src');
      element.load();
    });
    recordingStream?.getTracks().forEach((track) => track.stop());
    await audioContext?.close();
  }
}
