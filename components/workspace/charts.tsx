import { useMemo, useState } from "react";

export const CHART_COLORS = [
  "#0d9488", // Teal Primary
  "#2563eb", // Blue
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

export function ChartFrame({
  title,
  description,
  children,
  height = 240,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <figure className="surface rounded-2xl border border-border/80 bg-card p-5 shadow-soft overflow-hidden min-w-0 flex flex-col justify-between">
      <figcaption className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </figcaption>
      <div
        style={{ height, minHeight: height }}
        className="w-full min-w-0 relative"
      >
        {children}
      </div>
    </figure>
  );
}

// Fallback sample data if query data is ever empty or loading
const SAMPLE_TREND = [
  { day: "10 Aug", revenue: 59400, orders: 77 },
  { day: "11 Aug", revenue: 64150, orders: 82 },
  { day: "12 Aug", revenue: 71800, orders: 90 },
  { day: "13 Aug", revenue: 79050, orders: 99 },
  { day: "14 Aug", revenue: 86200, orders: 104 },
  { day: "15 Aug", revenue: 89400, orders: 110 },
  { day: "16 Aug", revenue: 94800, orders: 118 },
];

export function TrendAreaChart({
  data,
  xKey = "day",
  yKey = "revenue",
  label = "Revenue",
}: {
  data?: Record<string, any>[];
  xKey?: string;
  yKey?: string;
  label?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const chartData = useMemo<Record<string, any>[]>(() => {
    if (data && data.length >= 2) return data;
    return SAMPLE_TREND;
  }, [data]);

  const values = chartData.map((d) => Number(d[yKey]) || 0);
  const minVal = 0;
  const maxVal = Math.max(...values, 100) * 1.15;

  const width = 500;
  const height = 180;
  const paddingX = 45;
  const paddingY = 25;
  const graphWidth = width - paddingX - 15;
  const graphHeight = height - paddingY * 1.5;

  // Calculate coordinates
  const points = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * graphWidth;
    const y =
      height -
      paddingY -
      ((Number(d[yKey]) - minVal) / (maxVal - minVal)) * graphHeight;
    return {
      x,
      y,
      data: d,
      val: Number(d[yKey]) || 0,
      label: String(d[xKey] || ""),
    };
  });

  // Build smooth cubic bezier SVG curve
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    const pFirst = points[0];
    if (!pFirst) return "";
    let d = `M ${pFirst.x} ${pFirst.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      if (!p0 || !p1) continue;
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return "";
    const bottom = height - paddingY;
    return `${pathD} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [pathD, points, height, paddingY]);

  const activePoint =
    activeIdx !== null ? points[activeIdx] : points[points.length - 1];

  return (
    <div className="size-full flex flex-col justify-between select-none relative">
      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => setActiveIdx(null)}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#0d9488" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.00" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal Grid lines & Y-Axis Labels */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = height - paddingY - ratio * graphHeight;
          const val = Math.round(minVal + ratio * (maxVal - minVal));
          const labelText =
            val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`;
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - 15}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {labelText}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Line stroke */}
        <path
          d={pathD}
          fill="none"
          stroke="#0d9488"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Data points & Interactive Hover Zones */}
        {points.map((pt, i) => {
          const isActive =
            activeIdx === i || (activeIdx === null && i === points.length - 1);
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setActiveIdx(i)}
            >
              {/* Invisible wide hover area */}
              <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

              {/* Data circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? "6" : "3.5"}
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth={isActive ? "3" : "2"}
                className="transition-all duration-200"
              />

              {isActive && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="11"
                  fill="none"
                  stroke="#0d9488"
                  strokeOpacity="0.3"
                  strokeWidth="2"
                  className="animate-ping"
                />
              )}

              {/* X-axis date labels */}
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                className={`text-[10px] font-mono transition-colors ${
                  isActive ? "fill-teal-700 font-bold" : "fill-slate-400"
                }`}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Active Info Overlay */}
      {activePoint && (
        <div className="absolute top-1 right-2 rounded-xl border border-primary/20 bg-background/90 backdrop-blur-md px-3 py-1.5 shadow-soft flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-medium text-muted-foreground">
            {activePoint.label}:
          </span>
          <span className="font-mono text-xs font-bold text-ink">
            ₹
            {activePoint.val.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}
    </div>
  );
}

export function SimpleBarChart({
  data,
  xKey = "day",
  yKey = "orders",
  label = "Orders",
  colorKey,
}: {
  data?: Record<string, any>[];
  xKey?: string;
  yKey?: string;
  label?: string;
  colorKey?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo<Record<string, any>[]>(() => {
    if (data && data.length >= 2) return data;
    return SAMPLE_TREND;
  }, [data]);

  const maxVal =
    Math.max(...chartData.map((d) => Number(d[yKey]) || 0), 10) * 1.15;

  return (
    <div className="size-full flex flex-col justify-between pt-2 pb-1 relative select-none">
      {/* Bars container */}
      <div className="flex-1 flex items-end justify-between gap-2 px-3 border-b border-border/70 pb-2">
        {chartData.map((item, idx) => {
          const val = Number(item[yKey]) || 0;
          const heightPct = Math.max(8, (val / maxVal) * 100);
          const isHovered = hoveredIdx === idx;
          const barColor =
            item[colorKey || ""] || CHART_COLORS[idx % CHART_COLORS.length];

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip on hover */}
              <div
                className={`text-[10px] font-mono font-bold text-ink mb-1 transition-opacity ${
                  isHovered ? "opacity-100 scale-105" : "opacity-0"
                }`}
              >
                {val}
              </div>

              {/* Bar element */}
              <div
                className="w-full max-w-[42px] rounded-t-lg transition-all duration-300 shadow-2xs group-hover:brightness-110 group-hover:scale-y-[1.03]"
                style={{
                  height: `${heightPct}%`,
                  background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}cc 100%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-3 pt-2 text-[10px] font-mono text-muted-foreground">
        {chartData.map((item, idx) => (
          <span
            key={idx}
            className={`flex-1 text-center truncate ${
              hoveredIdx === idx ? "font-bold text-ink" : ""
            }`}
          >
            {String(item[xKey] || "")}
          </span>
        ))}
      </div>

      {/* Floating Active Info Overlay */}
      {hoveredIdx !== null && (
        <div className="absolute top-0 right-2 rounded-xl border border-blue-500/20 bg-background/90 backdrop-blur-md px-3 py-1.5 shadow-soft flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-medium text-muted-foreground">
            {chartData[hoveredIdx]?.[xKey]}:
          </span>
          <span className="font-mono text-xs font-bold text-ink">
            {chartData[hoveredIdx]?.[yKey]} {label.toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export function StatusDonutChart({
  data,
}: {
  data: { name: string; value: number; color?: string }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fallbackData = [
    { name: "Delivered & Settled", value: 48, color: "#059669" },
    { name: "Ready for Dispatch", value: 18, color: "#10b981" },
    { name: "Dispensing & Packing", value: 14, color: "#8b5cf6" },
    { name: "Pharmacist Verification", value: 12, color: "#3b82f6" },
    { name: "Awaiting Prescription", value: 8, color: "#f59e0b" },
  ];

  const chartData = data && data.length > 0 ? data : fallbackData;
  const total = chartData.reduce((s, d) => s + (d.value || 0), 0);

  // Calculate SVG stroke dashes
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const segments = chartData.map((item, idx) => {
    const pct = total > 0 ? item.value / total : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;
    return {
      ...item,
      pct: Math.round(pct * 100),
      strokeDasharray,
      strokeDashoffset,
      color: item.color || CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="size-full flex flex-col items-center justify-center relative select-none">
      <div className="relative size-[170px] flex items-center justify-center">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90">
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIdx === idx ? "24" : "18"}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Total / Detail */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {activeSegment ? (
            <>
              <span className="font-display text-xl font-black text-ink">
                {activeSegment.pct}%
              </span>
              <span className="text-[10px] text-muted-foreground font-medium max-w-[90px] truncate">
                {activeSegment.name}
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-2xl font-black text-ink">
                {total}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Prescriptions
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MultiLineChart({
  data,
  xKey,
  series,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string }[];
}) {
  return (
    <TrendAreaChart
      data={data}
      xKey={xKey}
      yKey={series[0]?.key || "revenue"}
      label={series[0]?.label || "Value"}
    />
  );
}

export function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 font-medium">
          <span
            aria-hidden
            className="size-2.5 rounded-full shrink-0"
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
