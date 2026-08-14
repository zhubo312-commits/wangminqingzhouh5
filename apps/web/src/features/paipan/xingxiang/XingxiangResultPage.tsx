import type { XingxiangChartResponse, XingxiangPalace } from "@guoxue/contracts";
import { CalendarDots, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { useXingxiangSession } from "./XingxiangSession";

type Period = XingxiangChartResponse["periods"][number];
type Annual = Period["annuals"][number];
type Profile = XingxiangChartResponse["profile"];
type PalaceStar = XingxiangPalace["stars"][number];
type Branch = XingxiangPalace["branch"];

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
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const DIRECTIONS: Record<Branch, string> = {
  子: "正北方", 丑: "北偏东", 寅: "东偏北", 卯: "正东方", 辰: "东偏南", 巳: "南偏东",
  午: "正南方", 未: "南偏西", 申: "西偏南", 酉: "正西方", 戌: "西偏北", 亥: "北偏西",
};
const TRANSFORMATION_COLORS: Record<string, string> = { 禄: "green", 权: "purple", 科: "blue", 忌: "red" };
const OPPOSITE_PATHS = [
  "M75 100 L25 0", "M25 100 L75 0", "M0 100 L100 0",
  "M0 75 L100 25", "M0 25 L100 75", "M0 0 L100 100",
];
const TRINE_PATHS = [
  "M100 0 L75 100 L0 25 Z", "M0 0 L100 25 L25 100 Z",
  "M0 100 L25 0 L100 75 Z", "M100 100 L0 75 L75 0 Z",
];

function palaceName(names: Map<string, string>, branch: string) {
  return names.get(branch) ?? "";
}

function fourDirections(branch: Branch) {
  const index = BRANCHES.indexOf(branch);
  return [branch, BRANCHES[(index + 6) % 12]!, BRANCHES[(index + 4) % 12]!, BRANCHES[(index + 8) % 12]!] as const;
}

function detailPlacement(branch: XingxiangPalace["branch"]) {
  if ((TOP_BRANCHES as readonly string[]).includes(branch)) return { slot: "upper", direction: "down" } as const;
  if ((UPPER_MIDDLE_BRANCHES as readonly string[]).includes(branch)) return { slot: "upper", direction: "up" } as const;
  if ((LOWER_MIDDLE_BRANCHES as readonly string[]).includes(branch)) return { slot: "lower", direction: "down" } as const;
  return { slot: "bottom", direction: "down" } as const;
}

function FourDirectionsOverlay({ focusBranch }: { focusBranch: Branch }) {
  const branchIndex = BRANCHES.indexOf(focusBranch);
  const related = fourDirections(focusBranch);
  const label = `${focusBranch}宫三方四正：本宫${related[0]}、对宫${related[1]}、三合宫${related[2]}与${related[3]}`;
  return <svg className="xingxiang-four-directions" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}>
    <title>{label}</title>
    <path d={OPPOSITE_PATHS[branchIndex % 6]} />
    <path d={TRINE_PATHS[branchIndex % 4]} />
  </svg>;
}

function PalaceCenter({ profile, period, annual, focusBranch, compact }: { profile: Profile; period: Period; annual: Annual | null; focusBranch: Branch; compact: boolean }) {
  const related = fourDirections(focusBranch);
  return <div className="xingxiang-palace-center" role="group" aria-label="命盘摘要">
    <FourDirectionsOverlay focusBranch={focusBranch} />
    <div className="xingxiang-center-content">
      <small>飞星紫微 · 命盘中宫</small>
      <strong>{profile.name} · {profile.yinYangGender}</strong>
      <span>{profile.fiveElementsBureau}</span>
      {!compact && <>
        <span className="xingxiang-center-date">阳历 {profile.solarDateTime}</span>
        {profile.trueSolarTime && <span className="xingxiang-center-date">真太阳时 {profile.trueSolarTime}</span>}
        <span className="xingxiang-center-date">农历 {profile.lunarDate}</span>
        <div className="xingxiang-center-pillars" aria-label="中宫四柱"><span>四柱</span><b>{profile.pillars.year}</b><b>{profile.pillars.month}</b><b>{profile.pillars.day}</b><b>{profile.pillars.hour}</b></div>
      </>}
      <div className="xingxiang-center-legend" aria-label="禄权科忌图例">{["禄", "权", "科", "忌"].map((item) => <i className={`is-${TRANSFORMATION_COLORS[item]}`} key={item}>{item}</i>)}</div>
      <span>{period.ganZhi}大限 · {annual ? `${annual.year}年${annual.ganZhi}流年` : "未选择流年"}</span>
      <span className="xingxiang-focus-copy">三方四正：{related.join(" · ")}</span>
    </div>
  </div>;
}

