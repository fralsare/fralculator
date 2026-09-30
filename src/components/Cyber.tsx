import { useMemo, useState } from 'react';
import { subnetCalc, type SubnetInfo } from '../cyber/subnet';
import { hashText, type ShaAlgo } from '../cyber/hash';
import { encodeOp, ENCODE_LABELS, type EncodeOp } from '../cyber/encode';
import { passwordReport, ratePassword, generatePassword, type GeneratorOptions } from '../cyber/password';
import { findPorts } from '../cyber/ports';

type Tool = 'subnet' | 'hash' | 'encode' | 'password' | 'ports';

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'subnet', label: 'Subnet' },
  { id: 'hash', label: 'Hash' },
  { id: 'encode', label: 'Encode' },
  { id: 'password', label: 'Password' },
  { id: 'ports', label: 'Ports' },
];

export function Cyber() {
  const [tool, setTool] = useState<Tool>('subnet');
  return (
    <div className="cyber">
      <div className="cyber-tools">
        {TOOLS.map((t) => (
          <button key={t.id} className={tool === t.id ? 'cyber-tool active' : 'cyber-tool'} onClick={() => setTool(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tool === 'subnet' && <SubnetTool />}
      {tool === 'hash' && <HashTool />}
      {tool === 'encode' && <EncodeTool />}
      {tool === 'password' && <PasswordTool />}
      {tool === 'ports' && <PortsTool />}
    </div>
  );
}

function SubnetTool() {
  const [ip, setIp] = useState('192.168.1.42');
  const [mask, setMask] = useState('/24');
  const result = useMemo(() => subnetCalc(ip, mask), [ip, mask]);
  return (
    <div>
      <div className="cyber-field">
        <label>IPv4 address</label>
        <input className="cyber-input" value={ip} onChange={(e) => setIp(e.target.value)} spellCheck={false} />
      </div>
      <div className="cyber-field">
        <label>CIDR or mask</label>
        <input className="cyber-input" value={mask} onChange={(e) => setMask(e.target.value)} placeholder="/24 or 255.255.255.0" spellCheck={false} />
      </div>
      {result.error ? (
        <div className="cyber-err">{result.error}</div>
      ) : result.info && <SubnetRows info={result.info} />}
    </div>
  );
}

function SubnetRows({ info }: { info: SubnetInfo }) {
  const rows: Array<[string, string]> = [
    ['Network', `${info.network}/${info.prefix}`],
    ['Broadcast', info.broadcast],
    ['Subnet mask', info.mask],
    ['Wildcard', info.wildcard],
    ['First host', info.firstHost ?? '—'],
    ['Last host', info.lastHost ?? '—'],
    ['Usable hosts', String(info.usableHosts)],
    ['Total addresses', String(info.totalHosts)],
    ['Host range', info.range],
    ['Class', `${info.ipClass}${info.isPrivate ? ' · private' : ' · public'}`],
  ];
  return (
    <div className="cyber-rows">
      {rows.map(([k, v]) => (
        <div className="cyber-row" key={k}>
          <span className="k">{k}</span>
          <span className="v">{v}</span>
        </div>
      ))}
    </div>
  );
}

function HashTool() {
  const [text, setText] = useState('hello');
  const [out, setOut] = useState<Array<{ algo: string; hex: string }>>([]);
  const [err, setErr] = useState('');
  const doHash = async (algo: 'MD5' | ShaAlgo) => {
    setErr('');
    try {
      const hex = await hashText(text, algo);
      setOut((prev) => [...prev.filter((h) => h.algo !== algo), { algo, hex }]);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const algos: Array<'MD5' | ShaAlgo> = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];
  return (
    <div>
      <div className="cyber-field">
        <label>Text to hash</label>
        <textarea className="cyber-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>
      <div className="cyber-actions">
        {algos.map((a) => (
          <button key={a} className="mini-btn" onClick={() => void doHash(a)}>{a}</button>
        ))}
      </div>
      {err && <div className="cyber-err">{err}</div>}
      {out.map((h) => (
        <div className="cyber-out" key={h.algo} title="click to copy">
          <div className="algo">{h.algo}</div>
          <code>{h.hex}</code>
        </div>
      ))}
    </div>
  );
}

function EncodeTool() {
  const [text, setText] = useState('attack at dawn');
  const [out, setOut] = useState('');
  const [err, setErr] = useState('');
  const run = (op: EncodeOp) => {
    setErr('');
    try {
      setOut(encodeOp(op, text));
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const ops = Object.keys(ENCODE_LABELS) as EncodeOp[];
  return (
    <div>
      <div className="cyber-field">
        <label>Input</label>
        <textarea className="cyber-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>
      <div className="cyber-actions">
        {ops.map((op) => (
          <button key={op} className="mini-btn" onClick={() => run(op)}>{ENCODE_LABELS[op]}</button>
        ))}
      </div>
      {err && <div className="cyber-err">{err}</div>}
      {out && <div className="cyber-out"><code>{out}</code></div>}
    </div>
  );
}

function PasswordTool() {
  const [pw, setPw] = useState('');
  const [opts, setOpts] = useState<GeneratorOptions>({ length: 16, lower: true, upper: true, digits: true, symbols: true });
  const [genErr, setGenErr] = useState('');
  const [copied, setCopied] = useState(false);
  const report = useMemo(() => (pw ? passwordReport(pw) : null), [pw]);
  const generate = () => {
    setGenErr('');
    setCopied(false);
    try {
      setPw(generatePassword(opts));
    } catch (e) {
      setGenErr((e as Error).message);
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(pw); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setGenErr('Clipboard unavailable.'); }
  };
  const rating = pw ? ratePassword(pw) : null;
  return (
    <div>
      <div className="cyber-field">
        <label>Generate</label>
        <div className="cyber-gen">
          <div className="cyber-field">
            <label>Length · {opts.length}</label>
            <input
              type="range" min={6} max={40} value={opts.length}
              onChange={(e) => setOpts((o) => ({ ...o, length: Number(e.target.value) }))}
            />
          </div>
          <div className="cyber-actions">
            {([
              ['lower', 'a–z'], ['upper', 'A–Z'], ['digits', '0–9'], ['symbols', '!@#$'],
            ] as Array<[keyof GeneratorOptions, string]>).map(([key, label]) => (
              <button
                key={key}
                className={opts[key] ? 'mini-btn' : 'mini-btn off'}
                onClick={() => setOpts((o) => ({ ...o, [key]: !o[key] as boolean }))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="cyber-actions">
            <button className="mini-btn primary" onClick={generate}>Generate</button>
            {pw && <button className="mini-btn" onClick={() => void copy()}>{copied ? 'Copied ✓' : 'Copy'}</button>}
          </div>
        </div>
        {genErr && <div className="cyber-err">{genErr}</div>}
      </div>
      <div className="cyber-field">
        <label>Password (visible — nothing leaves this machine)</label>
        <input className="cyber-input" type="text" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" spellCheck={false} />
      </div>
      {report && (
        <>
          <div className="cyber-rows">
            {rating && (
              <div className="cyber-row">
                <span className="k">Rating</span>
                <span className={`rating rating-${rating}`}>{rating.toUpperCase()}</span>
              </div>
            )}
            <div className="cyber-row"><span className="k">Entropy</span><span className="v">{report.entropyBits.toFixed(1)} bits</span></div>
            <div className="cyber-row"><span className="k">Character pool</span><span className="v">{report.poolSize}</span></div>
            <div className="cyber-row"><span className="k">Combinations</span><span className="v">{report.combinations}</span></div>
            <div className="cyber-row"><span className="k">Verdict</span><span className="v">{report.verdict}</span></div>
          </div>
          <div className="cyber-sub">Brute-force time (average = half the keyspace)
          </div>
          <div className="cyber-sub">Brute-force time (average = half the keyspace)</div>
          <div className="cyber-rows">
            {report.crackTimes.map((c) => (
              <div className="cyber-row" key={c.label}><span className="k">{c.label}</span><span className="v">{c.text}</span></div>
            ))}
          </div>
          {report.tips.length > 0 && (
            <ul className="cyber-tips">
              {report.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function PortsTool() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => findPorts(q), [q]);
  return (
    <div>
      <div className="cyber-field">
        <label>Search port or service</label>
        <input className="cyber-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 3389, smb, or database" spellCheck={false} />
      </div>
      <div className="cyber-rows">
        {rows.map((p) => (
          <div className="cyber-row" key={p.port}>
            <span className="k">{p.port} · {p.name}</span>
            <span className="v">{p.desc}{p.risk ? ` ⚠ ${p.risk}` : ''}</span>
          </div>
        ))}
        {rows.length === 0 && <div className="cyber-err">No matching ports.</div>}
      </div>
    </div>
  );
}
