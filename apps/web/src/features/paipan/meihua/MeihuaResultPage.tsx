import type { MeihuaHexagram } from "@guoxue/contracts";
import { BookOpenText, CalendarDots } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { findMeihuaClassic, type MeihuaClassicHexagram } from "./hexagrams";
import { MeihuaClassicDialog } from "./MeihuaClassics";
import { useMeihuaSession } from "./MeihuaSession";

function HexagramLines({ hexagram, movingLine }: { hexagram: MeihuaHexagram; movingLine: number | undefined }) {
  return (
    <div className="meihua-lines" aria-label={`${hexagram.name}六爻`}>
      {[...hexagram.lines].map((line, index) => ({ line, lineNumber: index + 1 })).reverse().map(({ line, lineNumber }) => <div key={lineNumber} className={movingLine === lineNumber ? "moving" : ""}><small>{lineNumber}</small><span className={line}>{line === "yang" ? <i /> : <><i /><i /></>}</span>{movingLine === lineNumber && <b>动</b>}</div>)}
    </div>
  );
}

function HexagramCard({ label, hexagram, movingLine, onOpen }: { label: string; hexagram: MeihuaHexagram; movingLine?: number; onOpen: () => void }) {
  return (
    <button type="button" className="meihua-hexagram-card" onClick={onOpen}>
      <div className="meihua-hexagram-title"><span>{label}</span><div><small>{hexagram.upper.name}上 · {hexagram.lower.name}下</small><h3>{hexagram.name}</h3></div></div>
      <HexagramLines hexagram={hexagram} movingLine={movingLine} />
      <span className="meihua-read-classic"><BookOpenText size={17} aria-hidden="true" />查看卦辞与爻辞</span>
    </button>
  );
}

export function MeihuaResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useMeihuaSession();
  const [classic, setClassic] = useState<MeihuaClassicHexagram | null>(null);

  if (isRestoring) return <PaipanPageShell pageClassName="result-page meihua-result-page"><PageHeader title="梅花学" backTo="/paipan/meihua" backLabel="返回梅花起盘" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="正在恢复梅花盘" /></PaipanPageShell>;
  if (!chart || !chartRequest) return <PaipanPageShell pageClassName="result-page meihua-result-page"><PageHeader title="梅花学" backTo="/paipan/meihua" backLabel="返回梅花起盘" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="本次梅花盘已失效" description="排盘引用不存在或已过期，请重新起盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/meihua")}>重新起盘</PaipanActionButton>} /></PaipanPageShell>;

  const { overview } = chart;
  const schoolLabel = overview.school === "digit_sum" ? "朱昱／易谦老师" : overview.school === "raw_number" ? "广元老师" : null;
  const openClassic = (hexagram: MeihuaHexagram) => {
    const found = findMeihuaClassic(hexagram.key);
    if (found) setClassic(found);
  };

  return (
    <PaipanPageShell pageClassName="result-page meihua-result-page">
      <PageHeader title="梅花学" backTo="/paipan/meihua" backLabel="返回梅花起盘" />
      <PaipanSectionCard className="meihua-overview-card" labelledBy="meihua-overview-heading">
        <div className="meihua-result-hero"><span>梅</span><div><small>{overview.method} · {overview.solarDateTime}</small><h2 id="meihua-overview-heading">{chart.original.name}</h2><p>{chart.original.upper.symbol} {chart.original.upper.name}上 · {chart.original.lower.symbol} {chart.original.lower.name}下 · 第{chart.movingLine}爻动</p></div></div>
        <InfoGrid>
          <InfoPair label="农历" value={overview.lunarDate} /><InfoPair label="旬空" value={overview.voidBranches} />
          <InfoPair label="起卦流派" value={schoolLabel ?? "—"} /><InfoPair label="报数" value={overview.numberOne && overview.numberTwo ? `${overview.numberOne}、${overview.numberTwo}` : "—"} />
        </InfoGrid>
        <div className="dunjia-pillar-strip" aria-label="四柱"><div><small>年柱</small><strong>{overview.pillars.year}</strong></div><div><small>月柱</small><strong>{overview.pillars.month}</strong></div><div><small>日柱</small><strong>{overview.pillars.day}</strong></div><div><small>时柱</small><strong>{overview.pillars.hour}</strong></div></div>
      </PaipanSectionCard>

      <PaipanSectionCard className="meihua-chart-section" labelledBy="meihua-chart-heading">
        <h2 className="result-section-title" id="meihua-chart-heading"><span>01</span>本卦 · 互卦 · 变卦</h2>
        <p className="meihua-chart-hint">六爻自下而上排列，点击卦象可查阅卦辞、彖传、象传与爻辞。</p>
        <div className="meihua-hexagram-grid">
          <HexagramCard label="本卦" hexagram={chart.original} movingLine={chart.movingLine} onOpen={() => openClassic(chart.original)} />
          <HexagramCard label="互卦" hexagram={chart.mutual} onOpen={() => openClassic(chart.mutual)} />
          <HexagramCard label="变卦" hexagram={chart.changed} onOpen={() => openClassic(chart.changed)} />
        </div>
      </PaipanSectionCard>

      <PaipanActionButton variant="restart" className="meihua-restart" onClick={() => navigate("/paipan/meihua")}>重新起盘或查阅六十四卦</PaipanActionButton>
      <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
      {classic && <MeihuaClassicDialog classic={classic} onClose={() => setClassic(null)} />}
    </PaipanPageShell>
  );
}
