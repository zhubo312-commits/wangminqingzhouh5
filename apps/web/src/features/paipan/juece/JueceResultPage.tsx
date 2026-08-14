import type { JueceChartRequest, JuecePalace } from "@guoxue/contracts";
import {
  CalendarDots,
  CaretDown,
  CompassRose,
  Horse,
  SealCheck,
  Signpost,
  X,
} from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanEmptyState } from "../../../components/paipan/PaipanEmptyState";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createJueceChart } from "../../../lib/api-client";
import { shiftClockDateTime } from "./date-time";
import { useJueceSession } from "./JueceSession";

const PALACE_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6] as const;

function PillarStrip({ pillars, voids }: {
  pillars: { year: string; month: string; day: string; hour: string };
  voids: { year: string; month: string; day: string; hour: string };
}) {
  const items = [
    ["年柱", pillars.year, voids.year],
    ["月柱", pillars.month, voids.month],
    ["日柱", pillars.day, voids.day],
    ["时柱", pillars.hour, voids.hour],
  ] as const;
  return (
    <div className="dunjia-pillar-strip" aria-label="四柱与空亡">
      {items.map(([label, pillar, empty]) => (
        <div key={label}><small>{label}</small><strong>{pillar}</strong><span>空 {empty}</span></div>
      ))}
    </div>
  );
}

function PalaceMarkers({ palace }: { palace: JuecePalace }) {
  if (!palace.isVoid && !palace.isHorse && !palace.isChief && !palace.isChiefDoor && palace.harms.length === 0) return null;
  return (
    <span className="juece-palace-markers">
      {palace.isVoid && <i className="void">空</i>}
      {palace.isHorse && <i className="horse">马</i>}
      {palace.isChief && <i className="chief">符</i>}
      {palace.isChiefDoor && <i className="chief-door">使</i>}
      {palace.harms.map((harm, index) => (
        <i className={`harm harm-${harm.type}`} key={`${harm.symbol}-${harm.type}-${index}`}>{harm.symbol}{harm.type}</i>
      ))}
    </span>
  );
}

function PalaceCell({ palace, selected, onSelect }: {
  palace: JuecePalace;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`juece-palace${selected ? " selected" : ""}${palace.index === 5 ? " center" : ""}`}
      aria-expanded={selected}
      aria-controls={selected ? "juece-palace-detail" : undefined}
      onClick={onSelect}
    >
      <span className="juece-palace-head"><small>{palace.direction}</small><strong>{palace.trigram}{palace.index}</strong></span>
      <span className="juece-layer heaven"><small>天</small><b>{palace.heavenPlate.deity ?? "—"}</b><b>{palace.heavenPlate.star ?? "—"}</b></span>
      <span className="juece-door">{palace.heavenPlate.door ?? "—"}</span>
      <span className="juece-stems"><span>{palace.heavenPlate.stem ?? "—"}</span><i>／</i><span>{palace.earthPlate.stem ?? "—"}</span></span>
      {palace.attached && <span className="juece-attached">寄 {palace.attached.earthStem}{palace.attached.earthStar}</span>}
      {palace.hiddenGanZhi && <span className="juece-hidden">暗 {palace.hiddenGanZhi}</span>}
      <PalaceMarkers palace={palace} />
    </button>
  );
}

