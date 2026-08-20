import React, { useId, useState } from 'react';
import { clsx } from 'clsx';

export interface RadarAxisDatum {
  id: string;
  /** Axis name, drawn next to the spoke. */
  label: string;
  /** 0 - 100. Every axis must share this unit and this direction of good. */
  percent: number;
  /** The raw counts behind the percentage, surfaced in the tooltip. */
  detail: string;
}

interface RadarChartProps {
  axes: RadarAxisDatum[];
  /** Spoken equivalent of the polygon. The chart is `role="img"`, so this is what it announces. */
  ariaLabel: string;
  className?: string;
}

/**
 * The drawing is authored in viewBox units and scaled by CSS, so every constant below is a
 * proportion of the same box rather than a pixel promise. Width leaves room for the longest
 * axis label to sit outside the outer ring without clipping.
 */
const VIEWBOX_WIDTH = 460;
const VIEWBOX_HEIGHT = 340;
const CENTER_X = 230;
const CENTER_Y = 162;
const RADIUS = 108;
/** Gap between the outer ring and the axis label block. */
const LABEL_OFFSET = 22;
/** Rings are the reference grid; the data polygon is the only thing drawn in the accent. */
const RING_PERCENTS = [25, 50, 75, 100];
/** A radar needs at least a triangle. Below that the shape is meaningless. */
const MIN_AXES = 3;

interface Point {
  x: number;
  y: number;
}

function vertexAt(index: number, total: number, radius: number): Point {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: CENTER_X + radius * Math.cos(angle), y: CENTER_Y + radius * Math.sin(angle) };
}

function polygonPoints(total: number, radius: number): string {
  return Array.from({ length: total }, (_, index) => {
    const { x, y } = vertexAt(index, total, radius);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/**
 * A single-series radar chart drawn by hand - no charting dependency, no inline script.
 *
 * Two layers sit on top of each other: the SVG, which is `role="img"` and therefore presentational
 * all the way down, and an HTML layer of real buttons pinned to each vertex. That split is what
 * lets the shape carry one summarising label for assistive technology while the vertices stay
 * genuinely focusable and operable by keyboard, instead of hiding interactive nodes inside an
 * image role. The same numbers are expected to appear as text next to the chart; this component
 * draws the shape, it is not the accessible record of the data.
 */
export const RadarChart: React.FC<RadarChartProps> = ({ axes, ariaLabel, className }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tooltipId = useId();

  if (axes.length < MIN_AXES) return null;

  const total = axes.length;
  const activeAxis = activeIndex === null ? null : axes[activeIndex];
  const activePoint =
    activeIndex === null ? null : vertexAt(activeIndex, total, (RADIUS * axes[activeIndex].percent) / 100);

  function clearIfActive(index: number) {
    setActiveIndex(current => (current === index ? null : current));
  }

  return (
    <div className={clsx('relative', className)}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        className="block w-full h-auto"
      >
        {/* Grid: deliberately quieter than the data it measures. */}
        <g fill="none" strokeWidth={1}>
          {RING_PERCENTS.map(ring => (
            <polygon
              key={ring}
              points={polygonPoints(total, (RADIUS * ring) / 100)}
              className={ring === 100 ? 'stroke-line' : 'stroke-line-subtle'}
            />
          ))}
          {axes.map((axis, index) => {
            const spoke = vertexAt(index, total, RADIUS);
            return (
              <line
                key={axis.id}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={spoke.x.toFixed(2)}
                y2={spoke.y.toFixed(2)}
                className="stroke-line-subtle"
              />
            );
          })}
        </g>

        {/* The single data series. No legend: the section heading names it. */}
        <polygon
          points={axes
            .map((axis, index) => {
              const { x, y } = vertexAt(index, total, (RADIUS * axis.percent) / 100);
              return `${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join(' ')}
          strokeWidth={2}
          strokeLinejoin="round"
          className="fill-accent/15 stroke-accent"
        />

        {/* Axis labels: name, then the reading in tabular figures so the digits line up. */}
        <g>
          {axes.map((axis, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const anchor = Math.abs(dx) < 0.08 ? 'middle' : dx > 0 ? 'start' : 'end';
            const label = vertexAt(index, total, RADIUS + LABEL_OFFSET);
            // A label directly above or below the ring needs to clear it vertically instead.
            const nameY = label.y + (dy < -0.9 ? -4 : dy > 0.9 ? 12 : 0);
            return (
              <g key={axis.id}>
                <text
                  x={label.x.toFixed(2)}
                  y={nameY.toFixed(2)}
                  textAnchor={anchor}
                  className="fill-content-secondary text-[11px] font-sans font-semibold"
                >
                  {axis.label}
                </text>
                <text
                  x={label.x.toFixed(2)}
                  y={(nameY + 14).toFixed(2)}
                  textAnchor={anchor}
                  className="fill-content-primary text-[11px] font-mono tabular-nums"
                >
                  {axis.percent}%
                </text>
              </g>
            );
          })}
        </g>

        {/* Vertex markers. The active one changes size as well as tint, so the highlight is not
            carried by colour alone. */}
        <g>
          {axes.map((axis, index) => {
            const { x, y } = vertexAt(index, total, (RADIUS * axis.percent) / 100);
            const isActive = index === activeIndex;
            return (
              <g key={axis.id}>
                {isActive && <circle cx={x} cy={y} r={9} className="fill-accent/25" />}
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 5.5 : 4}
                  strokeWidth={2}
                  className="fill-accent stroke-surface-raised"
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Interactive layer. Real buttons, 24px across, so the vertices are reachable by keyboard
          and not only by hover. */}
      {axes.map((axis, index) => {
        const { x, y } = vertexAt(index, total, (RADIUS * axis.percent) / 100);
        return (
          <button
            key={axis.id}
            type="button"
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${(x / VIEWBOX_WIDTH) * 100}%`, top: `${(y / VIEWBOX_HEIGHT) * 100}%` }}
            aria-label={`${axis.label}: ${axis.percent} percent. ${axis.detail}.`}
            aria-describedby={index === activeIndex ? tooltipId : undefined}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => clearIfActive(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => clearIfActive(index)}
            onKeyDown={event => {
              if (event.key === 'Escape') clearIfActive(index);
            }}
          />
        );
      })}

      {activeAxis && activePoint && (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute z-10 w-max max-w-[220px] rounded-md border border-line bg-surface-overlay px-3 py-2 shadow-deep"
          style={{
            left: `${(activePoint.x / VIEWBOX_WIDTH) * 100}%`,
            top: `${(activePoint.y / VIEWBOX_HEIGHT) * 100}%`,
            // Anchored to the vertex, then nudged so it never leaves the chart box: it flips
            // below a vertex in the upper half, and hugs the near edge on the outer columns.
            transform: `translate(${
              activePoint.x / VIEWBOX_WIDTH < 0.3
                ? '-12%'
                : activePoint.x / VIEWBOX_WIDTH > 0.7
                  ? '-88%'
                  : '-50%'
            }, ${activePoint.y < CENTER_Y ? 'calc(0% + 16px)' : 'calc(-100% - 16px)'})`,
          }}
        >
          <div className="text-xs font-semibold text-content-primary font-heading">{activeAxis.label}</div>
          <div className="font-mono tabular-nums text-sm text-accent">{activeAxis.percent}%</div>
          <div className="mt-0.5 text-[11px] leading-snug text-content-secondary">{activeAxis.detail}</div>
        </div>
      )}
    </div>
  );
};
