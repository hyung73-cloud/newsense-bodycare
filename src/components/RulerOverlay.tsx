/**
 * Fixed SVG ruler overlay guide for body photos.
 * Center = 0 (navel), range -5 to +5 cm with 0.2cm minor ticks.
 */
export default function RulerOverlay() {
  const width = 200;
  const height = 28;
  const centerX = width / 2;
  const pxPerCm = 16;

  const majorTicks: number[] = [];
  for (let cm = -5; cm <= 5; cm++) majorTicks.push(cm);

  const minorTicks: number[] = [];
  for (let cm = -5; cm <= 5; cm += 0.2) {
    if (Math.abs(cm - Math.round(cm)) > 0.01) minorTicks.push(cm);
  }

  return (
    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 px-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-7"
        preserveAspectRatio="none"
      >
        {/* Background line */}
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
        />

        {/* Minor ticks */}
        {minorTicks.map((cm) => {
          const x = centerX + cm * pxPerCm;
          if (x < 0 || x > width) return null;
          return (
            <g key={`minor-${cm}`}>
              <line
                x1={x}
                y1={height / 2 - 4}
                x2={x}
                y2={height / 2 + 4}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={0.5}
              />
            </g>
          );
        })}

        {/* Major ticks + labels */}
        {majorTicks.map((cm) => {
          const x = centerX + cm * pxPerCm;
          return (
            <g key={`major-${cm}`}>
              <line
                x1={x}
                y1={height / 2 - 8}
                x2={x}
                y2={height / 2 + 8}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={1}
              />
              <text
                x={x}
                y={height / 2 - 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.95)"
                fontSize={7}
                fontWeight="bold"
              >
                {cm}
              </text>
            </g>
          );
        })}

        {/* Center navel point */}
        <circle cx={centerX} cy={height / 2} r={3} fill="#EF4444" stroke="white" strokeWidth={1} />

        {/* Minor sub-labels between majors */}
        {[-4.8, -4.6, -4.4, -4.2, 4.2, 4.4, 4.6, 4.8].map((cm) => {
          const x = centerX + cm * pxPerCm;
          return (
            <text
              key={`sub-${cm}`}
              x={x}
              y={height / 2 + 14}
              textAnchor="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize={5}
            >
              {cm}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
