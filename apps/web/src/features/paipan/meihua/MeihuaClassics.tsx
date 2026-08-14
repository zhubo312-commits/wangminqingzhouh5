import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { getHexagramMeta, HEXAGRAM_PALACES } from "../hexagram-palaces";
import { MEIHUA_CLASSICS, type MeihuaClassicHexagram } from "./hexagrams";

interface ClassicEntry {
  classic: MeihuaClassicHexagram;
  number: number;
  symbol: string;
}

const CLASSICS_BY_NAME = new Map<string, ClassicEntry>(
  MEIHUA_CLASSICS.map((classic) => {
    const meta = getHexagramMeta(classic.name);
    return [classic.name, {
    classic: classic as MeihuaClassicHexagram,
    number: meta?.number ?? 0,
    symbol: meta?.symbol ?? "",
  }];
  }),
);

const PALACE_GROUPS = HEXAGRAM_PALACES.map((palace) => ({
  ...palace,
  classics: palace.hexagrams.flatMap((name) => {
    const entry = CLASSICS_BY_NAME.get(name);
    return entry ? [entry] : [];
  }),
}));

export function MeihuaClassicContent({ classic }: { classic: MeihuaClassicHexagram }) {
  return (
    <div className="meihua-classic-content">
      <div className="meihua-classic-lead"><span>易</span><div><small>周易六十四卦</small><h3>{classic.name}</h3></div></div>
      <section><h4>卦辞</h4><p>{classic.judgment}</p></section>
      <section><h4>彖传</h4><p>{classic.tuan}</p></section>
      <section><h4>象传</h4><p>{classic.image}</p></section>
      {classic.use && <section><h4>用爻</h4><p>{classic.use}</p></section>}
      <div className="meihua-classic-lines">
        {classic.lines.map((line) => <section key={line.index}><h4>第{line.index}爻</h4><p>{line.text}</p><small>{line.image}</small></section>)}
      </div>
    </div>
  );
}

export function MeihuaClassicDialog({ classic, onClose }: { classic: MeihuaClassicHexagram; onClose: () => void }) {
  return (
    <div className="meihua-classic-overlay" role="dialog" aria-modal="true" aria-labelledby="meihua-classic-heading">
      <div className="meihua-classic-dialog">
        <div className="meihua-classic-dialog-head"><div><small>卦象原文</small><h2 id="meihua-classic-heading">{classic.name}</h2></div><button type="button" aria-label="关闭卦象原文" onClick={onClose}><X size={22} aria-hidden="true" /></button></div>
        <MeihuaClassicContent classic={classic} />
      </div>
    </div>
  );
}

function ClassicButton({ entry, onSelect }: { entry: ClassicEntry; onSelect: (classic: MeihuaClassicHexagram) => void }) {
  return (
    <button type="button" aria-label={`查看第${entry.number}卦 ${entry.classic.name}`} onClick={() => onSelect(entry.classic)}>
      <small>{String(entry.number).padStart(2, "0")}</small>
      <strong>{entry.classic.name}</strong>
      <span className="meihua-classic-symbol" aria-hidden="true">{entry.symbol}</span>
    </button>
  );
}

export function MeihuaClassicBrowser() {
  const [query, setQuery] = useState("");
  const [openPalace, setOpenPalace] = useState<string | null>(null);
  const [selected, setSelected] = useState<MeihuaClassicHexagram | null>(null);
  const results = useMemo(() => {
    const keyword = query.trim();
    return keyword
      ? Array.from(CLASSICS_BY_NAME.values()).filter((entry) => entry.classic.name.includes(keyword))
      : [];
  }, [query]);
  const searching = query.trim().length > 0;

  return (
    <div className="meihua-classic-browser">
      <div className="meihua-classic-search"><MagnifyingGlass size={19} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索卦名，如：乾、未济" aria-label="搜索六十四卦" /></div>
      {searching ? <>
        <div className="meihua-classic-search-summary"><strong>跨八宫搜索</strong><span>{results.length} 卦</span></div>
        {results.length > 0
          ? <div className="meihua-classic-grid meihua-classic-grid--search" aria-label="六十四卦搜索结果">{results.map((entry) => <ClassicButton key={entry.classic.key} entry={entry} onSelect={setSelected} />)}</div>
          : <p className="meihua-no-classic">未找到对应卦象</p>}
      </> : <div className="meihua-palace-list" aria-label="八宫六十四卦">
        {PALACE_GROUPS.map((palace) => {
          const expanded = openPalace === palace.key;
          const contentId = `meihua-palace-${palace.key}`;
          const headingId = `${contentId}-heading`;
          return (
            <section className={`meihua-palace-group${expanded ? " expanded" : ""}`} key={palace.key}>
              <h4 id={headingId}>
                <button type="button" className="meihua-palace-trigger" aria-expanded={expanded} aria-controls={contentId} onClick={() => setOpenPalace(expanded ? null : palace.key)}>
                  <span className="meihua-palace-symbol" aria-hidden="true">{palace.symbol}</span>
                  <span className="meihua-palace-label"><strong>{palace.name}宫</strong><small>{palace.element} · 八卦</small></span>
                  <span className="meihua-palace-count">8</span>
                  <CaretDown size={18} weight="bold" aria-hidden="true" />
                </button>
              </h4>
              {expanded && <div className="meihua-classic-grid" id={contentId} role="region" aria-labelledby={headingId}>{palace.classics.map((entry) => <ClassicButton key={entry.classic.key} entry={entry} onSelect={setSelected} />)}</div>}
            </section>
          );
        })}
      </div>}
      {selected && <MeihuaClassicDialog classic={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
