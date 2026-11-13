import { supabase } from '@/lib/supabase';
import { createEmptyDoc, isTimelineDoc, type TimelineDoc } from '@/lib/studio/types';
import { toUserError } from '@/lib/errors';
import { getSupportedMediaFile } from '@/lib/studio/media';

export type LoadedProject = { id: string; title: string; document: TimelineDoc; updatedAt: string };

export async function loadStudioProject(id: string): Promise<LoadedProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, document, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw toUserError('studio.load', error);
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    document: isTimelineDoc(data.document) ? data.document : createEmptyDoc(),
    updatedAt: data.updated_at,
  };
}

export async function saveStudioDocument(id: string, doc: TimelineDoc): Promise<string> {
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from('projects')
    .update({ document: doc, updated_at: updatedAt })
    .eq('id', id);
  if (error) throw toUserError('studio.save', error);
  return updatedAt;
}

export async function uploadStudioMedia(
  userId: string,
  projectId: string,
  mediaId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const path = `${userId}/${projectId}/${mediaId}-${safeName}`;
  const supported = getSupportedMediaFile(file);
  if (!supported) throw new Error(`${file.name} is not a supported video, image, or audio file.`);
  const uploadFile = file.type === supported.contentType
    ? file
    : new File([file], file.name, { type: supported.contentType, lastModified: file.lastModified });
  const { error } = await supabase.storage
    .from('studio-media')
    .upload(path, uploadFile, { contentType: supported.contentType, upsert: false });
  if (error) {
    const statusCode = 'statusCode' in error ? String(error.statusCode) : '';
    const message = error.message.toLowerCase();
    if (statusCode === '413' || message.includes('payload too large')) {
      console.error('[studio.upload]', error);
      throw new Error(`${file.name} exceeds this project's upload limit. Try a smaller file or increase the Storage upload limit in Supabase.`);
    }
    if (statusCode === '415' || message.includes('mime type')) {
      console.error('[studio.upload]', error);
      throw new Error(`${file.name} uses a format that this project's media storage does not accept.`);
    }
    throw toUserError('studio.upload', error);
  }
  return path;
}

export async function createMediaUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('studio-media').createSignedUrl(path, 60 * 60);
  if (error || !data) throw toUserError('studio.signedUrl', error ?? new Error('empty signed url'));
  return data.signedUrl;
}

const DRAFT_PREFIX = 'lumora-studio-draft:';

export type StudioDraft = { document: TimelineDoc; savedAt: string };

export function readDraft(projectId: string): StudioDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + projectId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioDraft>;
    if (!isTimelineDoc(parsed.document) || typeof parsed.savedAt !== 'string') return null;
    return { document: parsed.document, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function writeDraft(projectId: string, draft: StudioDraft) {
  try {
    window.localStorage.setItem(DRAFT_PREFIX + projectId, JSON.stringify(draft));
  } catch {
    // Storage can be full or disabled; the cloud save still runs.
  }
}

export function clearDraft(projectId: string) {
  try {
    window.localStorage.removeItem(DRAFT_PREFIX + projectId);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
