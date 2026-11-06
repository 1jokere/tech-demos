// Silhouette du tube : profil symétrique dont la demi-hauteur suit le rayon
// (√aire) de chaque section, de la glotte (gauche) aux lèvres (droite).

const W = 460;
const H = 150;
const PAD = 14;

export function TubeShape({ areas }: { areas: number[] }) {
  const n = areas.length;
  const maxR = Math.sqrt(8 / Math.PI);
  const xs = areas.map((_, i) => PAD + ((W - 2 * PAD) * i) / (n - 1));
  const rs = areas.map((a) => (Math.sqrt(Math.max(a, 0.05) / Math.PI) / maxR) * (H / 2 - PAD));

  const mid = H / 2;
  const top = xs.map((x, i) => `${x.toFixed(1)},${(mid - rs[i]).toFixed(1)}`);
  const bottom = xs
    .map((x, i) => `${x.toFixed(1)},${(mid + rs[i]).toFixed(1)}`)
    .reverse();
  const points = [...top, ...bottom].join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="tube-shape"
      role="img"
      aria-label="Profil du tube acoustique"
    >
      <defs>
        <linearGradient id="tubeFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <polygon points={points} fill="url(#tubeFill)" opacity={0.85} />
      <polyline
        points={top.join(" ")}
        fill="none"
        stroke="#e879f9"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <polyline
        points={[...top].reverse().map((p) => {
          const [x, y] = p.split(",").map(Number);
          return `${x},${(H - y).toFixed(1)}`;
        }).join(" ")}
        fill="none"
        stroke="#22d3ee"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <text x={PAD} y={H - 4} className="tube-label">
        glotte
      </text>
      <text x={W - PAD} y={H - 4} textAnchor="end" className="tube-label">
        lèvres
      </text>
    </svg>
  );
}
