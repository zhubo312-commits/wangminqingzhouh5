import type { XingxiangChartResponse, XingxiangPalace } from "@guoxue/contracts";
import { ArrowClockwise, ArrowsOut, CalendarDots, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { useXingxiangSession } from "./XingxiangSession";

type Period = XingxiangChartResponse["periods"][number];
type Annual = Period["annuals"][number];
type Profile = XingxiangChartResponse["profile"];
type PalaceStar = XingxiangPalace["stars"][number];

const STAR_GROUPS: ReadonlyArray<{ category: PalaceStar["category"]; label: string }> = [
  { category: "major", label: "主星" },
  { category: "soft", label: "辅曜" },
  { category: "tough", label: "煞曜" },
  { category: "flower", label: "禄马桃花" },
  { category: "support", label: "杂曜" },
];

const TOP_BRANCHES = ["巳", "午", "未", "申"] as const;
const UPPER_MIDDLE_BRANCHES = ["辰", "酉"] as const;
const LOWER_MIDDLE_BRANCHES = ["卯", "戌"] as const;
const BOTTOM_BRANCHES = ["寅", "丑", "子", "亥"] as const;
const PERIODS_PER_ROW = 4;

function detailPlacement(branch: XingxiangPalace["branch"]) {
  if ((TOP_BRANCHES as readonly string[]).includes(branch)) return { slot: "upper", direction: "down" } as const;
  if ((UPPER_MIDDLE_BRANCHES as readonly string[]).includes(branch)) return { slot: "upper", direction: "up" } as const;
  if ((LOWER_MIDDLE_BRANCHES as readonly string[]).includes(branch)) return { slot: "lower", direction: "down" } as const;
  return { slot: "bottom", direction: "down" } as const;
}

function PalaceCenter({ profile, period, annual }: { profile: Profile; period: Period; annual: Annual }) {
  return <div className="xingxiang-palace-center" role="group" aria-label="命盘摘要">
    <small>命盘中宫</small>
    <strong>{profile.name} · {profile.yinYangGender}</strong>
    <span>{profile.fiveElementsBureau}</span>
    <span>{period.ganZhi}大限</span>
    <span>{annual.year} · {annual.ganZhi}流年</span>
  </div>;
}

function PalaceButton({ palace, names, selected, detailId, onSelect }: { palace: XingxiangPalace; names: Map<string, string>; selected: boolean; detailId: string; onSelect: () => void }) {
  return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} aria-expanded={selected} aria-controls={detailId} onClick={onSelect}>
      <div className="xingxiang-palace-head"><span>{palace.heavenlyStem}{palace.branch}</span><strong>{names.get(palace.branch) ?? palace.name}</strong></div>
      <div className="xingxiang-palace-flags">{palace.bodyPalace && <i>身</i>}{palace.zodiacPalace && <i>肖</i>}{palace.originPalace && <i>来因</i>}</div>
      <div className="xingxiang-stars">{palace.stars.map((star) => <span key={star.name} className={`star-${star.category}`}><b>{star.name}</b>{star.brightness && <small>{star.brightness}</small>}{star.natalTransformation && <em>{star.natalTransformation}</em>}</span>)}</div>
      {palace.selfTransformations.length > 0 && <div className="xingxiang-self">{palace.selfTransformations.map((item) => <span key={`${item.star}-${item.transformation}`}>{item.star}化{item.transformation}{item.inward ? "↙" : "↗"}</span>)}</div>}
    </button>;
}

