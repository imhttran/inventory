// Minimal inline trend line for stat cards — plain SVG, no charting library.
// Flat/empty series render as a flat mid-line rather than crashing on a
// zero-range scale.
export function Sparkline({
  data,
  width = 72,
  height = 24,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");

  return (
    <svg
      className={`sparkline ${className ?? ""}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <polyline points={points} fill="none" strokeWidth="1.5" />
    </svg>
  );
}