function PalaceButton({ palace, periodNames, annualNames, periodMarker, month, periodTransformations, annual, selected, flyingByStar, compact, detailId, onSelect }: { palace: XingxiangPalace; periodNames: Map<string, string>; annualNames: Map<string, string>; periodMarker: Annual | undefined; month: Annual["months"][number] | undefined; periodTransformations: Map<string, Period["transformations"][number]>; annual: Annual | null; selected: boolean; flyingByStar: Map<string, string>; compact: boolean; detailId: string; onSelect: () => void }) {
  const periodPalaceName = palaceName(periodNames, palace.branch);
  const annualPalaceName = palaceName(annualNames, palace.branch);
  const classNames = [
    selected ? "selected" : "",
    flyingByStar.size > 0 ? "has-flying-layer" : "",
    periodPalaceName === "命宫" ? "is-period-life" : "",
    annualPalaceName === "命宫" ? "is-annual-life" : "",
  ].filter(Boolean).join(" ");
  return <button type="button" className={classNames} aria-label={`${palace.heavenlyStem}${palace.branch} ${palace.name}宫`} aria-pressed={selected} aria-expanded={selected} aria-controls={detailId} onClick={onSelect}>
      <div className="xingxiang-palace-head"><span>{palace.heavenlyStem}{palace.branch}</span><strong>{palace.name}</strong></div>
      <div className="xingxiang-palace-flags">{palace.bodyPalace && <i>身</i>}{palace.zodiacPalace && <i>肖</i>}{palace.originPalace && <i>来因</i>}</div>
      <div className="xingxiang-palace-scopes">
        {!compact && <span>{periodMarker ? `${periodMarker.age}岁 · ${periodMarker.year}` : ""}</span>}
        <span className="is-period-change">{periodPalaceName && `大${periodPalaceName}`}</span>
        {annual && <span className="is-annual-change">{annualPalaceName && `年${annualPalaceName}`}</span>}
        {!compact && month && <span title={`${month.monthName} · ${month.ganZhi}`}>{month.monthName} · {month.ganZhi}</span>}
      </div>
      <div className="xingxiang-stars">{palace.stars.map((star) => {
        const flyingTransformation = flyingByStar.get(star.name);
        const transformationKey = `${star.name}-${palace.branch}`;
        const periodTransformation = periodTransformations.get(transformationKey)?.transformation;
        const annualTransformation = annual?.transformations.find((item) => item.star === star.name && item.targetBranch === palace.branch)?.transformation;
        const starClassNames = [
          `star-${star.category}`,
          flyingTransformation ? `flying-${TRANSFORMATION_COLORS[flyingTransformation]}` : "",
          periodTransformation ? "is-period-change" : "",
          annualTransformation ? "is-annual-change" : "",
        ].filter(Boolean).join(" ");
        return <span key={star.name} className={starClassNames}><b>{star.name}</b>{star.brightness && <small>{star.brightness}</small>}{star.natalTransformation && <em>{star.natalTransformation}</em>}{periodTransformation && <em className="period" aria-label={`大限化${periodTransformation}`}>{periodTransformation}</em>}{annualTransformation && <em className="annual" aria-label={`流年化${annualTransformation}`}>{annualTransformation}</em>}</span>;
      })}</div>
      {palace.selfTransformations.length > 0 && <div className="xingxiang-self">{palace.selfTransformations.map((item) => <span className={`is-${TRANSFORMATION_COLORS[item.transformation]}`} key={`${item.star}-${item.transformation}`}>{item.direction === "outward" ? "↗" : "↙"}{item.star}化{item.transformation}</span>)}</div>}
    </button>;
}

