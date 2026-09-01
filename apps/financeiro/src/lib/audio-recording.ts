/** Utilitários para gravação via MediaRecorder (Chrome, Safari, Firefox). */

export function mimeToFilename(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("mp4") || m.includes("mpeg")) return "audio.mp4";
  if (m.includes("ogg")) return "audio.ogg";
  if (m.includes("wav")) return "audio.wav";
  return "audio.webm";
}

export function pickRecordingMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export async function openMicrophoneStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Seu navegador não suporta gravação de áudio.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
  const track = stream.getAudioTracks()[0];
  if (!track) {
    throw new Error("Nenhuma faixa de áudio foi obtida do microfone.");
  }
  return stream;
}

export function isMicrophoneStreamLive(stream: MediaStream): boolean {
  const track = stream.getAudioTracks()[0];
  return Boolean(track && track.readyState === "live" && track.enabled && !track.muted);
}

export function startRecorder(stream: MediaStream): {
  recorder: MediaRecorder;
  mime: string;
  filename: string;
} {
  const preferred = pickRecordingMimeType();
  const recorder = preferred
    ? new MediaRecorder(stream, { mimeType: preferred })
    : new MediaRecorder(stream);
  const mime = recorder.mimeType || preferred || "audio/webm";
  return { recorder, mime, filename: mimeToFilename(mime) };
}

export function stopRecorderAndCollectBlob(
  recorder: MediaRecorder,
  chunks: Blob[],
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const finalize = () => {
      const mime = recorder.mimeType || chunks.find((c) => c.size > 0)?.type || "audio/webm";
      const parts = chunks.filter((c) => c.size > 0);
      if (parts.length === 0) {
        reject(
          new Error(
            "Nenhum áudio foi captado. Permita o microfone, use Chrome/Edge/Safari atualizado e grave pelo menos 3 segundos falando perto do microfone.",
          ),
        );
        return;
      }
      resolve(new Blob(parts, { type: mime }));
    };

    recorder.onstop = finalize;
    recorder.onerror = () => reject(new Error("Erro interno na gravação de áudio."));

    if (recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        /* alguns browsers não implementam */
      }
      recorder.stop();
    } else {
      finalize();
    }
  });
}

/**
 * Medidor de nível 0–100 (pico do sinal).
 * No macOS/Safari o AudioContext começa "suspended" — é necessário resume() após o clique.
 */
export async function attachAudioLevelMeter(
  stream: MediaStream,
  onLevel: (level: number) => void,
): Promise<() => void> {
  const AudioCtx = getAudioContextClass();
  const track = stream.getAudioTracks()[0];
  if (!AudioCtx || !track) {
    onLevel(0);
    return () => {};
  }

  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.35;

  // Mantém o grafo de áudio ativo no Chrome/macOS (gain 0 = sem som no alto-falante)
  const silentGain = ctx.createGain();
  silentGain.gain.value = 0;
  source.connect(analyser);
  analyser.connect(silentGain);
  silentGain.connect(ctx.destination);

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* continua — alguns browsers já iniciam em running */
    }
  }

  const buf = new Uint8Array(analyser.fftSize);
  let raf = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (let i = 0; i < buf.length; i++) {
      const amp = Math.abs(buf[i] - 128) / 128;
      if (amp > peak) peak = amp;
    }
    onLevel(Math.min(100, Math.round(peak * 900)));
    raf = requestAnimationFrame(tick);
  };
  tick();

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    try {
      source.disconnect();
      analyser.disconnect();
      silentGain.disconnect();
    } catch {
      /* ignore */
    }
    void ctx.close().catch(() => {});
  };
}
