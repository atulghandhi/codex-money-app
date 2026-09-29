import { useEffect, useRef, useState } from "react";
import { money } from "./model";
export const colors = ["#bbb0d8", "#e7b07d", "#9fc5b9", "#bac4bd", "#d5ee8b"];
export function Landscape({
  values,
  scale,
  currency,
  selected,
  onSelect,
}: {
  values: number[];
  scale: number;
  currency: string;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const names = [
    "Bills & plans",
    "Everyday living",
    "Future you",
    "Safety buffer",
    "Free to spend",
  ];
  const max = scale;
  const [display, setDisplay] = useState(values);
  const current = useRef(values);
  const key = values.join(",");
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = values;
      setDisplay(values);
      return;
    }
    const from = [...current.current];
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 480);
      const ease = 1 - Math.pow(1 - progress, 3);
      const next = values.map((v, i) => from[i] + (v - from[i]) * ease);
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key]);
  return (
    <div className="landscape">
      <svg
        viewBox="0 0 930 360"
        role="group"
        aria-label="Your money landscape. Column heights represent the amount in each allocation."
      >
        <defs>
          <pattern
            id="grid"
            width="46"
            height="26"
            patternUnits="userSpaceOnUse"
            patternTransform="matrix(1 .35 -1 .35 430 80)"
          >
            <path
              d="M 46 0 L 0 0 0 26"
              fill="none"
              stroke="#a4b0a0"
              strokeWidth=".6"
            />
          </pattern>
          <filter id="shadow">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <ellipse
          cx="460"
          cy="240"
          rx="380"
          ry="83"
          fill="url(#grid)"
          opacity=".45"
        />
        {values.map((raw, i) => {
          const val = Math.max(0, display[i]);
          const x = 95 + i * 176;
          const height = val ? Math.max(10, (val / max) * 156) : 0;
          const y = 254;
          const w = 57;
          const depth = 25;
          const color = colors[i];
          const layers = Math.max(1, Math.ceil(height / 13));
          return (
            <g
              key={i}
              className={`money-column ${selected === i ? "selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${names[i]}: ${money(raw, currency, raw % 100 !== 0)}. Show details.`}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
            >
              <title>
                {names[i]}: {money(raw, currency, raw % 100 !== 0)}
              </title>
              <ellipse
                cx={x + 4}
                cy={y + 19}
                rx="69"
                ry="17"
                fill="#50613b"
                opacity=".13"
                filter="url(#shadow)"
              />
              <g className="column-shape">
                <path
                  d={`M${x - w},${y - height} L${x},${y - height + depth} L${x},${y + depth} L${x - w},${y} Z`}
                  fill={color}
                  style={{ filter: "brightness(.87)" }}
                />
                <path
                  d={`M${x},${y - height + depth} L${x + w},${y - height} L${x + w},${y} L${x},${y + depth} Z`}
                  fill={color}
                  style={{ filter: "brightness(.73)" }}
                />
                {Array.from({ length: layers }, (_, j) => {
                  const h = Math.min(height, j * 13);
                  return (
                    <path
                      key={j}
                      d={`M${x - w},${y - h} L${x},${y - h + depth} L${x + w},${y - h}`}
                      fill="none"
                      stroke="#263725"
                      strokeOpacity=".15"
                      strokeWidth="1"
                    />
                  );
                })}
                <path
                  d={`M${x - w},${y - height} L${x},${y - height - depth} L${x + w},${y - height} L${x},${y - height + depth} Z`}
                  fill={color}
                />
                <path
                  d={`M${x - 37},${y - height} L${x},${y - height - 16} L${x + 37},${y - height} L${x},${y - height + 16} Z`}
                  fill="none"
                  stroke="#fff"
                  strokeOpacity=".3"
                />
                <text
                  x={x}
                  y={y - height - 45}
                  textAnchor="middle"
                  className="column-value"
                >
                  {money(raw, currency, raw % 100 !== 0)}
                </text>
              </g>
              <circle cx={x} cy="307" r="3.5" fill={color} />
              <text x={x} y="331" textAnchor="middle" className="column-label">
                {names[i]}
              </text>
              <path
                d={`M${x - 30},345h60`}
                stroke={selected === i ? "#2a3528" : "transparent"}
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
