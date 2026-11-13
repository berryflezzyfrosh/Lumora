import { useCallback, useEffect, useRef, useState } from 'react';

export function usePlayhead(endTime: number) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timeRef = useRef(0);

  const seek = useCallback((next: number) => {
    const clamped = Math.min(Math.max(0, next), endTime);
    timeRef.current = clamped;
    setTime(clamped);
  }, [endTime]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      const next = timeRef.current + elapsed;
      if (next >= endTime) {
        timeRef.current = endTime;
        setTime(endTime);
        setPlaying(false);
        return;
      }
      timeRef.current = next;
      setTime(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, endTime]);

  const togglePlaying = useCallback(() => {
    setPlaying((value) => !value);
  }, []);

  const stop = useCallback(() => setPlaying(false), []);

  return { time, playing, seek, togglePlaying, stop };
}
