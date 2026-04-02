// ─── Tunables ────────────────────────────────────────────────────────────────
const W          = 150     // total SVG width (matches span width)
const BASE_Y     = 80      // y-anchor for the arc (bottom center)
const INNER_R    = 8       // innermost band center radius
const OUTER_R    = 68      // outermost band center radius
const BAND_STROKE = 14     // stroke width per band (slight overlap = no gaps)
const BORDER_W   = 3       // white border stroke width
const HEART_R    = 46      // heart size (overflows both arc edges)
const HEART_FILL = '#ff1493'
const HEART_BORDER = 'white'
const HEART_BORDER_W = 5
// ─────────────────────────────────────────────────────────────────────────────

const BANDS = [
  '#ff0000', // red   (outermost)
  '#ff8c00', // orange
  '#ffff00', // yellow
  '#00cc00', // green
  '#0055ff', // blue
  '#8800ff', // violet (innermost)
]

function buildHeartPath(hx, hy, R) {
  // Lobes reach hy - R*1.1 → overflows outer arc border
  // Tip reaches hy + R    → overflows inner arc border
  return `
    M ${hx},${hy - R * 0.5}
    C ${hx - R * 0.3},${hy - R * 1.1}
      ${hx - R},${hy - R * 0.85}
      ${hx - R},${hy}
    C ${hx - R},${hy + R * 0.55}
      ${hx},${hy + R}
      ${hx},${hy + R}
    C ${hx},${hy + R}
      ${hx + R},${hy + R * 0.55}
      ${hx + R},${hy}
    C ${hx + R},${hy - R * 0.85}
      ${hx + R * 0.3},${hy - R * 1.1}
      ${hx},${hy - R * 0.5} Z
  `
}

const RainbowHeart = () => {
  const cx   = W / 2
  const step = (OUTER_R - INNER_R) / (BANDS.length - 1)  // ~12

  // Arc path helper
  const arc = (r) =>
    `M ${cx - r},${BASE_Y} A ${r},${r} 0 0,1 ${cx + r},${BASE_Y}`

  // Heart: centered at the 90° midpoint of the arc
  const midR = (OUTER_R + INNER_R) / 2   // 38
  const hx   = cx
  const hy   = BASE_Y - midR              // 80 - 38 = 42
  const hp   = buildHeartPath(hx, hy, HEART_R)

  return (
    <div style={{ width: W, lineHeight: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${BASE_Y + 4}`}
        width={W}
        height={BASE_Y + 4}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* ── Rainbow bands (inner → outer so outer draws on top) ── */}
        {BANDS.map((color, i) => {
          const r = INNER_R + i * step
          return (
            <path
              key={i}
              d={arc(r)}
              fill="none"
              stroke={color}
              strokeWidth={BAND_STROKE}
              strokeLinecap="round"
            />
          )
        })}

        {/* ── White outer border ── */}
        <path
          d={arc(OUTER_R + 6)}
          fill="none"
          stroke="white"
          strokeWidth={BORDER_W}
          strokeLinecap="round"
        />

        {/* ── White inner border ── */}
        <path
          d={arc(Math.max(INNER_R - 5, 2))}
          fill="none"
          stroke="white"
          strokeWidth={BORDER_W}
          strokeLinecap="round"
        />

        {/* ── Heart: white border pass first, then fill ── */}
        <path
          d={hp}
          fill="none"
          stroke={HEART_BORDER}
          strokeWidth={HEART_BORDER_W}
          strokeLinejoin="round"
        />
        <path d={hp} fill={HEART_FILL} />
      </svg>
    </div>
  )
}

export default RainbowHeart
