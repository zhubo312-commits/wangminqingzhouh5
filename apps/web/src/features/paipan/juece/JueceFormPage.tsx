import type {
  JueceBureau,
  JueceChartRequest,
  JuecePan,
  JueceTime,
  PaipanAreaNode,
  ResolveBirthRequest,
} from "@guoxue/contracts";
import { CompassRose, MapPin, SunHorizon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import {
  createJueceChart,
  fetchPaipanAreas,
  resolveBirth,
} from "../../../lib/api-client";
import {
  AreaWheelPicker,
  LunarDateTimePicker,
  SolarDateTimePicker,
} from "../bazi/BaziMobilePickers";
import { useJueceSession, type JueceDraft } from "./JueceSession";

const bureauOptions = [
  ["chai_bu", "拆补"],
  ["zhi_run", "置闰"],
  ["mao_shan", "茅山"],
  ["manual", "手工定局"],
] as const;

const voidOptions = [
  ["hour", "时空"],
  ["day", "日空"],
  ["month", "月空"],
  ["year", "年空"],
] as const;

const centerPalaceOptions = [
  ["kun", "寄坤宫"],
  ["yang_gen_yin_kun", "阳艮阴坤"],
  ["four_corners", "寄四维"],
  ["seasonal", "随节令"],
] as const;

export function JueceFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useJueceSession();
  const [areas, setAreas] = useState<PaipanAreaNode[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    setAreasLoading(true);
    setAreaError(null);
    try {
      setAreas(await fetchPaipanAreas());
    } catch (reason) {
      setAreaError(reason instanceof Error ? reason.message : "地区暂时无法加载");
    } finally {
      setAreasLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  function update<Key extends keyof JueceDraft>(key: Key, value: JueceDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectPanStyle(style: JueceDraft["panStyle"]) {
    update("panStyle", style);
  }

  async function resolveChartDateTime() {
    if (draft.dateMode === "solar") return draft.solarDateTime.replace("T", " ");
    const lunarRequest: ResolveBirthRequest = {
      mode: "lunar",
      lunar: {
        year: draft.lunarYear,
        month: draft.lunarMonth,
        day: draft.lunarDay,
        hour: draft.lunarHour,
        minute: draft.lunarMinute,
        leapMonth: draft.lunarLeapMonth,
      },
    };
    const resolved = await resolveBirth(lunarRequest);
    const candidate = resolved.candidates[0];
    if (!candidate) throw new Error("未找到对应的阳历起局时间，请检查阴历日期");
    return candidate.solarDateTime;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const time: JueceTime = draft.timeMode === "true_solar"
        ? { mode: "true_solar", areaCode: draft.areaCode }
        : { mode: "standard" };
      const pan: JuecePan = draft.panStyle === "rotating"
        ? { style: "rotating", centerPalaceMethod: draft.centerPalaceMethod }
        : { style: "flying", directionRule: draft.directionRule };
      const bureau: JueceBureau = draft.bureauMethod === "manual"
        ? { method: "manual", dunType: draft.manualDunType, number: draft.manualNumber }
        : { method: draft.bureauMethod };
      const request: JueceChartRequest = {
        chartDateTime: await resolveChartDateTime(),
        time,
        pan,
        bureau,
        voidBasis: draft.voidBasis,
      };
      const response = await createJueceChart(request);
      const { paipan_ref: paipanRef, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, paipanRef);
      navigate("/paipan/juece/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "排盘失败，请稍后重试");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  const trueSolarUnavailable = draft.timeMode === "true_solar" && (areasLoading || Boolean(areaError));

  return (
    <PaipanPageShell pageClassName="form-page juece-form-page">
      <PageHeader title="时家决策学" backTo="/paipan" backLabel="返回排盘导航" />

      <form className="bazi-form juece-form" onSubmit={onSubmit}>
        <PaipanSectionCard variant="form" labelledBy="juece-time-heading">
          <div className="form-card-heading">
            <span>01</span>
            <h3 id="juece-time-heading">起盘条件</h3>
          </div>
          <div className="mode-tabs juece-two-tabs" role="tablist" aria-label="起盘时间类型">
            <button type="button" role="tab" aria-selected={draft.dateMode === "solar"} className={draft.dateMode === "solar" ? "active" : ""} onClick={() => update("dateMode", "solar")}>阳历</button>
            <button type="button" role="tab" aria-selected={draft.dateMode === "lunar"} className={draft.dateMode === "lunar" ? "active" : ""} onClick={() => update("dateMode", "lunar")}>阴历</button>
          </div>
          {draft.dateMode === "solar" ? (
            <div className="form-field mode-panel picker-field">
              <SolarDateTimePicker subject="起盘" value={draft.solarDateTime} onChange={(value) => update("solarDateTime", value)} />
            </div>
          ) : (
            <div className="form-field mode-panel picker-field">
              <LunarDateTimePicker
                subject="起盘"
                value={{
                  year: draft.lunarYear,
                  month: draft.lunarMonth,
                  day: draft.lunarDay,
                  hour: draft.lunarHour,
                  minute: draft.lunarMinute,
                  leapMonth: draft.lunarLeapMonth,
                }}
                onChange={(value) => setDraft((current) => ({
                  ...current,
                  lunarYear: value.year,
                  lunarMonth: value.month,
                  lunarDay: value.day,
                  lunarHour: value.hour,
                  lunarMinute: value.minute,
                  lunarLeapMonth: value.leapMonth,
                }))}
              />
            </div>
          )}

          <fieldset className="form-field juece-choice-field">
            <legend>计时方式</legend>
            <div className="segment-control juece-two-tabs">
              <button type="button" className={draft.timeMode === "standard" ? "active" : ""} aria-pressed={draft.timeMode === "standard"} onClick={() => update("timeMode", "standard")}>标准时间</button>
              <button type="button" className={draft.timeMode === "true_solar" ? "active" : ""} aria-pressed={draft.timeMode === "true_solar"} onClick={() => update("timeMode", "true_solar")}>真太阳时</button>
            </div>
          </fieldset>
          {draft.timeMode === "true_solar" && (
            <div className="juece-conditional-panel">
              <div className="form-field icon-field picker-field">
                <span><MapPin size={18} aria-hidden="true" /> 地区</span>
                <AreaWheelPicker areas={areas} value={draft.areaCode} disabled={areasLoading || Boolean(areaError)} onChange={(value) => update("areaCode", value)} />
              </div>
              <p><SunHorizon size={17} aria-hidden="true" /> 地区只用于本次时间校正</p>
              {areaError && <div className="inline-error" role="alert"><span>{areaError}</span><PaipanActionButton variant="retry" onClick={() => void loadAreas()}>重试</PaipanActionButton></div>}
            </div>
          )}
        </PaipanSectionCard>

        <PaipanSectionCard variant="form" labelledBy="juece-method-heading">
          <div className="form-card-heading">
            <span>02</span>
            <h3 id="juece-method-heading">盘式与定局</h3>
          </div>
          <fieldset className="form-field juece-choice-field">
            <legend>盘式</legend>
            <div className="segment-control juece-two-tabs">
              <button type="button" className={draft.panStyle === "rotating" ? "active" : ""} aria-pressed={draft.panStyle === "rotating"} onClick={() => selectPanStyle("rotating")}>转盘</button>
              <button type="button" className={draft.panStyle === "flying" ? "active" : ""} aria-pressed={draft.panStyle === "flying"} onClick={() => selectPanStyle("flying")}>飞盘</button>
            </div>
          </fieldset>
          {draft.panStyle === "flying" && (
            <fieldset className="form-field juece-choice-field juece-conditional-panel">
              <legend>飞盘顺逆规则</legend>
              <div className="segment-control juece-two-tabs">
                <button type="button" className={draft.directionRule === "yang_forward_yin_reverse" ? "active" : ""} aria-pressed={draft.directionRule === "yang_forward_yin_reverse"} onClick={() => update("directionRule", "yang_forward_yin_reverse")}>阳顺阴逆</button>
                <button type="button" className={draft.directionRule === "all_forward" ? "active" : ""} aria-pressed={draft.directionRule === "all_forward"} onClick={() => update("directionRule", "all_forward")}>阴阳皆顺</button>
              </div>
            </fieldset>
          )}
          <fieldset className="form-field juece-choice-field">
            <legend>定局方式</legend>
            <div className="juece-choice-grid two-columns">
              {bureauOptions.map(([value, label]) => (
                <button key={value} type="button" className={draft.bureauMethod === value ? "active" : ""} aria-pressed={draft.bureauMethod === value} onClick={() => update("bureauMethod", value)}>{label}</button>
              ))}
            </div>
          </fieldset>
          {draft.bureauMethod === "manual" && (
            <div className="juece-conditional-panel manual-bureau-panel">
              <fieldset className="form-field juece-choice-field">
                <legend>阴阳遁</legend>
                <div className="segment-control juece-two-tabs">
                  <button type="button" className={draft.manualDunType === "yang" ? "active" : ""} aria-pressed={draft.manualDunType === "yang"} onClick={() => update("manualDunType", "yang")}>阳遁</button>
                  <button type="button" className={draft.manualDunType === "yin" ? "active" : ""} aria-pressed={draft.manualDunType === "yin"} onClick={() => update("manualDunType", "yin")}>阴遁</button>
                </div>
              </fieldset>
              <fieldset className="form-field juece-choice-field">
                <legend>局数</legend>
                <div className="juece-number-grid">
                  {Array.from({ length: 9 }, (_, index) => index + 1).map((number) => (
                    <button key={number} type="button" className={draft.manualNumber === number ? "active" : ""} aria-pressed={draft.manualNumber === number} onClick={() => update("manualNumber", number)}>{number}</button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </PaipanSectionCard>

        <PaipanSectionCard variant="form" labelledBy="juece-mark-heading">
          <div className="form-card-heading">
            <span>03</span>
            <h3 id="juece-mark-heading">标记与寄宫</h3>
          </div>
          <fieldset className="form-field juece-choice-field">
            <legend>旬空标记</legend>
            <div className="juece-choice-grid four-columns">
              {voidOptions.map(([value, label]) => (
                <button key={value} type="button" className={draft.voidBasis === value ? "active" : ""} aria-pressed={draft.voidBasis === value} onClick={() => update("voidBasis", value)}>{label}</button>
              ))}
            </div>
          </fieldset>
          {draft.panStyle === "rotating" && (
            <fieldset className="form-field juece-choice-field">
              <legend>寄宫方式</legend>
              <div className="juece-choice-grid two-columns">
                {centerPalaceOptions.map(([value, label]) => (
                  <button key={value} type="button" className={draft.centerPalaceMethod === value ? "active" : ""} aria-pressed={draft.centerPalaceMethod === value} onClick={() => update("centerPalaceMethod", value)}>{label}</button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="juece-structure-note"><CompassRose size={20} weight="duotone" aria-hidden="true" /><p>仅展示神、星、门、天地盘、寄宫、隐干／暗干支、四害、十二长生、天门地户、空亡与马星。</p></div>
        </PaipanSectionCard>

        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="submit" disabled={submitting || trueSolarUnavailable}>
          {submitting ? "正在起盘…" : "开始排盘"}
        </button>
      </form>
      <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
