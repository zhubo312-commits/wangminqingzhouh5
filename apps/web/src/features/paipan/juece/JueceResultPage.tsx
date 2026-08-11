import type { JueceChartRequest, JuecePalace } from "@guoxue/contracts";
import {
  ArrowClockwise,
  CalendarDots,
  CaretLeft,
  CaretRight,
  CompassRose,
  Horse,
  SealCheck,
} from "@phosphor-icons/react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { InfoGrid, InfoPair } from "../../../components/paipan/InfoGrid";
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
  if (!palace.isVoid && !palace.isHorse && !palace.isChief && !palace.isChiefDoor) return null;
  return (
    <span className="juece-palace-markers">
      {palace.isVoid && <i className="void">空</i>}
      {palace.isHorse && <i className="horse">马</i>}
      {palace.isChief && <i className="chief">符</i>}
      {palace.isChiefDoor && <i className="chief-door">使</i>}
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
        <InfoPair label="值符／值使" value={[palace.isChief ? "值符" : "", palace.isChiefDoor ? "值使" : ""].filter(Boolean).join("、")} />
      </InfoGrid>
      {palace.attached && (
        <div className="juece-attached-detail">
          <h4>中宫寄宫</h4>
          <p>地盘 {palace.attached.earthStem} · {palace.attached.earthStar}；天盘 {palace.attached.heavenStem ?? "—"} · {palace.attached.heavenStar ?? "—"}</p>
        </div>
      )}
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
        <PageHeader title="决策盘" backTo="/paipan/juece" backLabel="返回决策学表单" />
        <PaipanEmptyState icon={<CalendarDots size={46} weight="light" aria-hidden="true" />} title="正在恢复决策盘" />
      </PaipanPageShell>
    );
  }

  if (!chart || !chartRequest) {
    return (
      <PaipanPageShell pageClassName="result-page juece-result-page">
        <PageHeader title="决策盘" backTo="/paipan/juece" backLabel="返回决策学表单" />
        <PaipanEmptyState
          icon={<CalendarDots size={46} weight="light" aria-hidden="true" />}
          title="本次决策盘已失效"
          description="排盘引用不存在或已过期，请按原条件重新起盘。"
          action={<button type="button" onClick={() => navigate("/paipan/juece")}>重新排盘</button>}
        />
      </PaipanPageShell>
    );
  }

  const { overview } = chart;
  return (
    <PaipanPageShell pageClassName="result-page juece-result-page">
      <PageHeader title="决策盘" backTo="/paipan/juece" backLabel="返回决策学表单" />

      <PaipanSectionCard className="juece-overview-card" labelledBy="juece-overview-heading">
        <div className="juece-result-hero">
          <span><CompassRose size={29} weight="duotone" aria-hidden="true" /></span>
          <div><small>{overview.panStyleLabel} · {overview.bureauLabel}</small><h2 id="juece-overview-heading">{overview.dunType}遁{overview.juNumber}局</h2></div>
          <em>参考站同源</em>
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
          <InfoGrid className="juece-verification-grid">
            <InfoPair label="上一节气" value={<>{overview.previousSolarTerm.name}<small>{overview.previousSolarTerm.dateTime}</small></>} />
            <InfoPair label="下一节气" value={<>{overview.nextSolarTerm.name}<small>{overview.nextSolarTerm.dateTime}</small></>} />
            <InfoPair label="旬首" value={overview.xunShou} />
            <InfoPair label="本盘旬空" value={overview.selectedVoidBranches} />
            <InfoPair label="值符" value={`${overview.chiefStar.name} · ${overview.chiefStar.palace}宫`} />
            <InfoPair label="值使" value={`${overview.chiefDoor.name} · ${overview.chiefDoor.palace}宫`} />
            <InfoPair label="马星" value={`${overview.horse.branch} · ${overview.horse.palace}宫`} />
          </InfoGrid>
        </div>
        <div className="juece-hour-switch" aria-label="时辰切换">
          <button type="button" disabled={switching} onClick={() => void switchHour(-2)}><CaretLeft size={18} weight="bold" aria-hidden="true" /><span>上一时辰</span></button>
          <span aria-live="polite">{switching ? "正在重新起盘…" : chartRequest.chartDateTime}</span>
          <button type="button" disabled={switching} onClick={() => void switchHour(2)}><span>下一时辰</span><CaretRight size={18} weight="bold" aria-hidden="true" /></button>
        </div>
        {switchError && (
          <div className="inline-error juece-switch-error" role="alert">
            <span>{switchError}，当前盘未改变。</span>
            {retryDelta && <button type="button" disabled={switching} onClick={() => void switchHour(retryDelta)}><ArrowClockwise size={17} aria-hidden="true" />重试</button>}
          </div>
        )}
      </PaipanSectionCard>

      <PaipanSectionCard className="juece-chart-card" labelledBy="juece-chart-heading">
        <h2 className="result-section-title" id="juece-chart-heading"><span>01</span>九宫主盘</h2>
        <p className="dunjia-chart-hint">点击宫位，在当前行下方查看结构详情</p>
        <div className="juece-nine-grid" role="group" aria-label="决策九宫盘">
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
      </PaipanSectionCard>

      <PaipanSectionCard className="juece-legend" label="盘面标记说明">
        <h2 className="result-section-title"><span>注</span>标记说明</h2>
        <div>
          <span><i className="void">空</i>所选旬空</span>
          <span><i className="chief">符</i>值符所临</span>
          <span><i className="chief-door">使</i>值使所临</span>
          <span><Horse size={16} weight="duotone" aria-hidden="true" />马星所临</span>
        </div>
        <p>转盘显示中宫寄宫与隐干；飞盘显示暗干支与天地八神。盘面不提供个案吉凶判断。</p>
      </PaipanSectionCard>

      <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
