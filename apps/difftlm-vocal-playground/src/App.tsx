import { useEffect, useMemo, useRef, useState } from "react";
import { VowelSynth } from "./audio/synth";
import { FitPanel } from "./components/FitPanel";
import { ResponsePlot } from "./components/ResponsePlot";
import { TubeEditor } from "./components/TubeEditor";
import { PRESETS } from "./model/presets";
import { findFormants, responseGrid, tubeResponseDb, type TubeParams } from "./model/tube";

const GRID = responseGrid();
const START = PRESETS[0];

export default function App() {
  const [areas, setAreas] = useState<number[]>(() => [...START.areas]);
  const [lengthCm, setLengthCm] = useState(START.lengthCm);
  const [f0, setF0] = useState(140);
  const [presetId, setPresetId] = useState<string | null>(START.id);
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef(new VowelSynth());
  const playingRef = useRef(false);

  const response = useMemo(() => {
    const db = tubeResponseDb({ areas, lengthCm }, GRID);
    return { db, formants: findFormants(GRID, db, 4) };
  }, [areas, lengthCm]);

  useEffect(() => {
    if (!playingRef.current) return;
    synthRef.current.update({ areas, lengthCm, f0 });
  }, [areas, lengthCm, f0]);

  useEffect(() => () => synthRef.current.stop(), []);

  function togglePlay() {
    if (playingRef.current) {
      synthRef.current.stop();
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    synthRef.current.start({ areas, lengthCm, f0 });
    playingRef.current = true;
    setPlaying(true);
  }

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setAreas([...preset.areas]);
    setLengthCm(preset.lengthCm);
    setPresetId(id);
  }

  function applyFit(params: TubeParams) {
    setAreas(params.areas.map((a) => Math.round(a * 10) / 10));
    setLengthCm(Math.round(params.lengthCm * 10) / 10);
    setPresetId(null);
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">diffTLM · terrain de jeu</p>
        <h1>Le tube qui fait la voyelle</h1>
        <p className="lede">
          Huit sections cylindriques, de la glotte aux lèvres. Changez les aires, la longueur
          et la hauteur : la voyelle change à l'oreille, et ses formants bougent à l'écran.
          Recréation pédagogique du tube acoustique — pas le simulateur des auteurs.
        </p>
      </header>

      <main className="stage">
        <TubeEditor
          areas={areas}
          lengthCm={lengthCm}
          f0={f0}
          presetId={presetId}
          playing={playing}
          onArea={(index, value) => {
            setAreas((prev) => prev.map((a, i) => (i === index ? value : a)));
            setPresetId(null);
          }}
          onLength={(cm) => {
            setLengthCm(cm);
            setPresetId(null);
          }}
          onF0={setF0}
          onPreset={applyPreset}
          onTogglePlay={togglePlay}
        />
        <div className="side">
          <ResponsePlot freqs={GRID} db={response.db} formants={response.formants} />
          <FitPanel onApply={applyFit} />
        </div>
      </main>

      <footer className="credits">
        <p>
          Idée du tube acoustique différentiable : Chen, Eric Ming ; Lee, Jin Woo ; Sitzmann,
          Vincent. « Reconstructing the Vocal Tract with Differentiable Acoustic Simulation »,
          NeurIPS 2026.
        </p>
        <p className="credit-links">
          <a href="https://echen01.github.io/vocal-tract/" target="_blank" rel="noreferrer">
            Démo officielle des auteurs
          </a>
          <a
            href="https://x.com/vincesitzmann/status/2118057889432514691"
            target="_blank"
            rel="noreferrer"
          >
            Annonce source
          </a>
        </p>
      </footer>
    </div>
  );
}