function PalaceDetail({ id, palace, periodNames, annualNames, annual, direction, autoReveal }: { id: string; palace: XingxiangPalace; periodNames: Map<string, string>; annualNames: Map<string, string>; annual: Annual | null; direction: "up" | "down"; autoReveal: boolean }) {
  const detailRef = useRef<HTMLDivElement>(null);
  const displayPalaceName = `${palace.name}宫`;
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
    <div className="xingxiang-detail-scopes"><span>大限：{palaceName(periodNames, palace.branch)}</span>{annual && <span>流年：{palaceName(annualNames, palace.branch)}</span>}</div>
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
    {palace.selfTransformations.length > 0 && <div className="xingxiang-detail-transform"><strong>宫干自化</strong><div>{palace.selfTransformations.map((item) => <span key={`${item.star}-${item.transformation}`}><b>{item.star}</b><em>化{item.transformation}</em><small>{item.direction === "outward" ? "自化出" : "自化入"} · 至{item.targetBranch}宫</small></span>)}</div></div>}
    <div className="xingxiang-detail-transform"><strong>宫干飞化</strong><div>{palace.flyingTransformations.map((item) => <span key={item.transformation}><em>化{item.transformation}</em><b>{item.star}</b><small>落{item.targetBranch}宫</small></span>)}</div></div>
  </div>;
}

function PalaceGrid({ palaces, periodNames, annualNames, selectedBranch, focusBranch, boardLabel = "十二宫星盘", compact = false, detailId, profile, period, annual, autoReveal, onSelect }: { palaces: XingxiangPalace[]; periodNames: Map<string, string>; annualNames: Map<string, string>; selectedBranch: Branch | null; focusBranch: Branch; boardLabel?: string; compact?: boolean; detailId: string; profile: Profile; period: Period; annual: Annual | null; autoReveal: boolean; onSelect: (branch: Branch) => void }) {
  const palaceByBranch = useMemo(() => new Map(palaces.map((palace) => [palace.branch, palace])), [palaces]);
  const periodMarkers = useMemo(() => new Map(period.annuals.map((item) => {
    const lifePalace = item.palaceNames.find((name) => name.name === "命宫");
    return [lifePalace?.branch, item] as const;
  })), [period]);
  const months = useMemo(() => new Map(annual?.months.map((item) => [item.palaceBranch, item]) ?? []), [annual]);
  const periodTransformations = useMemo(() => new Map(period.transformations.map((item) => [`${item.star}-${item.targetBranch}`, item])), [period]);
  const selected = selectedBranch ? palaceByBranch.get(selectedBranch) ?? null : null;
  const placement = selected ? detailPlacement(selected.branch) : null;
  const flyingByStar = useMemo(() => new Map(selected?.flyingTransformations.map((item) => [item.star, item.transformation]) ?? []), [selected]);
  const renderPalace = (branch: XingxiangPalace["branch"]) => {
    const palace = palaceByBranch.get(branch);
    return palace ? <PalaceButton key={branch} palace={palace} periodNames={periodNames} annualNames={annualNames} periodMarker={periodMarkers.get(branch)} month={months.get(branch)} periodTransformations={periodTransformations} annual={annual} selected={selectedBranch === branch} flyingByStar={flyingByStar} compact={compact} detailId={detailId} onSelect={() => onSelect(branch)} /> : null;
  };
  const renderDetail = (slot: "upper" | "lower" | "bottom") => selected && placement?.slot === slot
    ? <div className={`xingxiang-detail-slot ${slot}`}><PalaceDetail id={detailId} palace={selected} periodNames={periodNames} annualNames={annualNames} annual={annual} direction={placement.direction} autoReveal={autoReveal} /></div>
    : null;

  return <div className={`xingxiang-board-shell has-temporal-changes${compact ? " is-compact" : ""}`}>
    <div className="xingxiang-direction-row top" aria-label="南方方位">{TOP_BRANCHES.map((branch) => <span key={branch}>{DIRECTIONS[branch]}</span>)}</div>
    <div className="xingxiang-direction-side left" aria-label="东方方位"><span>{DIRECTIONS.辰}</span><span>{DIRECTIONS.卯}</span></div>
    <div className="xingxiang-direction-side right" aria-label="西方方位"><span>{DIRECTIONS.酉}</span><span>{DIRECTIONS.戌}</span></div>
    <div className="xingxiang-palace-grid" aria-label={boardLabel}>
      <div className="xingxiang-palace-row top" data-layout-band="top">{TOP_BRANCHES.map(renderPalace)}</div>
      {renderDetail("upper")}
      <div className="xingxiang-palace-middle" data-layout-band="middle">
        <div className="xingxiang-palace-side upper">{UPPER_MIDDLE_BRANCHES.map(renderPalace)}</div>
        <PalaceCenter profile={profile} period={period} annual={annual} focusBranch={focusBranch} compact={compact} />
        <div className="xingxiang-palace-side lower">{LOWER_MIDDLE_BRANCHES.map(renderPalace)}</div>
      </div>
      {renderDetail("lower")}
      <div className="xingxiang-palace-row bottom" data-layout-band="bottom">{BOTTOM_BRANCHES.map(renderPalace)}</div>
      {renderDetail("bottom")}
    </div>
    <div className="xingxiang-direction-row bottom" aria-label="北方方位">{BOTTOM_BRANCHES.map((branch) => <span key={branch}>{DIRECTIONS[branch]}</span>)}</div>
  </div>;
}

