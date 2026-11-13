import { useCallback, useEffect, useRef, useState } from 'react';
import { clearDraft, saveStudioDocument, writeDraft } from '@/lib/studio/persistence';
import type { TimelineDoc } from '@/lib/studio/types';

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

const SAVE_DELAY_MS = 1500;

function errorText(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Something went wrong.';
}

export function useAutosave(projectId: string, doc: TimelineDoc, baseline: TimelineDoc) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef(baseline);
  const latestRef = useRef(doc);
  latestRef.current = doc;

  const saveNow = useCallback(async () => {
    const snapshot = latestRef.current;
    if (snapshot === savedRef.current) {
      setStatus('saved');
      return;
    }
    setStatus('saving');
    setError(null);
    try {
      await saveStudioDocument(projectId, snapshot);
      savedRef.current = snapshot;
      if (latestRef.current === snapshot) {
        clearDraft(projectId);
        setStatus('saved');
      } else {
        setStatus('dirty');
      }
    } catch (caught) {
      setError(errorText(caught));
      setStatus('error');
    }
  }, [projectId]);

  useEffect(() => {
    if (doc === savedRef.current) return;
    writeDraft(projectId, { document: doc, savedAt: new Date().toISOString() });
    setStatus('dirty');
    const timer = window.setTimeout(() => void saveNow(), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [doc, projectId, saveNow]);

  return { status, error, retry: saveNow };
}
