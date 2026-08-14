import type { LuojiLine } from "@guoxue/contracts";
import { CalendarDots } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { getHexagramMeta } from "../hexagram-palaces";
import { useLuojiSession } from "./LuojiSession";

function LineMark({ kind, moving }: { kind: "yang" | "yin"; moving?: boolean }) {
  return <span className={`luoji-line-mark ${kind}${moving ? " moving" : ""}`}>{kind === "yang" ? <i /> : <><i /><i /></>}{moving && <b>{kind === "yang" ? "○" : "×"}</b>}</span>;
}

function LuojiLineRow({ line }: { line: LuojiLine }) {
  return (
    <div className={`luoji-line-row${line.isMoving ? " moving" : ""}`}>
      <div className="luoji-deity"><small>{line.position}爻</small><strong>{line.deity}</strong>{line.hiddenKin && <span>伏 {line.hiddenKin} {line.hiddenStemBranch}</span>}</div>
      <div className="luoji-line-side original"><small>{line.originalKin}</small><strong>{line.originalStemBranch}<em>{line.originalElement}</em></strong><LineMark kind={line.originalLine} moving={line.isMoving} />{line.marker && <b className="luoji-marker">{line.marker}</b>}</div>
      <span className="luoji-change-arrow">→</span>
      <div className="luoji-line-side changed"><LineMark kind={line.changedLine} /><strong>{line.changedStemBranch}<em>{line.changedElement}</em></strong><small>{line.changedKin}</small></div>
    </div>
  );
}

export function LuojiResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useLuojiSession();
  if (isRestoring) return <PaipanPageShell pageClassName="result-page luoji-result-page"><PageHeader title="逻辑学" backTo="/paipan/luoji" backLabel="返回逻辑排盘" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="正在恢复逻辑盘" /></PaipanPageShell>;
  if (!chart || !chartRequest) return <PaipanPageShell pageClassName="result-page luoji-result-page"><PageHeader title="逻辑学" backTo="/paipan/luoji" backLabel="返回逻辑排盘" /><PaipanEmptyState icon={<CalendarDots size={46} aria-hidden="true" />} title="本次逻辑盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/luoji")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;
  const { overview } = chart;
  const originalMeta = getHexagramMeta(chart.original.name);
  const changedMeta = getHexagramMeta(chart.changed.name);
  return (
    <PaipanPageShell pageClassName="result-page luoji-result-page">
      <PageHeader title="逻辑学" backTo="/paipan/luoji" backLabel="返回逻辑排盘" />
      <PaipanSectionCard className="luoji-overview-card" labelledBy="luoji-overview-heading">
        <div className="luoji-result-hero"><span>爻</span><div><small>{overview.method} · {overview.solarDateTime}</small><h2 id="luoji-overview-heading">{chart.original.name} <i>之</i> {chart.changed.name}</h2><p>{overview.question || "未填写占问事项"}</p></div></div>
        <InfoGrid><InfoPair label="四柱" value={overview.lunarDate} /><InfoPair label="日空" value={overview.voidBranches} /><InfoPair label="本卦宫位" value={`${chart.original.palace.name} · ${chart.original.palace.sequence}${chart.original.palace.type ? ` · ${chart.original.palace.type}` : ""}`} /><InfoPair label="变卦宫位" value={`${chart.changed.palace.name} · ${chart.changed.palace.sequence}${chart.changed.palace.type ? ` · ${chart.changed.palace.type}` : ""}`} /></InfoGrid>
        <div className="dunjia-pillar-strip" aria-label="四柱"><div><small>年柱</small><strong>{overview.pillars.year}</strong></div><div><small>月柱</small><strong>{overview.pillars.month}</strong></div><div><small>日柱</small><strong>{overview.pillars.day}</strong></div><div><small>时柱</small><strong>{overview.pillars.hour}</strong></div></div>
      </PaipanSectionCard>

      <PaipanSectionCard className="luoji-chart-card" labelledBy="luoji-chart-heading">
        <div className="luoji-chart-title"><div><span>本卦</span><b aria-hidden="true">{originalMeta?.symbol}</b><h2 id="luoji-chart-heading">{chart.original.name}</h2><small>{chart.original.upperTrigram}上 · {chart.original.lowerTrigram}下</small></div><i>之</i><div><span>变卦</span><b aria-hidden="true">{changedMeta?.symbol}</b><h2>{chart.changed.name}</h2><small>{chart.changed.upperTrigram}上 · {chart.changed.lowerTrigram}下</small></div></div>
        <div className="luoji-column-head"><span>六神／伏神</span><span>本卦六亲 · 纳甲</span><span>变卦六亲 · 纳甲</span></div>
        <div className="luoji-lines-table">{chart.lines.map((line) => <LuojiLineRow key={line.position} line={line} />)}</div>
        <div className="luoji-legend"><span><i className="moving-dot" />动爻</span><span><b>世</b>世爻</span><span><b>应</b>应爻</span><span>伏 · 伏神</span></div>
      </PaipanSectionCard>
      <PaipanActionButton variant="restart" className="luoji-restart" onClick={() => navigate("/paipan/luoji")}>重新起盘</PaipanActionButton>
      <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
