import { useEffect, useRef, useState } from 'react';
import SpeechWorker from '../workers/speech.ts?worker';

type Status = 'idle' | 'recording' | 'loading' | 'transcribing';

interface Capture {
  stream: MediaStream;
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  chunks: Float32Array[];
  stop: () => void;
}

/**
 * Offline voice input: records the microphone, then transcribes with a local
 * Whisper-tiny model (WASM) in a worker — no cloud, works in Electron on
 * Windows and Linux. First use downloads ~40 MB of model, cached afterwards.
 */
export function VoiceButton({ onResult }: { onResult: (text: string) => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const captureRef = useRef<Capture | null>(null);
  // Keep the latest callback without re-creating the worker on every render.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let w: Worker | null = null;
    try {
      w = new SpeechWorker();
    } catch (e) {
      setErrMsg(`Voice unavailable: ${(e as Error).message}`);
      return;
    }
    w.onmessage = (e: MessageEvent) => {
      const d = e.data ?? {};
      if (d.type === 'result') {
        setStatus('idle');
        if (d.text) onResultRef.current(d.text);
        else setErrMsg('Could not hear anything — try speaking a bit louder.');
      } else if (d.type === 'status') {
        setStatus(d.status === 'transcribing' ? 'transcribing' : 'loading');
      } else if (d.type === 'error') {
        setStatus('idle');
        setErrMsg(`Voice error: ${d.message} (needs internet on first run to cache the model)`);
      }
    };
    workerRef.current = w;
    return () => {
      w?.terminate();
      workerRef.current = null;
    };
  }, []);

  const startRecording = async () => {
    setErrMsg(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    } catch (e) {
      setErrMsg(`Microphone unavailable: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    let seconds = 0;
    const sampleRate = ctx.sampleRate;

    const capture: Capture = { stream, ctx, source, processor, chunks, stop: () => {} };

    const finish = () => {
      if (!captureRef.current) return;
      captureRef.current = null;
      processor.onaudioprocess = null;
      source.disconnect();
      processor.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const mixed = new Float32Array(total);
      let off = 0;
      for (const c of chunks) {
        mixed.set(c, off);
        off += c.length;
      }
      if (total / sampleRate < 0.3) {
        setStatus('idle');
        setErrMsg('No speech captured — click the mic and speak.');
        return;
      }
      setStatus('transcribing');
      workerRef.current?.postMessage({ type: 'transcribe', audio: mixed, sampleRate }, [mixed.buffer]);
    };
    capture.stop = finish;

    processor.onaudioprocess = (e) => {
      chunks.push(e.inputBuffer.getChannelData(0).slice());
      seconds += e.inputBuffer.duration;
      if (seconds >= 12) finish(); // auto-stop after 12 s
    };

    // silence output to avoid feedback loops
    const zeroGain = ctx.createGain();
    zeroGain.gain.value = 0;
    source.connect(processor);
    processor.connect(zeroGain);
    zeroGain.connect(ctx.destination);

    captureRef.current = capture;
    setStatus('recording');
  };

  const toggle = () => {
    if (status === 'recording') {
      captureRef.current?.stop();
      return;
    }
    if (status !== 'idle') return;
    void startRecording();
  };

  const label =
    status === 'recording'
      ? '🎙 stop…'
      : status === 'transcribing'
        ? '⏳ listening…'
        : status === 'loading'
          ? '⏳ model…'
          : '🎙';

  return (
    <span className="voice-wrap" title={errMsg ?? 'Offline voice: speak a calculation, e.g. "two hundred and fifty times three"'}>
      <button className={`voice-btn ${status === 'recording' ? 'recording' : ''}`} onClick={toggle}>
        {label}
      </button>
      {errMsg && (
        <span className="voice-err" onClick={() => setErrMsg(null)} title="click to dismiss">
          ⚠ {errMsg}
        </span>
      )}
    </span>
  );
}
