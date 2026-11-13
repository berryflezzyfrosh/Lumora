import { LrGlyph } from '@/components/brand/LrMark';
import { Link } from '@/lib/router';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  withWordmark?: boolean;
  to?: string;
};

const sizes = {
  sm: { glyph: 'h-6 w-8', text: 'text-base' },
  md: { glyph: 'h-8 w-11', text: 'text-lg' },
  lg: { glyph: 'h-12 w-16', text: 'text-2xl' },
};

export function LogoMark({ size = 'md' }: { size?: LogoProps['size'] }) {
  return <LrGlyph className={`${sizes[size ?? 'md'].glyph} drop-shadow-[0_6px_14px_rgba(128,0,255,0.45)]`} />;
}

export default function Logo({ size = 'md', withWordmark = true, to = '/' }: LogoProps) {
  const s = sizes[size];
  return (
    <Link to={to} className="group inline-flex items-center gap-3" aria-label="LUMORA home">
      <span className="transition duration-500 group-hover:-rotate-6 group-hover:scale-105">
        <LogoMark size={size} />
      </span>
      {withWordmark && (
        <span className={`font-display ${s.text} font-bold tracking-[0.18em] text-ink`}>LUMORA</span>
      )}
    </Link>
  );
}