function PalaceDetail({ palace, hiddenLabel }: { palace: JuecePalace; hiddenLabel: string }) {
  return (
    <div className="juece-palace-detail" id="juece-palace-detail" aria-live="polite">
      <div className="dunjia-detail-heading"><span>{palace.trigram}{palace.index}宫</span><strong>{palace.direction} · {palace.element}</strong></div>
      <p className="dunjia-detail-note">当前宫位的神、星、门与天地盘结构；再次点击可收起</p>
      <div className="juece-detail-layers">
        <section aria-label="天盘结构">
          <h4>天盘</h4>
          <InfoGrid>
            <InfoPair label="八神" value={palace.heavenPlate.deity} />
            <InfoPair label="九星" value={palace.heavenPlate.star} />
            <InfoPair label="八门" value={palace.heavenPlate.door} />
            <InfoPair label="天干" value={palace.heavenPlate.stem} />
          </InfoGrid>
        </section>
        <section aria-label="地盘结构">
          <h4>地盘</h4>
          <InfoGrid>
            <InfoPair label="八神" value={palace.earthPlate.deity} />
            <InfoPair label="九星" value={palace.earthPlate.star} />
            <InfoPair label="八门" value={palace.earthPlate.door} />
            <InfoPair label="地干" value={palace.earthPlate.stem} />
          </InfoGrid>
        </section>
      </div>
      <InfoGrid className="juece-extra-grid">
        <InfoPair label={hiddenLabel} value={palace.hiddenGanZhi} />
        <InfoPair label="旬空" value={palace.isVoid ? "是" : "否"} />
        <InfoPair label="马星" value={palace.isHorse ? "是" : "否"} />
        <InfoPair label="值符／值使" value={[palace.isChief ? "值符" : "", palace.isChiefDoor ? "值使" : ""].filter(Boolean).join("、") || "无"} />
      </InfoGrid>
      {palace.harms.length > 0 && (
        <div className="dunjia-detail-harms">
          <h4>四害</h4>
          <div>{palace.harms.map((harm, index) => <span key={`${harm.symbol}-${harm.type}-${index}`}>{harm.symbol} · {harm.type}</span>)}</div>
        </div>
      )}
      {(palace.heavenGrowth.length > 0 || palace.earthGrowth.length > 0) && (
        <div className="dunjia-growth-grid">
          <GrowthList title="天盘长生" values={palace.heavenGrowth} />
          <GrowthList title="地盘长生" values={palace.earthGrowth} />
        </div>
      )}
      {palace.attached && (
        <div className="juece-attached-detail">
          <h4>中宫寄宫</h4>
          <p>
            地盘 {palace.attached.earthStem} · {palace.attached.earthStar}
            {(palace.attached.heavenStem || palace.attached.heavenStar) && <>；天盘 {palace.attached.heavenStem ?? "—"} · {palace.attached.heavenStar ?? "—"}</>}
          </p>
        </div>
      )}
    </div>
  );
}

function GrowthList({ title, values }: {
  title: string;
  values: JuecePalace["heavenGrowth"];
}) {
  return (
    <div className="dunjia-growth-group">
      <h4>{title}</h4>
      <div>{values.map((item, index) => (
        <span key={`${item.branch}-${item.stage}-${index}`}>{item.branch} · {item.stage}</span>
      ))}</div>
    </div>
  );
}

