import { BookOpenText, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { MEIHUA_CLASSICS, type MeihuaClassicHexagram } from "./hexagrams";

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

export function MeihuaClassicBrowser() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MeihuaClassicHexagram | null>(null);
  const results = useMemo(() => {
    const keyword = query.trim();
    return keyword ? MEIHUA_CLASSICS.filter((item) => item.name.includes(keyword)) : MEIHUA_CLASSICS;
  }, [query]);
  return (
    <div className="meihua-classic-browser">
      <div className="meihua-classic-search"><MagnifyingGlass size={19} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索卦名，如：乾、未济" aria-label="搜索六十四卦" /></div>
      <div className="meihua-classic-grid" aria-label="八宫六十四卦">
        {results.map((item, index) => <button type="button" key={item.key} onClick={() => setSelected(item)}><small>{String(index + 1).padStart(2, "0")}</small><strong>{item.name}</strong><BookOpenText size={16} aria-hidden="true" /></button>)}
      </div>
      {results.length === 0 && <p className="meihua-no-classic">未找到对应卦象</p>}
      {selected && <MeihuaClassicDialog classic={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