function PalaceDetail({ id, palace, names, direction, autoReveal }: { id: string; palace: XingxiangPalace; names: Map<string, string>; direction: "up" | "down"; autoReveal: boolean }) {
  const detailRef = useRef<HTMLDivElement>(null);
  const palaceName = names.get(palace.branch) ?? palace.name;
  const displayPalaceName = palaceName.endsWith("宫") ? palaceName : `${palaceName}宫`;
  const groupedStars = STAR_GROUPS.map((group) => ({
    ...group,
    stars: palace.stars.filter((star) => star.category === group.category),
  })).filter((group) => group.stars.length > 0);

  useEffect(() => {
    if (!autoReveal || !detailRef.current || typeof detailRef.current.scrollIntoView !== "function") return;
    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      detailRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [autoReveal, palace.branch]);

  return <div className={`xingxiang-palace-detail slide-${direction}`} id={id} ref={detailRef} aria-live="polite">
    <div className="xingxiang-detail-heading">
      <span>{palace.heavenlyStem}{palace.branch}</span>
      <h3>{displayPalaceName}</h3>
      <div className="xingxiang-detail-flags">{palace.bodyPalace && <i>身宫</i>}{palace.zodiacPalace && <i>生肖宫</i>}{palace.originPalace && <i>来因宫</i>}</div>
    </div>
    {groupedStars.length > 0
      ? <div className="xingxiang-detail-star-groups">{groupedStars.map((group) => <div className="xingxiang-detail-star-group" key={group.category}>
          <strong>{group.label}</strong>
          <div>{group.stars.map((star) => <span className={`star-${star.category}`} key={star.name}>
            <b>{star.name}</b>
            {star.brightness && <small>{star.brightness}</small>}
            {star.natalTransformation && <em>{star.natalTransformation}</em>}
          </span>)}</div>
        </div>)}</div>
      : <p className="xingxiang-detail-empty">本宫无主辅星曜</p>}
    {palace.selfTransformations.length > 0 && <div className="xingxiang-detail-transform"><strong>宫干自化</strong><div>{palace.selfTransformations.map((item) => <span key={`${item.star}-${item.transformation}`}><b>{item.star}</b><em>化{item.transformation}</em><small>{item.inward ? "入" : "出"}</small></span>)}</div></div>}
  </div>;
}

function PalaceGrid({ palaces, names, selectedBranch, detailId, profile, period, annual, autoReveal, onSelect }: { palaces: XingxiangPalace[]; names: Map<string, string>; selectedBranch: string | null; detailId: string; profile: Profile; period: Period; annual: Annual; autoReveal: boolean; onSelect: (branch: string) => void }) {
  const palaceByBranch = useMemo(() => new Map(palaces.map((palace) => [palace.branch, palace])), [palaces]);
  const selected = selectedBranch ? palaceByBranch.get(selectedBranch as XingxiangPalace["branch"]) ?? null : null;
  const placement = selected ? detailPlacement(selected.branch) : null;
  const renderPalace = (branch: XingxiangPalace["branch"]) => {
    const palace = palaceByBranch.get(branch);
    return palace ? <PalaceButton key={branch} palace={palace} names={names} selected={selectedBranch === branch} detailId={detailId} onSelect={() => onSelect(branch)} /> : null;
  };
  const renderDetail = (slot: "upper" | "lower" | "bottom") => selected && placement?.slot === slot
    ? <div className={`xingxiang-detail-slot ${slot}`}><PalaceDetail id={detailId} palace={selected} names={names} direction={placement.direction} autoReveal={autoReveal} /></div>
    : null;

  return <div className="xingxiang-palace-grid" aria-label="十二宫星盘">
    <div className="xingxiang-palace-row top" data-layout-band="top">{TOP_BRANCHES.map(renderPalace)}</div>
    {renderDetail("upper")}
    <div className="xingxiang-palace-middle" data-layout-band="middle">
      <div className="xingxiang-palace-side upper">{UPPER_MIDDLE_BRANCHES.map(renderPalace)}</div>
      <PalaceCenter profile={profile} period={period} annual={annual} />
      <div className="xingxiang-palace-side lower">{LOWER_MIDDLE_BRANCHES.map(renderPalace)}</div>
    </div>
    {renderDetail("lower")}
    <div className="xingxiang-palace-row bottom" data-layout-band="bottom">{BOTTOM_BRANCHES.map(renderPalace)}</div>
    {renderDetail("bottom")}
  </div>;
}

function Transformations({ title, items }: { title: string; items: Period["transformations"] }) {
  return <div className="xingxiang-transformations"><strong>{title}</strong>{items.map((item) => <span key={item.transformation}><b>{item.transformation}</b>{item.star}</span>)}</div>;
}

function PeriodDetail({ id, period, annual, annualIndex, onAnnualSelect }: { id: string; period: Period; annual: Annual; annualIndex: number; onAnnualSelect: (index: number) => void }) {
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detailRef.current || typeof detailRef.current.scrollIntoView !== "function") return;
    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      detailRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [period.ganZhi, period.startAge]);

  return <div className="xingxiang-period-detail" id={id} ref={detailRef} role="region" aria-label={`${period.ganZhi}大限流年`} aria-live="polite">
    <div className="xingxiang-period-context"><strong>{period.ganZhi}大限</strong><span>{period.startYear}–{period.endYear}年 · {period.startAge}–{period.endAge}岁</span></div>
    <div className="xingxiang-annuals" aria-label="选择流年">{period.annuals.map((item, index) => <button key={item.year} type="button" className={annualIndex === index ? "active" : ""} aria-pressed={annualIndex === index} onClick={() => onAnnualSelect(index)}>{item.year}<small>{item.ganZhi} · {item.age}岁</small></button>)}</div>
    <div className="xingxiang-transform-row"><Transformations title={`${period.ganZhi}大限四化`} items={period.transformations} /><Transformations title={`${annual.ganZhi}流年四化`} items={annual.transformations} /></div>
  </div>;
}

