import { useEffect, useRef } from 'react';

export type ShortcutHandlers = {
  togglePlay: () => void;
  stepFrames: (direction: -1 | 1, seconds: boolean) => void;
  goToStart: () => void;
  split: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  duplicate: () => void;
  zoom: (direction: -1 | 1) => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function useStudioShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const h = handlersRef.current;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod) {
        if (key === 'z' && !event.shiftKey) h.undo();
        else if ((key === 'z' && event.shiftKey) || key === 'y') h.redo();
        else if (key === 'c') h.copy();
        else if (key === 'v') h.paste();
        else if (key === 'd') h.duplicate();
        else return;
        event.preventDefault();
        return;
      }

      if (event.key === ' ') h.togglePlay();
      else if (event.key === 'ArrowLeft') h.stepFrames(-1, event.shiftKey);
      else if (event.key === 'ArrowRight') h.stepFrames(1, event.shiftKey);
      else if (event.key === 'Home') h.goToStart();
      else if (key === 's') h.split();
      else if (event.key === 'Delete' || event.key === 'Backspace') h.deleteSelected();
      else if (key === '+' || key === '=') h.zoom(1);
      else if (key === '-') h.zoom(-1);
      else return;
      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
