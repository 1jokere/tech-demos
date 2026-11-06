import { PRESETS } from "../model/presets";
import { TubeShape } from "./TubeShape";

interface TubeEditorProps {
  areas: number[];
  lengthCm: number;
  f0: number;
  presetId: string | null;
  playing: boolean;
  onArea: (index: number, value: number) => void;
  onLength: (cm: number) => void;
  onF0: (hz: number) => void;
  onPreset: (id: string) => void;
  onTogglePlay: () => void;
}

export function TubeEditor({
  areas,
  lengthCm,
  f0,
  presetId,
  playing,
  onArea,
  onLength,
  onF0,
  onPreset,
  onTogglePlay,
}: TubeEditorProps) {
  return (
    <section className="panel" aria-labelledby="tube-heading">
      <div className="panel-head">
        <h2 id="tube-heading">Conduit vocal</h2>
        <p>De la glotte aux lèvres. Chaque curseur est l'aire d'une section, en cm².</p>
      </div>

      <div className="presets" role="group" aria-label="Voyelles de départ">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={presetId === p.id ? "preset is-active" : "preset"}
            aria-pressed={presetId === p.id}
            onClick={() => onPreset(p.id)}
          >
            <span className="preset-glyph">{p.label}</span>
            <span className="preset-hint">{p.hint}</span>
          </button>
        ))}
      </div>

      <TubeShape areas={areas} />

      <div className="area-row">
        {areas.map((area, i) => {
          const place = i === 0 ? "glotte" : i === areas.length - 1 ? "lèvres" : `section ${i + 1}`;
          return (
            <label key={i} className="area">
              <span className="area-value">{area.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}</span>
              <input
                type="range"
                className="vslider"
                min={0.2}
                max={8}
                step={0.1}
                value={area}
                aria-label={`Aire, ${place}, en centimètres carrés`}
                aria-valuetext={`${area.toLocaleString("fr-FR")} centimètres carrés`}
                onChange={(e) => onArea(i, Number(e.target.value))}
              />
              <span className="area-name">{i + 1}</span>
            </label>
          );
        })}
      </div>

      <div className="controls">
        <label className="hslider">
          <span>
            Longueur du conduit
            <strong>{lengthCm.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm</strong>
          </span>
          <input
            type="range"
            min={13}
            max={20}
            step={0.1}
            value={lengthCm}
            aria-valuetext={`${lengthCm.toLocaleString("fr-FR")} centimètres`}
            onChange={(e) => onLength(Number(e.target.value))}
          />
        </label>
        <label className="hslider">
          <span>
            Hauteur de la source
            <strong>{Math.round(f0).toLocaleString("fr-FR")} Hz</strong>
          </span>
          <input
            type="range"
            min={70}
            max={320}
            step={1}
            value={f0}
            aria-valuetext={`${Math.round(f0)} hertz`}
            onChange={(e) => onF0(Number(e.target.value))}
          />
        </label>
      </div>

      <button type="button" className={playing ? "play is-on" : "play"} onClick={onTogglePlay}>
        <span className="play-dot" aria-hidden="true" />
        {playing ? "Arrêter" : "Écouter la voyelle"}
      </button>
    </section>
  );
}