export function XingxiangResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useXingxiangSession();
  const [periodIndex, setPeriodIndex] = useState(0);
  const [annualIndex, setAnnualIndex] = useState(0);
  const [expandedPeriodIndex, setExpandedPeriodIndex] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const period = chart?.periods[periodIndex];
  const annual = period?.annuals[annualIndex];
  const activeNames = annual?.palaceNames ?? period?.palaceNames ?? [];
  const names = useMemo(() => new Map(activeNames.map((item) => [item.branch, item.name])), [activeNames]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  if (isRestoring) return <PaipanPageShell pageClassName="result-page xingxiang-result-page"><PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复星像盘" /></PaipanPageShell>;
  if (!chart || !chartRequest || !period || !annual) return <PaipanPageShell pageClassName="result-page xingxiang-result-page"><PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次星像盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<button type="button" onClick={() => navigate("/paipan/xingxiang")}>重新排盘</button>} /></PaipanPageShell>;

  const { profile } = chart;
  const periodRows = Array.from({ length: Math.ceil(chart.periods.length / PERIODS_PER_ROW) }, (_, rowIndex) => chart.periods.slice(rowIndex * PERIODS_PER_ROW, (rowIndex + 1) * PERIODS_PER_ROW));
  return <PaipanPageShell pageClassName="result-page xingxiang-result-page">
    <PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" />
    <PaipanSectionCard className="xingxiang-profile" labelledBy="xingxiang-profile-heading">
      <div className="xingxiang-profile-hero"><span>紫</span><div><small>飞星派 · {profile.solarDateTime}</small><h2 id="xingxiang-profile-heading">{profile.name} · {profile.yinYangGender}</h2><p>{profile.lunarDate} · {profile.fiveElementsBureau}</p></div></div>
      <InfoGrid><InfoPair label="公历" value={profile.solarDateTime} /><InfoPair label="农历" value={profile.lunarDate} /></InfoGrid>
      <div className="dunjia-pillar-strip" aria-label="四柱"><div><small>年柱</small><strong>{profile.pillars.year}</strong></div><div><small>月柱</small><strong>{profile.pillars.month}</strong></div><div><small>日柱</small><strong>{profile.pillars.day}</strong></div><div><small>时柱</small><strong>{profile.pillars.hour}</strong></div></div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingxiang-time-card" labelledBy="xingxiang-time-heading">
      <h2 className="result-section-title" id="xingxiang-time-heading"><span>01</span>大限与流年</h2>
      <div className="xingxiang-period-board" aria-label="选择大限">{periodRows.map((row, rowIndex) => {
        const rowStartIndex = rowIndex * PERIODS_PER_ROW;
        const rowEndIndex = rowStartIndex + row.length;
        const rowContainsSelected = periodIndex >= rowStartIndex && periodIndex < rowEndIndex;
        const detailOpen = rowContainsSelected && expandedPeriodIndex === periodIndex;
        const detailId = `xingxiang-period-detail-${rowIndex}`;
        return <div className="xingxiang-period-band" data-period-row={rowIndex} key={row[0]?.startAge ?? rowIndex}>
          <div className="xingxiang-periods">{row.map((item, offset) => {
            const index = rowStartIndex + offset;
            const selected = periodIndex === index;
            return <button key={item.ganZhi + item.startAge} type="button" className={selected ? "active" : ""} aria-pressed={selected} aria-expanded={selected && detailOpen} aria-controls={detailId} onClick={() => {
              if (selected) {
                setExpandedPeriodIndex((current) => current === index ? null : index);
                return;
              }
              setPeriodIndex(index);
              setAnnualIndex(0);
              setExpandedPeriodIndex(index);
            }}>{item.ganZhi}<small>{item.startAge}–{item.endAge}岁</small></button>;
          })}</div>
          {detailOpen && <PeriodDetail id={detailId} period={period} annual={annual} annualIndex={annualIndex} onAnnualSelect={setAnnualIndex} />}
        </div>;
      })}</div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingxiang-chart-card" labelledBy="xingxiang-chart-heading">
      <div className="xingxiang-chart-title"><h2 className="result-section-title" id="xingxiang-chart-heading"><span>02</span>十二宫星盘</h2><button type="button" onClick={() => setExpanded(true)}><ArrowsOut size={18} />放大查看</button></div>
      <p className="xingxiang-chart-note">当前叠加：{period.ganZhi}大限 · {annual.year}年{annual.ganZhi}流年。按传统地支方位排布，点击宫位在盘面下方查看详情。</p>
      <PalaceGrid palaces={chart.palaces} names={names} selectedBranch={selectedBranch} detailId="xingxiang-palace-detail" profile={profile} period={period} annual={annual} autoReveal={!expanded} onSelect={(branch) => setSelectedBranch((current) => current === branch ? null : branch)} />
    </PaipanSectionCard>

    <button className="xingxiang-edit" type="button" onClick={() => navigate("/paipan/xingxiang")}><ArrowClockwise size={19} aria-hidden="true" />重新排盘</button>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    {expanded && <div className="xingxiang-dialog" role="dialog" aria-modal="true" aria-labelledby="xingxiang-dialog-title"><div className="xingxiang-dialog-panel"><div className="xingxiang-dialog-heading"><div><small>传统十二宫方盘</small><h2 id="xingxiang-dialog-title">{profile.name} · {period.ganZhi}大限 · {annual.ganZhi}流年</h2></div><button className="xingxiang-dialog-close" type="button" aria-label="关闭放大查看" onClick={() => setExpanded(false)}><X size={22} /></button></div><div className="xingxiang-dialog-scroll"><p>点击宫位，在相邻横带查看完整星曜与四化。</p><PalaceGrid palaces={chart.palaces} names={names} selectedBranch={selectedBranch} detailId="xingxiang-dialog-palace-detail" profile={profile} period={period} annual={annual} autoReveal onSelect={(branch) => setSelectedBranch((current) => current === branch ? null : branch)} /></div></div></div>}
  </PaipanPageShell>;
}
