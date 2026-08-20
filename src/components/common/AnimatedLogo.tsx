import React from 'react';
import { clsx } from 'clsx';

interface AnimatedLogoProps {
  /**
   * Rendered edge length in pixels. The mark is square and drawn on a 0 0 64 64
   * grid, so it scales cleanly to any size; 32 is the header lockup.
   */
  size?: number;
  className?: string;
}

/**
 * The four cells the hash carves out, in reading order (top-left, top-right,
 * bottom-left, bottom-right). The descending opacity is the mark's ramp and is
 * authored on the <rect> itself, NOT in the keyframes — see src/index.css:
 * the animation lives on the wrapping <g>, and the two opacities multiply, so
 * one keyframe set drives all four cells while each keeps its own resting
 * value.
 */
const SWATCH_CELLS: ReadonlyArray<{ x: number; y: number; opacity: number }> = [
  { x: 4, y: 4, opacity: 1 },
  { x: 46, y: 4, opacity: 0.62 },
  { x: 4, y: 46, opacity: 0.38 },
  { x: 46, y: 46, opacity: 0.22 },
];

/** The hash strokes: two vertical bars, two horizontal, all edge to edge. */
const GRID_BARS: ReadonlyArray<{ x: number; y: number; width: number; height: number }> = [
  { x: 18, y: 4, width: 6, height: 56 },
  { x: 40, y: 4, width: 6, height: 56 },
  { x: 4, y: 18, width: 56, height: 6 },
  { x: 4, y: 40, width: 56, height: 6 },
];

/**
 * The product mark: a hash — the character that is at once the Markdown heading
 * marker and the hex-colour prefix, which is the bridge this tool crosses — with
 * the four cells it carves out filled as colour swatches.
 *
 * Fills come from the theme variables rather than the hex in docs/logo.svg, so
 * the mark follows light and dark mode with no second colour path.
 *
 * Always `aria-hidden`: the adjacent "Design.md" wordmark already names the
 * product, and a second accessible name here would only duplicate it.
 */
export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 32, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    aria-hidden="true"
    className={clsx('shrink-0', className)}
  >
    {/* Grouped so the stagger in src/index.css can index the swatches by
        position without the hash strokes shifting the count. */}
    <g>
      {SWATCH_CELLS.map(cell => (
        <g key={`${cell.x}-${cell.y}`} className="logo-mark__swatch">
          <rect
            x={cell.x}
            y={cell.y}
            width={14}
            height={14}
            rx={2}
            fill="rgb(var(--accent))"
            opacity={cell.opacity}
          />
        </g>
      ))}
    </g>

    {/* The structure. Deliberately never animated: the document's shape is what
        stays fixed while the values resolve into it. */}
    <g fill="rgb(var(--accent-hover))">
      {GRID_BARS.map(bar => (
        <rect key={`${bar.x}-${bar.y}`} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={1.5} />
      ))}
    </g>
  </svg>
);
