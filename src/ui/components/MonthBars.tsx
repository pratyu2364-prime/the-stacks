/** Hand-rolled, because a chart library for twelve bars is a bad trade. */
export function MonthBars({ months }: { months: Array<{ month: string; count: number }> }) {
  if (months.length === 0) return <p className="text-dust text-sm">Nothing finished yet.</p>;

  const width = 520;
  const height = 120;
  const pad = 24;
  const max = Math.max(...months.map((m) => m.count));
  const slot = (width - pad * 2) / months.length;
  const barWidth = Math.min(34, slot * 0.6);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[520px]" role="img" aria-label="Books finished per month">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#5a3f26" strokeWidth="1" />
        {months.map((m, i) => {
          const h = (m.count / max) * (height - pad * 2);
          const x = pad + i * slot + (slot - barWidth) / 2;
          return (
            <g key={m.month}>
              <rect x={x} y={height - pad - h} width={barWidth} height={h} fill="#ffb45c" rx="2" />
              <text x={x + barWidth / 2} y={height - pad - h - 5} textAnchor="middle" fontSize="10" fill="#efe6d2" fontFamily="ui-monospace, monospace">
                {m.count}
              </text>
              <text x={x + barWidth / 2} y={height - pad + 13} textAnchor="middle" fontSize="9" fill="#b6a68c" fontFamily="ui-monospace, monospace">
                {m.month.slice(5)}/{m.month.slice(2, 4)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