function Transformations({ title, items }: { title: string; items: Period["transformations"] }) {
  return <div className="xingxiang-transformations"><strong>{title}</strong>{items.map((item) => <span key={item.transformation}><b>{item.transformation}</b>{item.star}</span>)}</div>;
}

function PeriodDetail({ id, period, annual, annualIndex, autoReveal, onAnnualSelect }: { id: string; period: Period; annual: Annual | null; annualIndex: number | null; autoReveal: boolean; onAnnualSelect: (index: number) => void }) {
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoReveal || !detailRef.current || typeof detailRef.current.scrollIntoView !== "function") return;
    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      detailRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [autoReveal, period.ganZhi, period.startAge]);

  return <div className="xingxiang-period-detail" id={id} ref={detailRef} role="region" aria-label={`${period.ganZhi}大限流年`} aria-live="polite">
    <div className="xingxiang-period-context"><strong>{period.ganZhi}大限</strong><span>{period.startYear}–{period.endYear}年 · {period.startAge}–{period.endAge}岁</span></div>
    <div className="xingxiang-annuals" aria-label="选择流年">{period.annuals.map((item, index) => <button key={item.year} type="button" className={annualIndex === index ? "active" : ""} aria-pressed={annualIndex === index} onClick={() => onAnnualSelect(index)}>{item.year}<small>{item.ganZhi} · {item.age}岁</small></button>)}</div>
    <div className="xingxiang-transform-row"><Transformations title={`${period.ganZhi}大限四化`} items={period.transformations} />{annual && <Transformations title={`${annual.ganZhi}流年四化`} items={annual.transformations} />}</div>
  </div>;
}

