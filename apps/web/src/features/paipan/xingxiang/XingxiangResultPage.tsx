import type { XingxiangChartResponse, XingxiangPalace } from "@guoxue/contracts";
import { ArrowsOut, CalendarDots, PencilSimple, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { useXingxiangSession } from "./XingxiangSession";

type Period = XingxiangChartResponse["periods"][number];
type Annual = Period["annuals"][number];

function PalaceGrid({ palaces, names, selectedBranch, onSelect }: { palaces: XingxiangPalace[]; names: Map<string, string>; selectedBranch: string; onSelect: (branch: string) => void }) {
  return <div className="xingxiang-palace-grid" aria-label="十二宫星盘">
    {palaces.map((palace) => <button key={palace.branch} type="button" className={selectedBranch === palace.branch ? "selected" : ""} aria-pressed={selectedBranch === palace.branch} onClick={() => onSelect(palace.branch)}>
      <div className="xingxiang-palace-head"><span>{palace.heavenlyStem}{palace.branch}</span><strong>{names.get(palace.branch) ?? palace.name}</strong></div>
      <div className="xingxiang-palace-flags">{palace.bodyPalace && <i>身</i>}{palace.zodiacPalace && <i>肖</i>}{palace.originPalace && <i>来因</i>}</div>
      <div className="xingxiang-stars">{palace.stars.map((star) => <span key={star.name} className={`star-${star.category}`}><b>{star.name}</b>{star.brightness && <small>{star.brightness}</small>}{star.natalTransformation && <em>{star.natalTransformation}</em>}</span>)}</div>
      {palace.selfTransformations.length > 0 && <div className="xingxiang-self">{palace.selfTransformations.map((item) => <span key={`${item.star}-${item.transformation}`}>{item.star}化{item.transformation}{item.inward ? "↙" : "↗"}</span>)}</div>}
    </button>)}
  </div>;
}

function Transformations({ title, items }: { title: string; items: Period["transformations"] }) {
  return <div className="xingxiang-transformations"><strong>{title}</strong>{items.map((item) => <span key={item.transformation}><b>{item.transformation}</b>{item.star}</span>)}</div>;
}

export function XingxiangResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useXingxiangSession();
  const [periodIndex, setPeriodIndex] = useState(0);
  const [annualIndex, setAnnualIndex] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState("未");
  const [expanded, setExpanded] = useState(false);

  const period = chart?.periods[periodIndex];
  const annual = period?.annuals[annualIndex];
  const activeNames = annual?.palaceNames ?? period?.palaceNames ?? [];
  const names = useMemo(() => new Map(activeNames.map((item) => [item.branch, item.name])), [activeNames]);

  if (isRestoring) return <PaipanPageShell pageClassName="result-page xingxiang-result-page"><PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复星像盘" /></PaipanPageShell>;
  if (!chart || !chartRequest || !period || !annual) return <PaipanPageShell pageClassName="result-page xingxiang-result-page"><PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次星像盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<button type="button" onClick={() => navigate("/paipan/xingxiang")}>重新排盘</button>} /></PaipanPageShell>;

  const selected = chart.palaces.find((item) => item.branch === selectedBranch) ?? chart.palaces[0]!;
  const { profile } = chart;
  return <PaipanPageShell pageClassName="result-page xingxiang-result-page">
    <PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" />
    <PaipanSectionCard className="xingxiang-profile" labelledBy="xingxiang-profile-heading">
      <div className="xingxiang-profile-hero"><span>紫</span><div><small>飞星派 · {profile.solarDateTime}</small><h2 id="xingxiang-profile-heading">{profile.name} · {profile.yinYangGender}</h2><p>{profile.lunarDate} · {profile.fiveElementsBureau}</p></div></div>
      <InfoGrid><InfoPair label="公历" value={profile.solarDateTime} /><InfoPair label="农历" value={profile.lunarDate} /></InfoGrid>
      <div className="dunjia-pillar-strip" aria-label="四柱"><div><small>年柱</small><strong>{profile.pillars.year}</strong></div><div><small>月柱</small><strong>{profile.pillars.month}</strong></div><div><small>日柱</small><strong>{profile.pillars.day}</strong></div><div><small>时柱</small><strong>{profile.pillars.hour}</strong></div></div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingxiang-time-card" labelledBy="xingxiang-time-heading">
      <h2 className="result-section-title" id="xingxiang-time-heading"><span>01</span>大限与流年</h2>
      <div className="xingxiang-periods" aria-label="选择大限">{chart.periods.map((item, index) => <button key={item.ganZhi + item.startAge} type="button" className={periodIndex === index ? "active" : ""} onClick={() => { setPeriodIndex(index); setAnnualIndex(0); }}>{item.ganZhi}<small>{item.startAge}–{item.endAge}岁</small></button>)}</div>
      <div className="xingxiang-annuals" aria-label="选择流年">{period.annuals.map((item, index) => <button key={item.year} type="button" className={annualIndex === index ? "active" : ""} onClick={() => setAnnualIndex(index)}>{item.year}<small>{item.ganZhi} · {item.age}岁</small></button>)}</div>
      <div className="xingxiang-transform-row"><Transformations title={`${period.ganZhi}大限四化`} items={period.transformations} /><Transformations title={`${annual.ganZhi}流年四化`} items={annual.transformations} /></div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingxiang-chart-card" labelledBy="xingxiang-chart-heading">
      <div className="xingxiang-chart-title"><h2 className="result-section-title" id="xingxiang-chart-heading"><span>02</span>十二宫星盘</h2><button type="button" onClick={() => setExpanded(true)}><ArrowsOut size={18} />放大查看</button></div>
      <p className="xingxiang-chart-note">当前叠加：{period.ganZhi}大限 · {annual.year}年{annual.ganZhi}流年。点选宫位查看细节。</p>
      <PalaceGrid palaces={chart.palaces} names={names} selectedBranch={selected.branch} onSelect={setSelectedBranch} />
      <div className="xingxiang-palace-detail"><div><small>{selected.heavenlyStem}{selected.branch}</small><h3>{names.get(selected.branch) ?? selected.name}</h3></div><p>{selected.stars.map((star) => `${star.name}${star.brightness ? `（${star.brightness}）` : ""}${star.natalTransformation ? `化${star.natalTransformation}` : ""}`).join(" · ") || "本宫无主辅星"}</p>{selected.selfTransformations.length > 0 && <p className="xingxiang-detail-transform">宫干自化：{selected.selfTransformations.map((item) => `${item.star}化${item.transformation}${item.inward ? "入" : "出"}`).join("、")}</p>}</div>
    </PaipanSectionCard>

    <button className="xingxiang-edit" type="button" onClick={() => navigate("/paipan/xingxiang")}><PencilSimple size={18} />修改个人信息</button>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    {expanded && <div className="xingxiang-dialog" role="dialog" aria-modal="true" aria-label="放大查看十二宫"><div><button className="xingxiang-dialog-close" type="button" aria-label="关闭" onClick={() => setExpanded(false)}><X size={22} /></button><h2>{profile.name} · {period.ganZhi}大限 · {annual.ganZhi}流年</h2><PalaceGrid palaces={chart.palaces} names={names} selectedBranch={selected.branch} onSelect={setSelectedBranch} /></div></div>}
  </PaipanPageShell>;
}
