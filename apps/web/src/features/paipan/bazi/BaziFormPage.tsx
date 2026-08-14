import type {
  BaziChartRequest,
  PaipanAreaNode,
  ResolveBirthRequest,
  ResolveBirthResponse,
} from "@guoxue/contracts";
import { MapPin, SunHorizon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import {
  createBaziChart,
  fetchPaipanAreas,
  resolveBirth,
} from "../../../lib/api-client";
import {
  AreaWheelPicker,
  FourPillarsPicker,
  LunarDateTimePicker,
  SolarDateTimePicker,
} from "./BaziMobilePickers";
import { useBaziSession, type BaziDraft, type BirthMode } from "./BaziSession";

const modeLabels: Array<{ value: BirthMode; label: string }> = [
  { value: "solar", label: "阳历" },
  { value: "lunar", label: "阴历" },
  { value: "fourPillars", label: "四柱反查" },
];

export function BaziFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useBaziSession();
  const [areas, setAreas] = useState<PaipanAreaNode[]>([]);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ResolveBirthResponse["candidates"]>([]);

  const loadAreas = useCallback(async () => {
    setLoadingAreas(true);
    setAreaError(null);
    try {
      setAreas(await fetchPaipanAreas());
    } catch (reason) {
      setAreaError(reason instanceof Error ? reason.message : "出生地区暂时无法加载");
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  function update<K extends keyof BaziDraft>(key: K, value: BaziDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function birthRequest(): ResolveBirthRequest {
    if (draft.mode === "solar") {
      return { mode: "solar", solarDateTime: draft.solarDateTime.replace("T", " ") };
    }
    if (draft.mode === "lunar") {
      return {
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
    }
    return {
      mode: "fourPillars",
      pillars: {
        year: draft.yearPillar,
        month: draft.monthPillar,
        day: draft.dayPillar,
        hour: draft.hourPillar,
      },
    };
  }

  async function calculate(solarDateTime: string) {
    const request: BaziChartRequest = {
      name: draft.name.trim(),
      gender: draft.gender,
      birthDateTime: solarDateTime,
      areaCode: draft.areaCode,
      useTrueSolarTime: draft.useTrueSolarTime,
    };
    const result = await createBaziChart(request);
    const { paipan_ref: paipanRef, expiresAt: _expiresAt, ...chart } = result;
    setResult(chart, request, paipanRef);
    navigate("/paipan/shengping-zishi/result");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setCandidates([]);
    try {
      const resolved = await resolveBirth(birthRequest());
      if (resolved.candidates.length === 1) {
        await calculate(resolved.candidates[0]!.solarDateTime);
      } else {
        setCandidates(resolved.candidates);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "排盘失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseCandidate(solarDateTime: string) {
    setSubmitting(true);
    setError(null);
    try {
      await calculate(solarDateTime);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "排盘失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PaipanPageShell pageClassName="form-page">
        <PageHeader title="生平子时" backTo="/paipan" backLabel="返回排盘导航" />

        <form className="bazi-form" onSubmit={onSubmit}>
          <PaipanSectionCard variant="form" labelledBy="identity-heading">
            <div className="form-card-heading">
              <span>01</span>
              <h3 id="identity-heading">基本信息</h3>
            </div>
            <label className="form-field">
              <span>姓名 <small>选填</small></span>
              <input
                value={draft.name}
                maxLength={32}
                placeholder="未填写时结果显示“同修”"
                onChange={(event) => update("name", event.target.value)}
              />
            </label>
            <fieldset className="form-field">
              <legend>性别</legend>
              <div className="segment-control">
                <button
                  type="button"
                  className={draft.gender === "male" ? "active" : ""}
                  aria-pressed={draft.gender === "male"}
                  onClick={() => update("gender", "male")}
                >
                  男
                </button>
                <button
                  type="button"
                  className={draft.gender === "female" ? "active" : ""}
                  aria-pressed={draft.gender === "female"}
                  onClick={() => update("gender", "female")}
                >
                  女
                </button>
              </div>
            </fieldset>
          </PaipanSectionCard>

          <PaipanSectionCard variant="form" labelledBy="birth-heading">
            <div className="form-card-heading">
              <span>02</span>
              <h3 id="birth-heading">出生时间</h3>
            </div>
            <div className="mode-tabs" role="tablist" aria-label="出生时间类型">
              {modeLabels.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  role="tab"
                  aria-selected={draft.mode === mode.value}
                  className={draft.mode === mode.value ? "active" : ""}
                  onClick={() => update("mode", mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {draft.mode === "solar" && (
              <div className="form-field mode-panel picker-field">
                <SolarDateTimePicker
                  value={draft.solarDateTime}
                  onChange={(value) => update("solarDateTime", value)}
                />
              </div>
            )}

            {draft.mode === "lunar" && (
              <div className="form-field mode-panel picker-field">
                <LunarDateTimePicker
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

            {draft.mode === "fourPillars" && (
              <div className="mode-panel pillar-fields">
                <FourPillarsPicker
                  value={{
                    yearPillar: draft.yearPillar,
                    monthPillar: draft.monthPillar,
                    dayPillar: draft.dayPillar,
                    hourPillar: draft.hourPillar,
                  }}
                  onChange={(value) => setDraft((current) => ({ ...current, ...value }))}
                />
              </div>
            )}
          </PaipanSectionCard>

          <PaipanSectionCard variant="form" labelledBy="place-heading">
            <div className="form-card-heading">
              <span>03</span>
              <h3 id="place-heading">出生地区</h3>
            </div>
            <div className="form-field icon-field picker-field">
              <span><MapPin size={18} aria-hidden="true" /> 地区</span>
              <AreaWheelPicker
                areas={areas}
                value={draft.areaCode}
                disabled={loadingAreas || Boolean(areaError)}
                onChange={(value) => update("areaCode", value)}
              />
            </div>
            {areaError && (
              <div className="inline-error" role="alert">
                <span>{areaError}</span>
                <PaipanActionButton variant="retry" onClick={() => void loadAreas()}>重试</PaipanActionButton>
              </div>
            )}
            <label className="solar-toggle">
              <span className="toggle-copy"><SunHorizon size={22} aria-hidden="true" /><span><strong>使用真太阳时</strong><small>根据出生地经度与时差校正</small></span></span>
              <input type="checkbox" checked={draft.useTrueSolarTime} onChange={(event) => update("useTrueSolarTime", event.target.checked)} />
            </label>
          </PaipanSectionCard>

          {error && <div className="form-error" role="alert">{error}</div>}

          {candidates.length > 1 && (
            <section className="candidate-panel" aria-labelledby="candidate-heading">
              <h3 id="candidate-heading">请选择对应的阳历时间</h3>
              <p>四柱反查到多个候选，选定后再排盘。</p>
              <div className="candidate-list">
                {candidates.map((candidate) => (
                  <button type="button" key={candidate.id} disabled={submitting} onClick={() => void chooseCandidate(candidate.solarDateTime)}>{candidate.label}</button>
                ))}
              </div>
            </section>
          )}

          <button className="submit-chart" type="submit" disabled={submitting || loadingAreas || Boolean(areaError)}>
            {submitting ? "正在起盘…" : "开始排盘"}
          </button>
        </form>
        <p className="culture-notice form-notice">排盘结果仅保存于当前页面会话，不写入网址或本地存储</p>
    </PaipanPageShell>
  );
}
