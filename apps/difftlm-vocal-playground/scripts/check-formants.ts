// Vérification rapide des formants de chaque préréglage : `bun run check`.
import { findFormants, responseGrid, tubeResponseDb } from "../src/model/tube";
import { PRESETS } from "../src/model/presets";

const grid = responseGrid();
for (const p of PRESETS) {
  const db = tubeResponseDb(p, grid);
  const formants = findFormants(grid, db, 3);
  const txt = formants.map((f, i) => `F${i + 1}=${Math.round(f.freq)} Hz`).join("  ");
  console.log(`${p.label}  (${p.lengthCm} cm)  ${txt}`);
}
