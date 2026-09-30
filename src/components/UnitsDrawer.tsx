import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, convert } from '../units/data';
import { formatNumber } from '../math/engine';
import { useCalc } from '../store';

export function UnitsDrawer() {
  const open = useCalc((s) => s.unitsOpen);
  const setOpen = useCalc((s) => s.setUnitsOpen);
  const request = useCalc((s) => s.conversionRequest);

  const [catId, setCatId] = useState(CATEGORIES[0].id);
  const [fromId, setFromId] = useState(CATEGORIES[0].units[0].id);
  const [toId, setToId] = useState(CATEGORIES[0].units[1]?.id ?? CATEGORIES[0].units[0].id);
  const [value, setValue] = useState('1');

  // apply NL "convert 72 fahrenheit to celsius" requests
  useEffect(() => {
    if (!request) return;
    for (const c of CATEGORIES) {
      const f = c.units.find((u) => u.name.toLowerCase() === request.from);
      const t = c.units.find((u) => u.name.toLowerCase() === request.to);
      if (f && t) {
        setCatId(c.id);
        setFromId(f.id);
        setToId(t.id);
        setValue(request.value);
        break;
      }
    }
    useCalc.getState().setConversionRequest(null);
  }, [request]);

  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0];

  useEffect(() => {
    // keep unit selection valid when category changes
    if (!cat.units.some((u) => u.id === fromId)) setFromId(cat.units[0].id);
    if (!cat.units.some((u) => u.id === toId)) setToId(cat.units[1]?.id ?? cat.units[0].id);
  }, [catId]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (Number.isNaN(v)) return null;
    try {
      return convert(v, fromId, toId, cat.id);
    } catch {
      return null;
    }
  }, [value, fromId, toId, cat]);

  return (
    <div className={open ? 'drawer open' : 'drawer'}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2>Convert</h2>
        <span style={{ flex: 1 }} />
        <button className="icon-btn" onClick={() => setOpen(false)}>✕</button>
      </div>

      <select value={catId} onChange={(e) => setCatId(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" />
      <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
        {cat.units.map((u) => (
          <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
        ))}
      </select>
      <select value={toId} onChange={(e) => setToId(e.target.value)}>
        {cat.units.map((u) => (
          <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
        ))}
      </select>

      <div className="conv-result">
        <div className="big">{result !== null ? formatNumber(result) : '—'}</div>
        <div className="small">
          {result !== null
            ? `${formatNumber(parseFloat(value))} ${cat.units.find((u) => u.id === fromId)?.symbol} = ${formatNumber(result)} ${cat.units.find((u) => u.id === toId)?.symbol}`
            : 'Enter a valid number'}
        </div>
      </div>

      <CurrencyPanel />
    </div>
  );
}

/** Live currency rates from the free ECB-based Frankfurter API (no key). */
function CurrencyPanel() {
  const [base, setBase] = useState('USD');
  const [target, setTarget] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState('Loading…');

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      fetch(`https://api.frankfurter.app/latest?from=${base}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) {
            setRates(d.rates);
            setStatus('Live rates (ECB, free API)');
          }
        })
        .catch(() => {
          if (!cancelled) setStatus('Offline — currency rates unavailable');
        });
    }, 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [base]);

  const out =
    rates && rates[target] !== undefined
      ? formatNumber(parseFloat(amount) * (rates[target] ?? 0))
      : '—';

  return (
    <div style={{ marginTop: 18 }}>
      <div className="section-title">Currency (live)</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>{status}</div>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={base} onChange={(e) => setBase(e.target.value)} style={{ flex: 1 }}>
          {['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CHF', 'CAD', 'AUD'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ flex: 1 }}>
          {['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CHF', 'CAD', 'AUD'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="conv-result" style={{ marginTop: 10 }}>
        <div className="big">{out}</div>
        <div className="small">{amount} {base} in {target}</div>
      </div>
    </div>
  );
}
