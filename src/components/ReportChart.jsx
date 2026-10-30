// src/components/ReportChart.jsx — Rooted Health Tracker
// Page-1 chart for the doctor report. Readable in black-and-white print:
// meaning is carried by line style and marker shape, not color.

import { addDays } from "../analysis/patterns";

const W = 720;
const PAD_L = 34;
const PAD_R = 10;
const TOP = 26; // mood panel top
const MOOD_H = 100;
const GAP = 18;
const SLEEP_H = 40;
const H = TOP + MOOD_H + GAP + SLEEP_H + 22;

export default function ReportChart({ report }) {
  const { start, totalDays, days, events } = report;
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  const dates = Array.from({ length: totalDays }, (_, i) => addDays(start, i));
  const step = (W - PAD_L - PAD_R) / Math.max(totalDays, 1);
  const x = (i) => PAD_L + step * i + step / 2;
  const yMood = (v) => TOP + MOOD_H - (v / 4) * MOOD_H;
  const sleepTop = TOP + MOOD_H + GAP;
  const ySleep = (h) => sleepTop + SLEEP_H - (Math.min(h, 12) / 12) * SLEEP_H;

  const segments = (field) => {
    const segs = [];
    let cur = [];
    dates.forEach((d, i) => {
      const v = byDate[d]?.[field];
      if (v == null) {
        if (cur.length) segs.push(cur);
        cur = [];
      } else cur.push([x(i), yMood(v)]);
    });
    if (cur.length) segs.push(cur);
    return segs;
  };

  const set = (list) => new Set(list);
  const period = set(events.period);
  const melt = set(events.melt);
  const flare = set(events.flare);
  const medChange = set(events.medChange);
  const big = set(events.bigEvent);
  const labelEvery = totalDays > 60 ? 14 : totalDays > 21 ? 7 : 2;

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Daily mood, activation, and sleep over the report period" style={{ display: "block" }}>
        <defs>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="#bbb" strokeWidth="1.2" />
          </pattern>
        </defs>

        {/* Period shading */}
        {dates.map((d, i) => period.has(d) && (
          <rect key={`p${d}`} x={x(i) - step / 2} y={TOP} width={step} height={MOOD_H + GAP + SLEEP_H} fill="url(#hatch)" />
        ))}

        {/* Mood grid */}
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yMood(v)} y2={yMood(v)} stroke={v === 2 ? "#999" : "#e3e3e3"} strokeWidth={v === 2 ? 0.8 : 0.6} strokeDasharray={v === 2 ? "2 2" : undefined} />
            <text x={PAD_L - 6} y={yMood(v) + 3} fontSize="9" textAnchor="end" fill="#444">{v}</text>
          </g>
        ))}
        <text x={4} y={TOP - 10} fontSize="9" fill="#222" fontWeight="700">Mood / activation (0–4)</text>

        {/* Med change lines */}
        {dates.map((d, i) => medChange.has(d) && (
          <line key={`m${d}`} x1={x(i)} x2={x(i)} y1={TOP} y2={sleepTop + SLEEP_H} stroke="#000" strokeWidth="1" strokeDasharray="1 2" />
        ))}

        {/* Within-day mood range band */}
        {dates.map((d, i) => {
          const r = byDate[d];
          if (!r || r.moodMin == null || r.moodMax == null || r.moodMax === r.moodMin) return null;
          return <rect key={`b${d}`} x={x(i) - Math.min(step * 0.35, 5)} width={Math.min(step * 0.7, 10)} y={yMood(r.moodMax)} height={yMood(r.moodMin) - yMood(r.moodMax)} fill="#cfcfcf" />;
        })}

        {/* Activation: dashed */}
        {segments("activation").map((seg, k) => (
          <polyline key={`a${k}`} points={seg.map((p) => p.join(",")).join(" ")} fill="none" stroke="#555" strokeWidth="1.4" strokeDasharray="4 3" />
        ))}
        {/* Mood: solid with dots */}
        {segments("mood").map((seg, k) => (
          <g key={`mo${k}`}>
            <polyline points={seg.map((p) => p.join(",")).join(" ")} fill="none" stroke="#000" strokeWidth="1.8" />
            {seg.map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r="2" fill="#000" />)}
          </g>
        ))}

        {/* Markers above the mood panel */}
        {dates.map((d, i) => (
          <g key={`k${d}`}>
            {melt.has(d) && <path d={`M${x(i)},${TOP - 9} l4,7 h-8 z`} fill="#000" />}
            {flare.has(d) && <path d={`M${x(i)},${TOP - 2} l3.5,-4 l-3.5,-4 l-3.5,4 z`} fill="none" stroke="#000" strokeWidth="1.1" transform={`translate(${melt.has(d) ? 9 : 0},0)`} />}
            {big.has(d) && <circle cx={x(i)} cy={sleepTop + SLEEP_H + 8} r="2.4" fill="none" stroke="#000" />}
          </g>
        ))}

        {/* Sleep bars */}
        <text x={4} y={sleepTop - 6} fontSize="9" fill="#222" fontWeight="700">Sleep (hours)</text>
        <line x1={PAD_L} x2={W - PAD_R} y1={ySleep(6)} y2={ySleep(6)} stroke="#999" strokeWidth="0.8" strokeDasharray="2 2" />
        <text x={PAD_L - 6} y={ySleep(6) + 3} fontSize="9" textAnchor="end" fill="#444">6</text>
        <text x={PAD_L - 6} y={ySleep(12) + 6} fontSize="9" textAnchor="end" fill="#444">12</text>
        <line x1={PAD_L} x2={W - PAD_R} y1={ySleep(0)} y2={ySleep(0)} stroke="#999" strokeWidth="0.6" />
        {dates.map((d, i) => {
          const h = byDate[d]?.sleepHours;
          if (h == null) return null;
          return <rect key={`s${d}`} x={x(i) - Math.min(step * 0.35, 6)} width={Math.min(step * 0.7, 12)} y={ySleep(h)} height={ySleep(0) - ySleep(h)} fill={h < 6 ? "#000" : "#9a9a9a"} />;
        })}

        {/* Date labels */}
        {dates.map((d, i) => (i % labelEvery === 0 ? (
          <text key={`d${d}`} x={x(i)} y={H - 2} fontSize="8.5" textAnchor="middle" fill="#444">
            {new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}
          </text>
        ) : null))}
      </svg>
      <figcaption style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: "9pt", color: "#333", marginTop: "4px" }}>
        <span>━ ● mood (daily average)</span>
        <span>▮ gray band: lowest–highest check-in that day</span>
        <span>╌ activation (2 = normal)</span>
        <span>▲ meltdown/shutdown</span>
        <span>◇ EDS flare</span>
        <span>┊ medication change</span>
        <span>○ big event</span>
        <span>▨ period</span>
        <span>black sleep bar = under 6 h</span>
        <span>gaps = no data</span>
      </figcaption>
    </figure>
  );
}
