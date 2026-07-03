// A lightweight, stylized Fidelity-style brand mark for the demo — a gold disc
// with a white "spark" and pyramid, paired with a green wordmark. Drawn as
// original SVG geometry (not the trademarked artwork) purely as a branding
// element for this internal mock.

const GOLD = '#b58a34'
const CREAM = '#fffef8'
const CREAM_2 = '#f0e4c6'

export function FidelityMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Fidelity"
    >
      <circle cx="32" cy="32" r="32" fill={GOLD} />
      {/* spark rays fanning up from the pyramid apex */}
      <g stroke={CREAM} strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="25" x2="32" y2="9" />
        <line x1="32" y1="25" x2="23" y2="12" />
        <line x1="32" y1="25" x2="41" y2="12" />
        <line x1="32" y1="25" x2="16" y2="18" />
        <line x1="32" y1="25" x2="48" y2="18" />
        <line x1="32" y1="25" x2="12" y2="27" />
        <line x1="32" y1="25" x2="52" y2="27" />
      </g>
      {/* pyramid with a lit central path */}
      <path d="M32 25 L46 51 L18 51 Z" fill={CREAM} />
      <path d="M32 25 L36 51 L28 51 Z" fill={CREAM_2} />
    </svg>
  )
}

export function FidelityLogo({
  size = 30,
  className,
  subtitle,
}: {
  size?: number
  className?: string
  subtitle?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <FidelityMark size={size} className="shrink-0" />
      <div className="leading-none">
        <span
          className="font-serif italic font-semibold tracking-tight text-brand"
          style={{ fontSize: size * 0.72 }}
        >
          Fidelity
        </span>
        {subtitle && (
          <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

/** A large, very faint mark for use as a background watermark. Position with a
 *  wrapping absolutely-positioned container. */
export function FidelityWatermark({
  size = 460,
  className,
  opacity = 0.05,
}: {
  size?: number
  className?: string
  opacity?: number
}) {
  return (
    <div
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{ opacity }}
      aria-hidden
    >
      <FidelityMark size={size} />
    </div>
  )
}
