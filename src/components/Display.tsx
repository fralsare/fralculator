import { useRef, useState } from 'react';
import { useCalc } from '../store';
import { VoiceButton } from './VoiceButton';

export function Display({
  value,
  error,
  stepsCount,
  nlNote,
  autoNote,
  interpretedAs,
  onNl,
  onVoice,
  onEquals,
  hasPendingNl,
  onCancelNl,
}: {
  value: number | null;
  error: string | null;
  stepsCount: number;
  nlNote: string;
  autoNote: string | null;
  interpretedAs: string | null;
  onNl: (text: string) => void;
  onVoice: (text: string) => void;
  onEquals: () => void;
  hasPendingNl: boolean;
  onCancelNl: () => void;
}) {
  const input = useCalc((s) => s.input);
  const setInput = useCalc((s) => s.setInput);
  const [nlText, setNlText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="display">
      <div className="nl-row">
        <input
          className="nl-input"
          placeholder='Try "what is 15% of 240" or "convert 72 fahrenheit to celsius"'
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nlText.trim()) {
              onNl(nlText);
              setNlText('');
            }
          }}
        />
        <VoiceButton onResult={onVoice} />
      </div>
      {hasPendingNl ? (
        <div className="expr">
          {nlNote}
          <span
            style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--text-dim)' }}
            onClick={onCancelNl}
            title="Discard AI interpretation"
          >
            ✕
          </span>
        </div>
      ) : (
        <input
          ref={inputRef}
          className="expr"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', textAlign: 'right', width: '100%',
            fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEquals();
            if (e.key === 'Backspace' && e.nativeEvent.isComposing === false) {
              // default behavior is fine
            }
          }}
          spellCheck={false}
          placeholder="Type or tap…"
        />
      )}
      <div className={error ? 'result err' : 'result'}>
        {error ? error : value !== null ? `= ${formatCompact(value)}` : ''}
      </div>
      {autoNote && <div className="nl-note" style={{ color: 'var(--accent)' }} title="Autocorrect applied">✨ Auto-corrected: {autoNote}</div>}
      <div className="nl-note">{interpretedAs ?? (!error && value !== null && stepsCount > 0 ? `${stepsCount} step${stepsCount > 1 ? 's' : ''} — see Steps tab` : '')}</div>
    </div>
  );
}

function formatCompact(v: number): string {
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) return v.toExponential(8);
  return String(parseFloat(v.toPrecision(12)));
}
