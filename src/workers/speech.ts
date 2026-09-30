// Offline speech-to-text worker: Whisper tiny via @huggingface/transformers (WASM).
// First run downloads the model (~40 MB) from the HF CDN and caches it in
// IndexedDB; afterwards it is fully offline.
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false; // in Electron: fetch models from the CDN, never local FS

const MODEL = 'Xenova/whisper-tiny';
let transcriber: any = null;
let loading: Promise<any> | null = null;

async function getTranscriber() {
  if (transcriber) return transcriber;
  if (!loading) {
    loading = pipeline('automatic-speech-recognition', MODEL, {
      progress_callback: (p: any) => {
        if (p?.status === 'progress' && p.file) {
          postMessage({ type: 'loading', file: p.file, progress: p.progress ?? 0 });
        }
      },
    })
      .then((p: any) => {
        transcriber = p;
        return p;
      })
      .catch((e) => {
        loading = null;
        throw e;
      });
  }
  return loading;
}

/** Linear-interpolation resample to 16 kHz (whisper's native rate). */
function resampleTo16k(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === 16000) return input;
  const ratio = fromRate / 16000;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, audio, sampleRate } = event.data ?? {};
  if (type !== 'transcribe' || !audio) return;
  try {
    postMessage({ type: 'status', status: 'loading-model' });
    const model = await getTranscriber();
    postMessage({ type: 'status', status: 'transcribing' });
    const pcm = resampleTo16k(audio, sampleRate ?? 16000);
    const out = await model(pcm, { chunk_length_s: 30, stride_length_s: 5 });
    postMessage({ type: 'result', text: String(out?.text ?? '').trim() });
  } catch (e) {
    postMessage({ type: 'error', message: e instanceof Error ? e.message : String(e) });
  }
};