export function JueceResultPage() {
  const navigate = useNavigate();
  const { chart, chartRequest, isRestoring, setResult } = useJueceSession();
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [retryDelta, setRetryDelta] = useState<-2 | 2 | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const orderedPalaces = useMemo(() => PALACE_ORDER.map(
    (index) => chart?.palaces.find((palace) => palace.index === index),
  ).filter((palace): palace is JuecePalace => Boolean(palace)), [chart]);
  const palaceRows = useMemo(() => Array.from(
    { length: 3 },
    (_, rowIndex) => orderedPalaces.slice(rowIndex * 3, rowIndex * 3 + 3),
  ), [orderedPalaces]);

  async function switchHour(delta: -2 | 2) {
    if (!chartRequest || switching) return;
    setSwitching(true);
    setSwitchError(null);
    setRetryDelta(delta);
    try {
      const request: JueceChartRequest = {
        ...chartRequest,
        chartDateTime: shiftClockDateTime(chartRequest.chartDateTime, delta),
      };
      const response = await createJueceChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...nextChart } = response;
      setResult(nextChart, request, reference);
      setSelectedPalaceIndex(null);
      setRetryDelta(null);
    } catch (reason) {
      setSwitchError(reason instanceof Error ? reason.message : "换盘失败，当前盘已保留");
    } finally {
      setSwitching(false);
    }
  }

  if (isRestoring) {
    return (
      <PaipanPageShell pageClassName="result-page juece-result-page">
        <PageHeader title="时家决策盘" backTo="/paipan/juece" backLabel="返回时家决策学表单" />
        <PaipanEmptyState icon={<CalendarDots size={46} weight="light" aria-hidden="true" />} title="正在恢复时家决策盘" />
      </PaipanPageShell>
    );
  }

  if (!chart || !chartRequest) {
    return (
      <PaipanPageShell pageClassName="result-page juece-result-page">
        <PageHeader title="时家决策盘" backTo="/paipan/juece" backLabel="返回时家决策学表单" />
        <PaipanEmptyState
          icon={<CalendarDots size={46} weight="light" aria-hidden="true" />}
          title="本次时家决策盘已失效"
          description="排盘引用不存在或已过期，请按原条件重新起盘。"
          action={<PaipanActionButton variant="restart" onClick={() => navigate("/paipan/juece")}>重新排盘</PaipanActionButton>}
        />
      </PaipanPageShell>
    );
  }

  const { overview } = chart;
  const heavenGates = chart.heavenEarthGates.filter((item) =>
    ["太冲", "小吉", "从魁"].some((name) => item.heavenGate.startsWith(name)),
  );
  const earthGates = chart.heavenEarthGates.filter((item) =>
    ["除", "危", "定", "开"].includes(item.earthGate),
  );
  return (
    <PaipanPageShell pageClassName="result-page juece-result-page">
      <PageHeader title="时家决策盘" backTo="/paipan/juece" backLabel="返回时家决策学表单" />

      <PaipanSectionCard className="juece-overview-card" labelledBy="juece-overview-heading">
        <div className="juece-result-hero">
          <span><CompassRose size={29} weight="duotone" aria-hidden="true" /></span>
          <div><small>{overview.panStyleLabel} · {overview.bureauLabel}</small><h2 id="juece-overview-heading">{overview.dunType}遁{overview.juNumber}局</h2></div>
        </div>
        <InfoGrid className="juece-date-grid">
          <InfoPair label="原始钟表时间" value={overview.clockDateTime} />
          <InfoPair label="起局使用时间" value={overview.effectiveDateTime} />
          <InfoPair label="阴历" value={overview.lunarDate} />
          <InfoPair label="计时方式" value={overview.timeMode === "true_solar" ? `真太阳时 · ${overview.areaName}` : "标准时间"} />
        </InfoGrid>
        <PillarStrip pillars={overview.pillars} voids={overview.voidBranches} />
        <div className="juece-verification-block">
          <div><SealCheck size={20} weight="duotone" aria-hidden="true" /><span><strong>起局与核验</strong><small>{overview.method}</small></span></div>
          <InfoGrid className="juece-verification-grid juece-verification-primary">
            <InfoPair label="旬首" value={overview.xunShou} />
            <InfoPair label="本盘旬空" value={overview.selectedVoidBranches} />
            <InfoPair label="值符" value={`${overview.chiefStar.name} · ${overview.chiefStar.palace}宫`} />
            <InfoPair label="值使" value={`${overview.chiefDoor.name} · ${overview.chiefDoor.palace}宫`} />
            <InfoPair label="马星" value={`${overview.horse.branch} · ${overview.horse.palace}宫`} />
          </InfoGrid>
          <button className="juece-more-toggle" type="button" aria-expanded={showMore} onClick={() => setShowMore((current) => !current)}>
            {showMore ? "收起" : "更多"}<CaretDown size={16} weight="bold" aria-hidden="true" />
          </button>
          {showMore && (
            <InfoGrid className="juece-verification-grid juece-term-more-grid">
              <InfoPair label="上一节气" value={<>{overview.previousSolarTerm.name}<small>{overview.previousSolarTerm.dateTime}</small></>} />
              <InfoPair label="下一节气" value={<>{overview.nextSolarTerm.name}<small>{overview.nextSolarTerm.dateTime}</small></>} />
            </InfoGrid>
          )}
        </div>
        <div className="juece-hour-switch" aria-label="时辰切换">
          <PaipanActionButton variant="navigate" direction="previous" busy={switching} onClick={() => void switchHour(-2)}><span>上一时辰</span></PaipanActionButton>
          <span aria-live="polite">{switching ? "正在重新起盘…" : chartRequest.chartDateTime}</span>
          <PaipanActionButton variant="navigate" direction="next" busy={switching} onClick={() => void switchHour(2)}><span>下一时辰</span></PaipanActionButton>
        </div>
        {switchError && (
          <div className="inline-error juece-switch-error" role="alert">
            <span>{switchError}，当前盘未改变。</span>
            {retryDelta && <PaipanActionButton variant="retry" busy={switching} onClick={() => void switchHour(retryDelta)}>重试</PaipanActionButton>}
          </div>
        )}
      </PaipanSectionCard>

      <PaipanSectionCard className="juece-chart-card" labelledBy="juece-chart-heading">
        <h2 className="result-section-title" id="juece-chart-heading"><span>01</span>九宫主盘</h2>
        <p className="dunjia-chart-hint">点击宫位，在当前行下方查看结构详情</p>
        <div className="juece-nine-grid" role="group" aria-label="时家决策九宫盘">
          {palaceRows.map((row, rowIndex) => {
            const selected = row.find((palace) => palace.index === selectedPalaceIndex);
            return (
              <Fragment key={`juece-row-${rowIndex}`}>
                {row.map((palace) => (
                  <PalaceCell
                    key={palace.index}
                    palace={palace}
                    selected={palace.index === selectedPalaceIndex}
                    onSelect={() => setSelectedPalaceIndex((current) => current === palace.index ? null : palace.index)}
                  />
                ))}
                {selected && <PalaceDetail palace={selected} hiddenLabel={overview.panStyle === "rotating" ? "隐干" : "暗干支"} />}
              </Fragment>
            );
          })}
        </div>
        <div className="juece-chart-actions">
          <PaipanActionButton variant="zoom" onClick={() => setZoomed(true)}>放大查看</PaipanActionButton>
          <PaipanActionButton variant="restart" onClick={() => navigate("/paipan/juece")}>重新排盘</PaipanActionButton>
        </div>
      </PaipanSectionCard>

      {chart.heavenEarthGates.length > 0 && (
        <details className="result-card dunjia-details-card dunjia-gates-card juece-gates-card">
          <summary><span><Signpost size={21} weight="duotone" aria-hidden="true" />天门地户 · 出行辅助</span><CaretDown size={19} weight="bold" aria-hidden="true" /></summary>
          <div className="dunjia-gates-content">
            <p>用于传统出行与择向的结构参考，不属于九宫主盘的必读信息。</p>
            <div className="dunjia-gate-groups">
              <section aria-labelledby="juece-heaven-gates-heading">
                <h3 id="juece-heaven-gates-heading">天三门</h3>
                <small>太冲、小吉、从魁所临地支</small>
                <div>{heavenGates.map((item) => (
                  <span className="dunjia-gate-item" key={`heaven-${item.branch}`}><strong>{item.heavenGate}</strong><em>临 {item.branch}</em></span>
                ))}</div>
              </section>
              <section aria-labelledby="juece-earth-gates-heading">
                <h3 id="juece-earth-gates-heading">地四户</h3>
                <small>除、危、定、开所临地支</small>
                <div>{earthGates.map((item) => (
                  <span className="dunjia-gate-item" key={`earth-${item.branch}`}><strong>{item.earthGate}</strong><em>临 {item.branch}</em></span>
                ))}</div>
              </section>
            </div>
          </div>
        </details>
      )}

      <PaipanSectionCard className="juece-legend" label="盘面标记说明">
        <h2 className="result-section-title"><span>注</span>标记说明</h2>
        <div>
          <span><i className="void">空</i>所选旬空</span>
          <span><i className="chief">符</i>值符所临</span>
          <span><i className="chief-door">使</i>值使所临</span>
          <span><i className="harm harm-墓">墓</i>入墓</span>
          <span><i className="harm harm-刑">刑</i>击刑</span>
          <span><i className="harm harm-迫">迫</i>门迫</span>
          <span><Horse size={16} weight="duotone" aria-hidden="true" />马星所临</span>
        </div>
        <p>转盘显示中宫寄宫与隐干；飞盘显示暗干支与天地八神。盘面不提供个案吉凶判断。</p>
      </PaipanSectionCard>

      <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>

      {zoomed && (
        <div className="juece-zoom-overlay" role="dialog" aria-modal="true" aria-labelledby="juece-zoom-heading" onKeyDown={(event) => { if (event.key === "Escape") setZoomed(false); }}>
          <div className="juece-zoom-panel">
            <div className="juece-zoom-heading"><div><small>{overview.method}</small><h2 id="juece-zoom-heading">九宫主盘放大图</h2></div><button type="button" aria-label="关闭放大查看" onClick={() => setZoomed(false)}><X size={23} weight="bold" aria-hidden="true" /></button></div>
            <p>横向滑动查看完整盘面；点击宫位可返回查看该宫详情。</p>
            <div className="juece-zoom-scroll">
              <div className="juece-nine-grid juece-nine-grid-zoomed" role="group" aria-label="放大的时家决策九宫盘">
                {orderedPalaces.map((palace) => (
                  <PalaceCell key={`zoom-${palace.index}`} palace={palace} selected={false} onSelect={() => { setSelectedPalaceIndex(palace.index); setZoomed(false); }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PaipanPageShell>
  );
}
