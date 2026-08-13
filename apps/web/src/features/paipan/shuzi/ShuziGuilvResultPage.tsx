import type { ShuziGuilvChartResponse, ShuziNumberCell } from "@guoxue/contracts";
import { ArrowClockwise, CalendarDots, HashStraight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { useShuziGuilvSession } from "./ShuziGuilvSession";

const KEYS = ["year", "month", "day", "hour"] as const;
const LABELS = { year: "年", month: "月", day: "日", hour: "时" } as const;

function NumberCell({ cell, label }: { cell: ShuziNumberCell; label: string }) {
  return <div className="shuzi-number-cell"><small>{label}</small><strong>{cell.numbers.join(" · ")}</strong><span>{cell.yinYang.join(" · ")}</span><em>{cell.elements.join(" · ")}</em></div>;
}

function NumberBoard({ title, data }: { title: string; data: ShuziGuilvChartResponse["innate"] }) {
  return <div className="shuzi-number-board"><div className="shuzi-number-board-title"><span>{title === "先天数" ? "先" : "后"}</span><h3>{title}</h3></div><div className="shuzi-number-grid">{KEYS.map((key) => <NumberCell key={key} label={LABELS[key]} cell={data[key]} />)}</div></div>;
}

export function ShuziGuilvResultPage() {
  const navigate = useNavigate();
  const { chart, isRestoring } = useShuziGuilvSession();
  if (isRestoring) return <PaipanPageShell pageClassName="result-page shuzi-result-page"><PageHeader title="数字规律" backTo="/paipan/shuzi-guilv" backLabel="返回数字规律表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复数字盘" /></PaipanPageShell>;
  if (!chart) return <PaipanPageShell pageClassName="result-page shuzi-result-page"><PageHeader title="数字规律" backTo="/paipan/shuzi-guilv" backLabel="返回数字规律表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次数字盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<button type="button" onClick={() => navigate("/paipan/shuzi-guilv")}>重新排盘</button>} /></PaipanPageShell>;
  return <PaipanPageShell pageClassName="result-page shuzi-result-page">
    <PageHeader title="数字规律" backTo="/paipan/shuzi-guilv" backLabel="返回数字规律表单" />
    <PaipanSectionCard className="shuzi-overview-card" labelledBy="shuzi-overview-heading">
      <div className="shuzi-profile-hero"><span><HashStraight size={28} /></span><div><small>{chart.overview.genderLabel} · 生肖{chart.overview.chineseZodiac}</small><h2 id="shuzi-overview-heading">{chart.overview.name}的数字盘</h2><p>{chart.overview.lunarDate}</p></div></div>
      <InfoGrid><InfoPair label="阳历" value={chart.overview.solarDateTime} /><InfoPair label="生肖" value={chart.overview.chineseZodiac} /></InfoGrid>
    </PaipanSectionCard>
    <PaipanSectionCard className="shuzi-board-card" labelledBy="shuzi-board-heading"><h2 className="result-section-title" id="shuzi-board-heading"><span>01</span>先后天数字</h2><p className="shuzi-reading-hint">每格依次显示数字、阴阳与五行。日数可能由多个数字共同组成。</p><div className="shuzi-boards"><NumberBoard title="先天数" data={chart.innate} /><NumberBoard title="后天数" data={chart.acquired} /></div></PaipanSectionCard>
    <PaipanSectionCard className="shuzi-reading-card" labelledBy="shuzi-reading-heading"><h2 className="result-section-title" id="shuzi-reading-heading"><span>02</span>特殊数组解读</h2>{chart.interpretations.length === 0 ? <div className="shuzi-no-reading"><strong>本盘未出现已收录的特殊数组</strong><p>数字关系仍可结合上方阴阳、五行分布继续研究。</p></div> : <div className="shuzi-interpretations">{chart.interpretations.map((item) => <article key={`${item.combination}-${item.position}-${item.category}`}><div><strong>{item.combination}</strong><span>{item.category}</span>{item.occurrences > 1 && <em>出现 {item.occurrences} 次</em>}</div><small>{item.position}</small><p>{item.description}</p></article>)}</div>}</PaipanSectionCard>
    <button className="paipan-secondary-action shuzi-restart" type="button" onClick={() => navigate("/paipan/shuzi-guilv")}><ArrowClockwise size={19} />重新排盘</button>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
