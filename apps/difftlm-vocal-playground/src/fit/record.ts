// Enregistrement micro court (~1,2 s) et décodage en PCM mono.

export interface Recording {
  samples: Float32Array;
  sampleRate: number;
}

export const RECORD_SECONDS = 1.2;

export async function recordClip(): Promise<Recording> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone indisponible dans ce navigateur.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("Échec de l'enregistrement."));
    });
    recorder.start();
    await new Promise((r) => setTimeout(r, RECORD_SECONDS * 1000));
    recorder.stop();
    await stopped;

    const blob = new Blob(chunks, { type: recorder.mimeType });
    const arrayBuf = await blob.arrayBuffer();
    const ctx = new AudioContext();
    try {
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      return {
        samples: audioBuf.getChannelData(0).slice(),
        sampleRate: audioBuf.sampleRate,
      };
    } finally {
      void ctx.close();
    }
  } finally {
    for (const track of stream.getTracks()) track.stop();
  }
}
