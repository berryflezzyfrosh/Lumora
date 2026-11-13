import type { MediaKind } from '@/lib/studio/types';

export const MAX_MEDIA_BYTES = 500 * 1024 * 1024;
export const DEFAULT_IMAGE_DURATION = 5;

const KIND_BY_MIME: Record<string, MediaKind> = {
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/mp4': 'audio',
  'audio/ogg': 'audio',
};

export type ProbedMedia = { kind: MediaKind; duration: number };

export function validateMediaFile(file: File): string | null {
  if (!KIND_BY_MIME[file.type]) return `${file.name} is not a supported video, image, or audio file.`;
  if (file.size > MAX_MEDIA_BYTES) return `${file.name} is larger than 500 MB.`;
  return null;
}

export async function probeMediaFile(file: File): Promise<ProbedMedia> {
  const kind = KIND_BY_MIME[file.type];
  if (!kind) throw new Error(`${file.name} is not a supported file type.`);
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
