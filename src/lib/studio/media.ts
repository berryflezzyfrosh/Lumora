import type { MediaKind } from '@/lib/studio/types';

export const MAX_MEDIA_BYTES = 500 * 1024 * 1024;
export const DEFAULT_IMAGE_DURATION = 5;

type SupportedMediaFile = { kind: Exclude<MediaKind, 'text'>; contentType: string };

const MIME_TYPES: Record<string, SupportedMediaFile> = {
  'video/mp4': { kind: 'video', contentType: 'video/mp4' },
  'video/webm': { kind: 'video', contentType: 'video/webm' },
  'video/quicktime': { kind: 'video', contentType: 'video/quicktime' },
  'video/x-m4v': { kind: 'video', contentType: 'video/mp4' },
  'image/jpeg': { kind: 'image', contentType: 'image/jpeg' },
  'image/jpg': { kind: 'image', contentType: 'image/jpeg' },
  'image/pjpeg': { kind: 'image', contentType: 'image/jpeg' },
  'image/png': { kind: 'image', contentType: 'image/png' },
  'image/webp': { kind: 'image', contentType: 'image/webp' },
  'image/gif': { kind: 'image', contentType: 'image/gif' },
  'audio/mpeg': { kind: 'audio', contentType: 'audio/mpeg' },
  'audio/wav': { kind: 'audio', contentType: 'audio/wav' },
  'audio/x-wav': { kind: 'audio', contentType: 'audio/wav' },
  'audio/wave': { kind: 'audio', contentType: 'audio/wav' },
  'audio/mp4': { kind: 'audio', contentType: 'audio/mp4' },
  'audio/x-m4a': { kind: 'audio', contentType: 'audio/mp4' },
  'audio/ogg': { kind: 'audio', contentType: 'audio/ogg' },
};

const MEDIA_BY_EXTENSION: Record<string, SupportedMediaFile> = {
  mp4: MIME_TYPES['video/mp4'],
  m4v: MIME_TYPES['video/mp4'],
  webm: MIME_TYPES['video/webm'],
  mov: MIME_TYPES['video/quicktime'],
  qt: MIME_TYPES['video/quicktime'],
  jpg: MIME_TYPES['image/jpeg'],
  jpeg: MIME_TYPES['image/jpeg'],
  jpe: MIME_TYPES['image/jpeg'],
  png: MIME_TYPES['image/png'],
  webp: MIME_TYPES['image/webp'],
  gif: MIME_TYPES['image/gif'],
  mp3: MIME_TYPES['audio/mpeg'],
  wav: MIME_TYPES['audio/wav'],
  m4a: MIME_TYPES['audio/mp4'],
  ogg: MIME_TYPES['audio/ogg'],
  oga: MIME_TYPES['audio/ogg'],
};

export type ProbedMedia = { kind: MediaKind; duration: number };

export function getSupportedMediaFile(file: File): SupportedMediaFile | null {
  const mimeType = file.type.split(';', 1)[0].trim().toLowerCase();
  const byMime = MIME_TYPES[mimeType];
  if (byMime) return byMime;

  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? MEDIA_BY_EXTENSION[extension] ?? null : null;
}

export function validateMediaFile(file: File): string | null {
  if (!getSupportedMediaFile(file)) return `${file.name} is not a supported video, image, or audio file.`;
  if (file.size > MAX_MEDIA_BYTES) return `${file.name} is larger than 500 MB.`;
  return null;
}

export async function probeMediaFile(file: File): Promise<ProbedMedia> {
  const supported = getSupportedMediaFile(file);
  if (!supported) throw new Error(`${file.name} is not a supported file type.`);
  const { kind } = supported;
  if (kind === 'image') {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error(`${file.name} could not be read. Try a different file.`);
      }
      return { kind, duration: DEFAULT_IMAGE_DURATION };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (kind !== 'video' && kind !== 'audio') {
    throw new Error(`${file.name} is not a supported media file.`);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const element = document.createElement(kind);
    element.preload = 'metadata';

    const cleanup = () => {
      element.removeAttribute('src');
      element.load();
      URL.revokeObjectURL(url);
    };

    element.onloadedmetadata = () => {
      const duration = element.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error(`${file.name} could not be read. Try a different file.`));
        return;
      }
      resolve({ kind, duration });
    };
    element.onerror = () => {
      cleanup();
      reject(new Error(`${file.name} could not be read. Try a different file.`));
    };
    element.src = url;
  });
}
