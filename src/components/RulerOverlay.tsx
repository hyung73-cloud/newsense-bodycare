/**
 * Fixed SVG ruler overlay guide for body photos.
 * Center = 0 (navel), range -5 to +5 cm with 0.2cm minor ticks.
 */
export default function RulerOverlay() {
  const width = 200;
  const height = 32;
  const centerX = width / 2;
  const pxPerCm = 16;

  const majorTicks: number[] = [];
  for (let cm = -5; cm <= 5; cm++) majorTicks.push(cm);

  const minorTicks: number[] = [];
  for (let cm = -5; cm <= 5; cm += 0.2) {
    if (Math.abs(cm - Math.round(cm)) > 0.01) minorTicks.push(cm);
  }

  return (
    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10 px-0.5">
      <div className="bg-black/35 backdrop-blur-[1px] rounded-sm mx-0.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-8"
          preserveAspectRatio="none"
        >
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth={1.5}
          />

          {minorTicks.map((cm) => {
            const x = centerX + cm * pxPerCm;
            if (x < 0 || x > width) return null;
            return (
              <line
                key={`minor-${cm}`}
                x1={x}
                y1={height / 2 - 3}
                x2={x}
                y2={height / 2 + 3}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={0.5}
              />
            );
          })}

          {majorTicks.map((cm) => {
            const x = centerX + cm * pxPerCm;
            return (
              <g key={`major-${cm}`}>
                <line
                  x1={x}
                  y1={height / 2 - 7}
                  x2={x}
                  y2={height / 2 + 7}
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height / 2 - 9}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.98)"
                  fontSize={7}
                  fontWeight="bold"
                >
                  {cm}
                </text>
              </g>
            );
          })}

          <circle cx={centerX} cy={height / 2} r={2.5} fill="#EF4444" stroke="white" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}
