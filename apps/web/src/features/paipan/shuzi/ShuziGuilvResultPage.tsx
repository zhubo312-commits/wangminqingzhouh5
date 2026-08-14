import type { ShuziGuilvChartResponse, ShuziNumberCell } from "@guoxue/contracts";
import { CalendarDots, HashStraight } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { FiveElementLabel } from "../../../components/paipan/FiveElementLabel";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { useShuziGuilvSession } from "./ShuziGuilvSession";

const KEYS = ["year", "month", "day", "hour"] as const;
const LABELS = { year: "年", month: "月", day: "日", hour: "时" } as const;

function ElementCell({ cell }: { cell: ShuziNumberCell }) {
  return <div className="shuzi-element-list">{cell.elements.map((element, index) => <FiveElementLabel key={`${element}-${index}`} element={element} iconSize={14} />)}</div>;
}

function NumberBoardSection({ title, data }: { title: "先天数" | "后天数"; data: ShuziGuilvChartResponse["innate"] }) {
  return <table className="shuzi-number-table" aria-label={title}>
    <thead><tr><th scope="col">时间</th>{KEYS.map((key) => <th key={key} scope="col">{LABELS[key]}</th>)}</tr></thead>
    <tbody>
      <tr className="shuzi-number-row"><th scope="row">{title}</th>{KEYS.map((key) => <td key={key}><strong>{data[key].numbers.join(" · ")}</strong></td>)}</tr>
      <tr className="shuzi-yinyang-row"><th scope="row">阴阳</th>{KEYS.map((key) => <td key={key}>{data[key].yinYang.join(" · ")}</td>)}</tr>
      <tr className="shuzi-element-row"><th scope="row">五行</th>{KEYS.map((key) => <td key={key}><ElementCell cell={data[key]} /></td>)}</tr>
    </tbody>
  </table>;
}

function NumberBoard({ chart }: { chart: ShuziGuilvChartResponse }) {
  return <div className="shuzi-number-board"><NumberBoardSection title="先天数" data={chart.innate} /><NumberBoardSection title="后天数" data={chart.acquired} /></div>;
}

type ShuziInterpretation = ShuziGuilvChartResponse["interpretations"][number];

function InterpretationCard({ item }: { item: ShuziInterpretation }) {
  return <article aria-label={`${item.combination} ${item.position}`}>
    <dl>
      <div><dt>数字组合</dt><dd><strong>{item.combination}</strong>{item.occurrences > 1 && <span className="shuzi-occurrence-count">出现 {item.occurrences} 次</span>}</dd></div>
      <div><dt>特殊数组</dt><dd><span className="shuzi-interpretation-category">{item.category}</span></dd></div>
      <div><dt>出现位置</dt><dd>{item.position}</dd></div>
      <div className="shuzi-interpretation-result"><dt>结果解读</dt><dd><p>{item.description}</p></dd></div>
    </dl>
    {item.occurrences > 1 && <p className="shuzi-occurrence-note">先天与后天均命中该组合，已合并展示。</p>}
  </article>;
}

export function ShuziGuilvResultPage() {
  const navigate = useNavigate();
  const { chart, isRestoring } = useShuziGuilvSession();
  if (isRestoring) return <PaipanPageShell pageClassName="result-page shuzi-result-page"><PageHeader title="数字规律" backTo="/paipan/shuzi-guilv" backLabel="返回数字规律表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复数字盘" /></PaipanPageShell>;
  if (!chart) return <PaipanPageShell pageClassName="result-page shuzi-result-page"><PageHeader title="数字规律" backTo="/paipan/shuzi-guilv" backLabel="返回数字规律表单" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次数字盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/shuzi-guilv")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;
  return <PaipanPageShell pageClassName="result-page shuzi-result-page">
    <PageHeader title="数字规律" backTo="/paipan/shuzi-guilv" backLabel="返回数字规律表单" />
    <PaipanSectionCard className="shuzi-overview-card" labelledBy="shuzi-overview-heading">
      <div className="shuzi-profile-hero"><span><HashStraight size={28} /></span><div><small>{chart.overview.genderLabel} · 生肖{chart.overview.chineseZodiac}</small><h2 id="shuzi-overview-heading">{chart.overview.name}的数字盘</h2><p>{chart.overview.lunarDate}</p></div></div>
      <InfoGrid><InfoPair label="阳历" value={chart.overview.solarDateTime} /><InfoPair label="生肖" value={chart.overview.chineseZodiac} /></InfoGrid>
    </PaipanSectionCard>
    <PaipanSectionCard className="shuzi-board-card" labelledBy="shuzi-board-heading"><h2 className="result-section-title" id="shuzi-board-heading"><span>01</span>先后天数字</h2><p className="shuzi-reading-hint">按时间对照先天数、阴阳与五行，再查看对应的后天数。日数可能由多个数字共同组成。</p><NumberBoard chart={chart} /></PaipanSectionCard>
    <PaipanSectionCard className="shuzi-reading-card" labelledBy="shuzi-reading-heading"><h2 className="result-section-title" id="shuzi-reading-heading"><span>02</span>特殊数组解读</h2>{chart.interpretations.length === 0 ? <div className="shuzi-no-reading"><strong>本盘未出现已收录的特殊数组</strong><p>数字关系仍可结合上方阴阳、五行分布继续研究。</p></div> : <div className="shuzi-interpretations">{chart.interpretations.map((item) => <InterpretationCard key={`${item.combination}-${item.position}-${item.category}`} item={item} />)}</div>}</PaipanSectionCard>
    <PaipanActionButton variant="restart" className="shuzi-restart" onClick={() => navigate("/paipan/shuzi-guilv")}>重新排盘</PaipanActionButton>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
