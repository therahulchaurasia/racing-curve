'use client';

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { bezierHandles } from '@/lib/bezierPath';

export type ControlPoints = [number, number, number, number];

type Props = {
  value: ControlPoints;
  onChange: (next: ControlPoints) => void;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const BG = '#5e5e5e';
const FRAME = '#2a2a2a';
const GRID = 'rgba(255,255,255,0.06)';
const MID = 'rgba(255,255,255,0.12)';
const GUIDE = 'rgba(255,255,255,0.35)';
const KNOB = 14;
const PAD = KNOB / 2;

const shellClip = `polygon(
  0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
  6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)`;

const knobClip = `polygon(
  4px 0, calc(100% - 4px) 0,
  calc(100% - 4px) 2px, calc(100% - 2px) 2px,
  calc(100% - 2px) 4px, 100% 4px,
  100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px),
  calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px),
  calc(100% - 4px) 100%, 4px 100%,
  4px calc(100% - 2px), 2px calc(100% - 2px),
  2px calc(100% - 4px), 0 calc(100% - 4px),
  0 4px, 2px 4px, 2px 2px, 4px 2px
)`;

export function BezierCurveEditor({ value, onChange }: Props) {
  const [p1x, p1y, p2x, p2y] = value;
  const innerRef = useRef<HTMLDivElement>(null);
  const patId = useId();
  const [innerSize, setInnerSize] = useState(0);
  const [active, setActive] = useState<1 | 2 | null>(null);

  useEffect(() => {
    if (!innerRef.current) return;
    const el = innerRef.current;
    const update = () => setInnerSize(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { h1x, h1y, h2x, h2y } = bezierHandles(value);
  const pathD = `M 0 100 C ${h1x} ${h1y} ${h2x} ${h2y} 100 0`;

  const onPointerDown = (handle: 1 | 2) => (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(handle);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!active || !innerRef.current) return;
    const rect = innerRef.current.getBoundingClientRect();
    const bx = clamp01((e.clientX - rect.left) / rect.width);
    const by = clamp01(1 - (e.clientY - rect.top) / rect.height);
    if (active === 1) onChange([bx, by, p2x, p2y]);
    else onChange([p1x, p1y, bx, by]);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setActive(null);
  };

  return (
    <div
      onPointerMove={onPointerMove}
      style={{
        width: '100%',
        aspectRatio: '1',
        position: 'relative',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: BG,
          clipPath: shellClip,
          boxShadow: `inset 0 0 0 2px ${FRAME}`,
          imageRendering: 'pixelated',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          style={{ position: 'absolute', inset: 2, width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}
        >
          <defs>
            <pattern id={patId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <line x1="20" y1="0" x2="20" y2="20" stroke={GRID} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="20" x2="20" y2="20" stroke={GRID} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill={`url(#${patId})`} />
        </svg>
      </div>

      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          top: PAD,
          left: PAD,
          right: PAD,
          bottom: PAD,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        >
          <line x1={0} y1={100} x2={h1x} y2={h1y} stroke={GUIDE} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <line x1={100} y1={0} x2={h2x} y2={h2y} stroke={GUIDE} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />

          <path
            d={pathD}
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {innerSize > 0 && (
        <>
          <Knob
            left={(h1x / 100) * innerSize}
            top={(h1y / 100) * innerSize}
            onPointerDown={onPointerDown(1)}
            onPointerUp={onPointerUp}
          />
          <Knob
            left={(h2x / 100) * innerSize}
            top={(h2y / 100) * innerSize}
            onPointerDown={onPointerDown(2)}
            onPointerUp={onPointerUp}
          />
        </>
      )}
    </div>
  );
}

function Knob({
  left,
  top,
  onPointerDown,
  onPointerUp,
}: {
  left: number;
  top: number;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        width: KNOB,
        height: KNOB,
        left,
        top,
        background: '#fff',
        clipPath: knobClip,
        imageRendering: 'pixelated',
      }}
    />
  );
}
