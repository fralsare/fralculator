import { useMemo, useState } from 'react';
import { toPng } from 'html-to-image';
import { useCalc } from '../store';
import type { HistoryEntry } from '../store';

export function History() {
  const history = useCalc((s) => s.history);
  const search = useCalc((s) => s.search);
  const setSearch = useCalc((s) => s.setSearch);
  const deleteEntry = useCalc((s) => s.deleteEntry);
  const clearHistory = useCalc((s) => s.clearHistory);
  const setTags = useCalc((s) => s.setTags);
  const setInput = useCalc((s) => s.setInput);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [msg, setMsg] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        h.expression.toLowerCase().includes(q) ||
        h.result.toLowerCase().includes(q) ||
        h.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [history, search]);

  const saveTags = (id: string) => {
    setTags(id, tagDraft.split(',').map((t) => t.trim()).filter(Boolean));
    setTagDraft('');
    setExpanded(null);
  };

  const shareImage = async (h: HistoryEntry) => {
    // Build a styled card in the DOM and rasterize it to PNG.
    const card = document.createElement('div');
    card.style.cssText =
      'width:520px;padding:28px 32px;border-radius:20px;background:linear-gradient(135deg,#1c2340,#251a3d);color:#eef1f8;font-family:Inter,Segoe UI,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)';

    const badge = document.createElement('div');
    badge.textContent = 'Fralculator';
    badge.style.cssText = 'font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#8ea0ff;font-weight:700';

    const exprEl = document.createElement('div');
    exprEl.textContent = h.expression;
    exprEl.style.cssText = 'font-size:22px;font-weight:600;margin-top:14px';

    const resEl = document.createElement('div');
    resEl.textContent = `= ${h.result}`;
    resEl.style.cssText =
      'font-size:40px;font-weight:800;margin-top:8px;background:linear-gradient(90deg,#4f7cff,#9b5cff);-webkit-background-clip:text;background-clip:text;color:transparent';

    card.append(badge, exprEl, resEl);
    if (h.tags.length) {
      const tagsEl = document.createElement('div');
      tagsEl.style.marginTop = '14px';
      h.tags.forEach((t) => {
        const s = document.createElement('span');
        s.textContent = t;
        s.style.cssText =
          'display:inline-block;margin-right:6px;padding:3px 10px;border-radius:999px;background:rgba(79,124,255,.25);font-size:12px';
        tagsEl.append(s);
      });
      card.append(tagsEl);
    }
    const dateEl = document.createElement('div');
    dateEl.textContent = new Date(h.ts).toLocaleString();
    dateEl.style.cssText = 'margin-top:18px;font-size:11px;color:#9aa3b5';
    card.append(dateEl);

    document.body.appendChild(card);
    try {
      const dataUrl = await toPng(card, { cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `fralculator-${h.id}.png`;
      a.click();
      setMsg('Shared image downloaded.');
    } catch {
      setMsg('Could not render the share image.');
    } finally {
      document.body.removeChild(card);
    }
  };

  return (
    <div>
      <input
        className="hist-search"
        placeholder="Search expressions, results, or tags…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {history.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button
            className="mini-btn danger"
            title="Delete every entry"
            onClick={() => {
              if (window.confirm(`Delete all ${history.length} history entries? This cannot be undone.`)) {
                clearHistory();
                setMsg('History cleared.');
              }
            }}
          >
            🧹 Clear all ({history.length})
          </button>
        </div>
      )}
      {msg && <div style={{ fontSize: 12, color: 'var(--ok)', marginBottom: 8 }}>{msg}</div>}
      {filtered.length === 0 && (
        <div className="empty">
          {history.length === 0 ? 'No calculations yet — press = to save one.' : 'Nothing matches your search.'}
        </div>
      )}
      {filtered.map((h) => (
        <div className="hist-item" key={h.id} onClick={() => setInput(h.expression)}>
          <div className="e">{h.expression}</div>
          <div className="r">= {h.result}</div>
          {h.tags.length > 0 && (
            <div className="tags">
              {h.tags.map((t) => (
                <span className="tag" key={t}>{t}</span>
              ))}
            </div>
          )}
          <div className="hist-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="mini-btn"
              onClick={() => {
                setExpanded(expanded === h.id ? null : h.id);
                setTagDraft(h.tags.join(', '));
              }}
            >
              {expanded === h.id ? 'Cancel tags' : '✎ Tags'}
            </button>
            <button className="mini-btn" onClick={() => shareImage(h)}>🖼 Share</button>
            <button className="mini-btn" onClick={() => deleteEntry(h.id)}>🗑</button>
          </div>
          {expanded === h.id && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <input
                className="hist-search"
                style={{ marginBottom: 0, flex: 1 }}
                placeholder="tags, comma, separated"
                value={tagDraft}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTags(h.id); }}
              />
              <button className="mini-btn" onClick={() => saveTags(h.id)}>Save</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
