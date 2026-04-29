import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useSolPrice } from '../../hooks/useSolPrice';

interface AssetChartProps {
  /** Slice price in USD (numeric) */
  priceUsd: number;
  /** Yield string e.g. "11.5%" */
  apyStr: string;
  /** Projection window in years (default: 5) */
  years?: number;
}

// Layout constants (SVG coordinate space)
const VW = 600;
const VH = 190;
const PAD = { top: 16, right: 20, bottom: 36, left: 58 };
const CW = VW - PAD.left - PAD.right; // chart width
const CH = VH - PAD.top - PAD.bottom;  // chart height

function buildPath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
}

function buildAreaPath(points: [number, number][], baselineY: number): string {
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last[0].toFixed(2)} ${baselineY.toFixed(2)} L ${first[0].toFixed(2)} ${baselineY.toFixed(2)} Z`;
}

function fmtPrice(val: number, isSol: boolean): string {
  if (isSol) {
    return val < 0.01 ? `◎${val.toFixed(5)}` : `◎${val.toFixed(3)}`;
  }
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

export default function AssetChart({ priceUsd, apyStr, years = 5 }: AssetChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const { currency } = useCurrency();
  const { toSol } = useSolPrice();
  const isSol = currency === 'SOL';

  // Parse APY
  const apy = useMemo(() => {
    const n = parseFloat(apyStr.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n / 100;
  }, [apyStr]);

  const totalMonths = years * 12;

  // Generate monthly data points (both series)
  const data = useMemo(() => {
    return Array.from({ length: totalMonths + 1 }, (_, m) => {
      const projected = priceUsd * Math.pow(1 + apy / 12, m);
      const raw = priceUsd;
      const convert = (v: number) => {
        if (isSol) { const s = toSol(v); return s ?? v; }
        return v;
      };
      return { month: m, projected: convert(projected), baseline: convert(raw) };
    });
  }, [priceUsd, apy, totalMonths, isSol, toSol]);

  const yMin = useMemo(() => data[0].baseline * 0.97, [data]);
  const yMax = useMemo(() => data[data.length - 1].projected * 1.04, [data]);

  // Map data → SVG coordinates
  const toX = (m: number) => PAD.left + (m / totalMonths) * CW;
  const toY = (v: number) => PAD.top + CH - ((v - yMin) / (yMax - yMin)) * CH;

  const projectedPoints: [number, number][] = data.map(d => [toX(d.month), toY(d.projected)]);
  const baselineY = toY(data[0].baseline);

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const range = yMax - yMin;
    const mid = yMin + range / 2;
    return [yMin, mid, yMax].map(v => ({ value: v, y: toY(v) }));
  }, [yMin, yMax]);

  // X-axis: one label per year
  const xTicks = Array.from({ length: years + 1 }, (_, i) => ({
    year: i,
    x: toX(i * 12),
  }));

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = VW / rect.width;
    const rawX = (e.clientX - rect.left) * scaleX;
    const chartX = rawX - PAD.left;
    const month = Math.max(0, Math.min(totalMonths, Math.round((chartX / CW) * totalMonths)));
    setHoverMonth(month);
  }, [totalMonths]);

  const hoverData = hoverMonth !== null ? data[hoverMonth] : null;
  const hoverX = hoverMonth !== null ? toX(hoverMonth) : null;
  const hoverProjY = hoverData ? toY(hoverData.projected) : null;

  // Tooltip X flip: keep within bounds
  const tooltipLeft = hoverX !== null ? (hoverX > VW / 2 ? hoverX - 140 : hoverX + 12) : 0;

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            5-Year Value Projection
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
            Cost basis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-emerald-400" />
            Projected
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ height: 'clamp(140px, 22vw, 200px)' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverMonth(null)}
      >
        <defs>
          {/* Gradient fill for projected area */}
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle horizontal grid lines */}
        {yTicks.map(({ y }, i) => (
          <line
            key={i}
            x1={PAD.left}
            y1={y}
            x2={VW - PAD.right}
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-200 dark:text-gray-700"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(({ value, y }, i) => (
          <text
            key={i}
            x={PAD.left - 6}
            y={y + 4}
            textAnchor="end"
            fontSize="11"
            className="fill-gray-400 dark:fill-gray-500"
            fontFamily="inherit"
          >
            {fmtPrice(value, isSol)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map(({ year, x }) => (
          <text
            key={year}
            x={x}
            y={VH - 6}
            textAnchor="middle"
            fontSize="11"
            className="fill-gray-400 dark:fill-gray-500"
            fontFamily="inherit"
          >
            {year === 0 ? 'Now' : `Yr ${year}`}
          </text>
        ))}

        {/* Cost-basis dashed line */}
        <line
          x1={PAD.left}
          y1={baselineY}
          x2={VW - PAD.right}
          y2={baselineY}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          className="text-gray-300 dark:text-gray-600"
        />

        {/* Projected area fill */}
        <path
          d={buildAreaPath(projectedPoints, baselineY)}
          fill="url(#chartGradient)"
        />

        {/* Projected line */}
        <path
          d={buildPath(projectedPoints)}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover interaction layer */}
        {hoverMonth !== null && hoverX !== null && hoverProjY !== null && (
          <>
            {/* Vertical cursor */}
            <line
              x1={hoverX}
              y1={PAD.top}
              x2={hoverX}
              y2={PAD.top + CH}
              stroke="#10b981"
              strokeWidth="1"
              strokeOpacity="0.4"
            />

            {/* Dot on projected line */}
            <circle cx={hoverX} cy={hoverProjY} r="4" fill="#10b981" />
            <circle cx={hoverX} cy={hoverProjY} r="7" fill="#10b981" fillOpacity="0.2" />

            {/* Dot on baseline */}
            <circle cx={hoverX} cy={baselineY} r="3" fill="currentColor" className="text-gray-400 dark:text-gray-500" />

            {/* Tooltip */}
            <foreignObject
              x={tooltipLeft}
              y={PAD.top}
              width="130"
              height="80"
              style={{ overflow: 'visible' }}
            >
              <div
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2.5 text-xs"
                style={{ width: '130px' }}
              >
                <p className="text-gray-400 dark:text-gray-500 mb-1 font-medium">
                  {hoverData!.month === 0 ? 'Now' : `Month ${hoverData!.month}`}
                </p>
                <p className="font-bold text-emerald-500">
                  {fmtPrice(hoverData!.projected, isSol)}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
                  +{(((hoverData!.projected / hoverData!.baseline) - 1) * 100).toFixed(1)}% yield
                </p>
              </div>
            </foreignObject>
          </>
        )}
      </svg>
    </div>
  );
}
