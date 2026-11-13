import { useId } from 'react';
import {
  LETTER_L,
  LETTER_R,
  LOGO_VIEW_BOX,
  commandsToPath,
} from '@/components/brand/lrShape';

const VIEW_BOX = `${LOGO_VIEW_BOX.x} ${LOGO_VIEW_BOX.y} ${LOGO_VIEW_BOX.width} ${LOGO_VIEW_BOX.height}`;
const L_PATH = commandsToPath(LETTER_L);
const R_PATH = commandsToPath(LETTER_R);

type LrGlyphProps = {
  className?: string;
};

export function LrGlyph({ className = '' }: LrGlyphProps) {
  const gradientId = `lr-grad-${useId().replace(/:/g, '')}`;

  return (
    <svg viewBox={VIEW_BOX} className={className} role="img" aria-label="LUMORA">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F3E4FF" />
          <stop offset="0.3" stopColor="#B366FF" />
          <stop offset="0.65" stopColor="#7A10F0" />
          <stop offset="1" stopColor="#2A0062" />
        </linearGradient>
      </defs>
      <path d={L_PATH} fill={`url(#${gradientId})`} />
      <path d={R_PATH} fill={`url(#${gradientId})`} fillRule="evenodd" />
    </svg>
  );
}
