import type { DunjiaChartRequest, ResolveBirthRequest } from "@guoxue/contracts";
import { CompassRose, HourglassMedium, Path, SquaresFour } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { createDunjiaChart, resolveBirth } from "../../../lib/api-client";
import {
  LunarDateTimePicker,
  SolarDateTimePicker,
} from "../bazi/BaziMobilePickers";
import { useDunjiaSession, type DunjiaDraft } from "./DunjiaSession";

const methodItems = [
  { label: "转盘", detail: "盘式", icon: SquaresFour },
  { label: "拆补", detail: "定局", icon: Path },
  { label: "寄坤二宫", detail: "寄宫", icon: CompassRose },
  { label: "时空", detail: "旬空", icon: HourglassMedium },
] as const;

export function DunjiaFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useDunjiaSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof DunjiaDraft>(key: K, value: DunjiaDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function birthRequest(): ResolveBirthRequest {
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

  async function resolveChartDateTime() {
    if (draft.mode === "solar") return draft.solarDateTime.replace("T", " ");
    const resolved = await resolveBirth(birthRequest());
    const candidate = resolved.candidates[0];
    if (!candidate) throw new Error("未找到对应的阳历起盘时间，请检查阴历日期");
    return candidate.solarDateTime;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const request: DunjiaChartRequest = {
        chartDateTime: await resolveChartDateTime(),
      };
      const response = await createDunjiaChart(request);
      const { paipan_ref: paipanRef, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, paipanRef);
      navigate("/paipan/dunjia/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "排盘失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell inner-shell min-h-[100dvh]">
      <div className="paper-grain" aria-hidden="true" />
      <div className="inner-page form-page dunjia-form-page">
        <PageHeader title="遁甲学" backTo="/paipan" backLabel="返回排盘导航" />

        <form className="bazi-form" onSubmit={onSubmit}>
          <section className="form-card" aria-labelledby="dunjia-time-heading">
            <div className="form-card-heading">
              <span>01</span>
              <h3 id="dunjia-time-heading">起盘时间</h3>
            </div>
            <div className="mode-tabs dunjia-mode-tabs" role="tablist" aria-label="起盘时间类型">
              <button
                type="button"
                role="tab"
                aria-selected={draft.mode === "solar"}
                className={draft.mode === "solar" ? "active" : ""}
                onClick={() => update("mode", "solar")}
              >
                阳历
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={draft.mode === "lunar"}
                className={draft.mode === "lunar" ? "active" : ""}
                onClick={() => update("mode", "lunar")}
              >
                阴历
              </button>
            </div>

            {draft.mode === "solar" ? (
              <div className="form-field mode-panel picker-field">
                <SolarDateTimePicker
                  subject="起盘"
                  value={draft.solarDateTime}
                  onChange={(value) => update("solarDateTime", value)}
                />
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
          </section>

          <section className="form-card" aria-labelledby="dunjia-method-heading">
            <div className="form-card-heading">
              <span>02</span>
              <h3 id="dunjia-method-heading">起盘方式</h3>
            </div>
            <div className="dunjia-method-grid">
              {methodItems.map(({ label, detail, icon: Icon }) => (
                <div className="dunjia-method-item" key={label}>
                  <Icon size={21} weight="duotone" aria-hidden="true" />
                  <span><small>{detail}</small><strong>{label}</strong></span>
                </div>
              ))}
            </div>
          </section>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button className="submit-chart" type="submit" disabled={submitting}>
            {submitting ? "正在起盘…" : "开始排盘"}
          </button>
        </form>
        <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
      </div>
    </main>
  );
}