export function XingxiangResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring } = useXingxiangSession();
  const [periodIndex, setPeriodIndex] = useState(0);
  const [annualIndex, setAnnualIndex] = useState<number | null>(null);
  const [expandedPeriodIndex, setExpandedPeriodIndex] = useState<number | null>(0);
  const [periodAutoReveal, setPeriodAutoReveal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const period = chart?.periods[periodIndex];
  const annual = annualIndex === null ? null : period?.annuals[annualIndex] ?? null;
  const periodNames = useMemo(() => new Map(period?.palaceNames.map((item) => [item.branch, item.name]) ?? []), [period]);
  const annualNames = useMemo(() => new Map(annual?.palaceNames.map((item) => [item.branch, item.name]) ?? []), [annual]);
  const temporalFocus = (annual?.palaceNames.find((item) => item.name === "命宫")?.branch
    ?? period?.palaceNames.find((item) => item.name === "命宫")?.branch
    ?? "子") as Branch;
  const focusBranch = selectedBranch ?? temporalFocus;

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => dialogCloseRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [expanded]);

  if (isRestoring) return <PaipanPageShell pageClassName="result-page xingxiang-result-page"><PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="正在恢复星像盘" /></PaipanPageShell>;
  if (!chart || !chartRequest || !period) return <PaipanPageShell pageClassName="result-page xingxiang-result-page"><PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" /><PaipanEmptyState icon={<CalendarDots size={46} />} title="本次星像盘已失效" description="排盘引用不存在或已过期，请重新排盘。" action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/xingxiang")}>重新排盘</PaipanActionButton>} /></PaipanPageShell>;

  const { profile } = chart;
  const periodRows = Array.from({ length: Math.ceil(chart.periods.length / PERIODS_PER_ROW) }, (_, rowIndex) => chart.periods.slice(rowIndex * PERIODS_PER_ROW, (rowIndex + 1) * PERIODS_PER_ROW));
  return <PaipanPageShell pageClassName="result-page xingxiang-result-page">
    <PageHeader title="星像学" backTo="/paipan/xingxiang" backLabel="返回星像起盘" />
    <PaipanSectionCard className="xingxiang-profile" labelledBy="xingxiang-profile-heading">
      <div className="xingxiang-profile-hero"><span>紫</span><div><small>飞星派 · {profile.solarDateTime}</small><h2 id="xingxiang-profile-heading">{profile.name} · {profile.yinYangGender}</h2><p>{profile.lunarDate} · {profile.fiveElementsBureau}</p></div></div>
      <InfoGrid><InfoPair label="公历" value={profile.solarDateTime} /><InfoPair label="出生地区" value={profile.area} />{profile.trueSolarTime && <InfoPair label="真太阳时" value={profile.trueSolarTime} />}<InfoPair label="农历" value={profile.lunarDate} /></InfoGrid>
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
              setPeriodAutoReveal(true);
              if (selected) {
                setExpandedPeriodIndex((current) => current === index ? null : index);
                return;
              }
              setPeriodIndex(index);
              setAnnualIndex(null);
              setExpandedPeriodIndex(index);
              setSelectedBranch(null);
            }}>{item.ganZhi}<small>{item.startAge}–{item.endAge}岁</small></button>;
          })}</div>
          {detailOpen && <PeriodDetail id={detailId} period={period} annual={annual} annualIndex={annualIndex} autoReveal={periodAutoReveal} onAnnualSelect={(index) => { setAnnualIndex(index); setSelectedBranch(null); }} />}
        </div>;
      })}</div>
    </PaipanSectionCard>

    <PaipanSectionCard className="xingxiang-chart-card" labelledBy="xingxiang-chart-heading">
      <div className="xingxiang-chart-title"><h2 className="result-section-title" id="xingxiang-chart-heading"><span>02</span>十二宫星盘</h2><PaipanActionButton variant="zoom" onClick={() => setExpanded(true)}>放大查看</PaipanActionButton></div>
      <div className="xingxiang-change-bar" aria-live="polite">
        <p className="xingxiang-change-summary">当前：<strong>{period.ganZhi}大限</strong><span>{annual ? `${annual.year}年${annual.ganZhi}流年` : "未选择流年"}</span></p>
        <div className="xingxiang-change-legend" aria-label="十二宫变化图例"><span className="period"><i />大限变化</span><span className={`annual${annual ? "" : " is-inactive"}`}><i />流年变化</span></div>
      </div>
      <p className="xingxiang-chart-note">蓝标为大限，朱红标为流年；点击宫位查看完整星曜与飞化。</p>
      <PalaceGrid palaces={chart.palaces} periodNames={periodNames} annualNames={annualNames} selectedBranch={selectedBranch} focusBranch={focusBranch} compact detailId="xingxiang-palace-detail" profile={profile} period={period} annual={annual} autoReveal={!expanded} onSelect={(branch) => setSelectedBranch((current) => current === branch ? null : branch)} />
    </PaipanSectionCard>

    <PaipanActionButton variant="restart" className="xingxiang-edit" onClick={() => navigate("/paipan/xingxiang")}>重新排盘</PaipanActionButton>
    <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    {expanded && <div className="xingxiang-dialog" role="dialog" aria-modal="true" aria-labelledby="xingxiang-dialog-title"><div className="xingxiang-dialog-panel"><div className="xingxiang-dialog-heading"><div><small>传统十二宫方盘</small><h2 id="xingxiang-dialog-title">{profile.name} · {period.ganZhi}大限 · {annual ? `${annual.ganZhi}流年` : "未选择流年"}</h2></div><button ref={dialogCloseRef} className="xingxiang-dialog-close" type="button" aria-label="关闭放大查看" onClick={() => setExpanded(false)}><X size={22} /></button></div><div className="xingxiang-dialog-scroll"><p>点击宫位，在相邻横带查看完整星曜、宫干飞化与自化方向。</p><PalaceGrid palaces={chart.palaces} periodNames={periodNames} annualNames={annualNames} selectedBranch={selectedBranch} focusBranch={focusBranch} detailId="xingxiang-dialog-palace-detail" profile={profile} period={period} annual={annual} autoReveal onSelect={(branch) => setSelectedBranch((current) => current === branch ? null : branch)} /></div></div></div>}
  </PaipanPageShell>;
}
