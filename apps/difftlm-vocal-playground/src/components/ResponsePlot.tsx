import type { Formant } from "../model/tube";

const W = 720;
const H = 300;
const PL = 54;
const PR = 18;
const PT = 30;
const PB = 42;

const COLORS = ["#e879f9", "#22d3ee", "#fbbf24", "#a3e635"];

interface ResponsePlotProps {
  freqs: Float32Array;
  db: Float32Array;
  formants: Formant[];
}

export function ResponsePlot({ freqs, db, formants }: ResponsePlotProps) {
  const fMin = freqs[0] ?? 0;
  const fMax = freqs[freqs.length - 1] ?? 1;

  let dMin = Infinity;
  let dMax = -Infinity;
  for (let i = 0; i < db.length; i++) {
    if (db[i] < dMin) dMin = db[i];
    if (db[i] > dMax) dMax = db[i];
  }
  if (!Number.isFinite(dMin) || !Number.isFinite(dMax)) {
    dMin = -40;
    dMax = 0;
  }
  const pad = Math.max(4, (dMax - dMin) * 0.08);
  const yMin = dMin - pad;
  const yMax = dMax + pad;

  const xOf = (f: number) => PL + ((f - fMin) / (fMax - fMin)) * (W - PL - PR);
  const yOf = (v: number) => PT + (1 - (v - yMin) / (yMax - yMin)) * (H - PT - PB);

  let path = "";
  for (let i = 0; i < freqs.length; i++) {
    const x = xOf(freqs[i]).toFixed(1);
    const y = yOf(db[i]).toFixed(1);
    path += i === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }

  const xTicks = [0, 1000, 2000, 3000, 4000, 5000].filter((t) => t >= fMin && t <= fMax);
  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  const summary =
    formants.length >= 2
      ? `Réponse en fréquence. F1 ${Math.round(formants[0].freq)} hertz, F2 ${Math.round(formants[1].freq)} hertz.`
      : "Réponse en fréquence du tube.";

  return (
    <section className="panel" aria-labelledby="plot-heading">
      <div className="panel-head">
        <h2 id="plot-heading">Réponse en fréquence</h2>
        <p>Les pics sont les formants. F1 et F2 suffisent à reconnaître la voyelle.</p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img" aria-label={summary}>
        {yTickVals.map((v) => (
          <g key={v}>
            <line
              x1={PL}
              x2={W - PR}
              y1={yOf(v)}
              y2={yOf(v)}
              className="grid-line"
            />
            <text x={PL - 8} y={yOf(v) + 4} textAnchor="end" className="axis-label">
              {Math.round(v)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={t}>
            <line x1={xOf(t)} x2={xOf(t)} y1={PT} y2={H - PB} className="grid-line" />
            <text x={xOf(t)} y={H - PB + 18} textAnchor="middle" className="axis-label">
              {t === 0 ? "0" : `${t / 1000}k`}
            </text>
          </g>
        ))}
        <text x={W / 2} y={H - 6} textAnchor="middle" className="axis-title">
          Fréquence (Hz)
        </text>
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          className="axis-title"
          transform={`rotate(-90 14 ${H / 2})`}
        >
          Niveau (dB)
        </text>
        <path d={path} className="response-curve" />
        {formants.map((f, i) => {
          const x = Math.min(W - PR - 28, Math.max(PL + 28, xOf(f.freq)));
          const yPeak = yOf(f.levelDb);
          const labelY = yPeak < PT + 34 ? yPeak + 16 : yPeak - 12;
          const color = COLORS[i % COLORS.length];
          return (
            <g key={`${f.freq}-${i}`}>
              <line
                x1={xOf(f.freq)}
                x2={xOf(f.freq)}
                y1={yPeak}
                y2={H - PB}
                stroke={color}
                strokeDasharray="3 4"
                strokeWidth={1.25}
                opacity={i < 2 ? 0.95 : 0.55}
              />
              <circle cx={xOf(f.freq)} cy={yPeak} r={i < 2 ? 4 : 3} fill={color} />
              <text x={x} y={labelY} textAnchor="middle" className="formant-label" fill={color}>
                F{i + 1} {Math.round(f.freq).toLocaleString("fr-FR")} Hz
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="formant-chips">
        {formants.length === 0 && <li className="chip">Aucun pic détecté</li>}
        {formants.map((f, i) => (
          <li key={`${f.freq}-${i}`} className={i < 2 ? "chip is-main" : "chip"} style={{ color: COLORS[i % COLORS.length] }}>
            F{i + 1}
            <strong>{Math.round(f.freq).toLocaleString("fr-FR")} Hz</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
