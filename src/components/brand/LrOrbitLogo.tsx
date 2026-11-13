const LOGO_IMAGE_URL = `${import.meta.env.BASE_URL}lumora-logo.png`;

type LrOrbitLogoProps = {
  className?: string;
};

export function LrOrbitLogo({ className = '' }: LrOrbitLogoProps) {
  return (
    <img
      src={LOGO_IMAGE_URL}
      alt="LUMORA"
      draggable={false}
      className={`object-contain ${className}`}
    />
  );
}
