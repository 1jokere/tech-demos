import { useState } from "react";
import type { TubeParams } from "../model/tube";
import { RECORD_SECONDS, recordClip } from "../fit/record";
import { fitRecording, type FitBackend } from "../fit/fit";

type Status = "idle" | "recording" | "fitting" | "done" | "error" | "unavailable";

function micAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

function messageFR(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") return "Accès au microphone refusé.";
    if (err.name === "NotFoundError") return "Aucun microphone détecté.";
    if (err.name === "SecurityError") return "Microphone indisponible hors d'une page sécurisée.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "L'ajustement a échoué.";
}

const BACKEND_LABEL: Record<FitBackend, string> = {
  webgpu: "calcul WebGPU",
  cpu: "calcul processeur — WebGPU indisponible",
};

export function FitPanel({ onApply }: { onApply: (params: TubeParams) => void }) {
  const [status, setStatus] = useState<Status>(() => (micAvailable() ? "idle" : "unavailable"));
  const [detail, setDetail] = useState("");
  const busy = status === "recording" || status === "fitting";

  async function run() {
    if (!micAvailable()) {
      setStatus("unavailable");
      return;
    }
    setStatus("recording");
    setDetail("");
    try {
      const clip = await recordClip();
      setStatus("fitting");
      const result = await fitRecording(clip);
      onApply(result.params);
      setDetail(BACKEND_LABEL[result.backend]);
      setStatus("done");
    } catch (err) {
      setDetail(messageFR(err));
      setStatus("error");
    }
  }

  return (
    <section className="panel fit" aria-labelledby="fit-heading">
      <div className="panel-head">
        <h2 id="fit-heading">Ajuster depuis la voix</h2>
        <p>
          Tenez une voyelle pendant {RECORD_SECONDS.toLocaleString("fr-FR")} s. Une recherche
          simplifiée rapproche le tube de l'enveloppe spectrale enregistrée. Ce n'est pas
          l'optimisation du papier.
        </p>
      </div>

      {status === "unavailable" ? (
        <p className="fit-state" role="status">
          Indisponible : ce navigateur ne propose pas l'enregistrement micro.
        </p>
      ) : (
        <button type="button" className="fit-button" onClick={run} disabled={busy}>
          {status === "recording" && "Écoute… tenez la voyelle"}
          {status === "fitting" && "Ajustement du tube…"}
          {status !== "recording" && status !== "fitting" && "Enregistrer et ajuster"}
        </button>
      )}

      {status === "done" && (
        <p className="fit-state is-ok" role="status">
          Tube mis à jour ({detail}).
        </p>
      )}
      {status === "error" && (
        <p className="fit-state is-err" role="alert">
          {detail}
        </p>
      )}
    </section>
  );
}
