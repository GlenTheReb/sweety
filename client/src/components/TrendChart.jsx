import { useLayoutEffect, useRef, useState } from "react";
import { label, SLOTS } from "../lib.js";

export default function TrendChart({ readings }) {
  const [active, setActive] = useState(null);
  const chart = useRef(null);
  const [width, setWidth] = useState(680);
  useLayoutEffect(() => {
    const element = chart.current;
    if (!element || !window.ResizeObserver) return;
    const resize = () => {
      const measured = element.clientWidth;
      if (measured > 0) setWidth(measured);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [readings.length > 0]);
  const points = [...readings].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot),
  );
  if (!points.length) return null;
  const low = Math.max(
    0,
    Math.floor((Math.min(...points.map((p) => p.value)) - 10) / 10) * 10,
  );
  const high =
    Math.ceil((Math.max(...points.map((p) => p.value)) + 10) / 10) * 10;
  const time = (p) =>
    new Date(`${p.date}T00:00:00Z`).getTime() / 86400000 +
    SLOTS.indexOf(p.slot) / 4;
  const start = time(points[0]),
    end = time(points.at(-1));
  const right = width - 20;
  const x = (p) =>
    end === start
      ? (55 + right) / 2
      : 55 + ((time(p) - start) / (end - start)) * (right - 55);
  const y = (p) => 145 - ((p.value - low) / (high - low)) * 115;
  const selected = active == null ? null : points[active];
  return (
    <section className="trend" aria-label="Reading trend">
      <div className="section-heading">
        <h3>Every reading tells part of the story</h3>
        <span>mg/dL</span>
      </div>
      <p className="muted">
        Your recorded values across this period. Hover or focus a point for
        details.
      </p>
      <svg
        ref={chart}
        viewBox={`0 0 ${width} 180`}
        role="img"
        aria-label={`Line chart of ${points.length} recorded glucose values. A data table follows.`}
      >
        {[low, (low + high) / 2, high].map((value) => {
          const height = 145 - ((value - low) / (high - low)) * 115;
          return (
            <g key={value}>
              <line
                x1="55"
                x2={right}
                y1={height}
                y2={height}
                stroke="#e6ede7"
                strokeDasharray="4 5"
              />
              <text x="42" y={height + 4} textAnchor="end">
                {value}
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="#28765c"
          strokeWidth="2"
          points={points.map((p) => `${x(p)},${y(p)}`).join(" ")}
        />
        {points.map((p, i) => (
          <circle
            key={p.id || `${p.date}-${p.slot}`}
            cx={x(p)}
            cy={y(p)}
            r={i === active ? 6 : 4}
            fill="#28765c"
            stroke="white"
            strokeWidth="2"
            tabIndex="0"
            aria-label={`${label(p.date)}, ${p.slot}: ${p.value} mg/dL`}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <title>
              {label(p.date)} · {p.slot}: {p.value} mg/dL
            </title>
          </circle>
        ))}
        <text x="55" y="173">
          {label(points[0].date)}
        </text>
        <text x={right} y="173" textAnchor="end">
          {label(points.at(-1).date)}
        </text>
      </svg>
      <p className="trend-detail" aria-live="polite">
        {selected
          ? `${label(selected.date)} · ${selected.slot} · ${selected.value} mg/dL`
          : `${points.length} readings · Gaps between recorded points do not represent measurements.`}
      </p>
      <details>
        <summary>View chart data</summary>
        <div className="table-scroll">
          <table>
            <caption>Recorded readings for the selected report period</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time slot</th>
                <th scope="col">mg/dL</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id || `${p.date}-${p.slot}`}>
                  <td>{label(p.date)}</td>
                  <td>{p.slot}</td>
                  <td>{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
