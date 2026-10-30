import clsx from 'clsx';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * Medallón de marca (`public/brand/icon.svg`) — fondo propio, se lee
 * igual en tema claro u oscuro. El wordmark usa el token `text-ink` del
 * sistema de diseño en vez del `logo.svg` horizontal (ese es tinta fija
 * sobre transparente, pensado para superficies claras, no para el sidebar
 * oscuro de la app).
 */
export function Logo({ size = 32, withWordmark = false, className }: LogoProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <img
        src="/brand/icon.svg"
        width={size}
        height={size}
        alt={withWordmark ? '' : 'Ni Un Cinco'}
        className="shrink-0"
      />
      {withWordmark ? <span className="text-lg font-semibold text-ink">Ni Un Cinco</span> : null}
    </div>
  );
}
