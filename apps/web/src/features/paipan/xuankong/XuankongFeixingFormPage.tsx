import { XUANKONG_ORIENTATIONS, type XuankongFeixingChartRequest } from "@guoxue/contracts";
import { Compass, StarFour } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { WheelSelectPicker } from "../../../components/WheelSelectPicker";
import { createXuankongFeixingChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { useXuankongFeixingSession, type XuankongFeixingDraft } from "./XuankongFeixingSession";

const PERIOD_OPTIONS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"].map((label, index) => ({ value: String(index + 1), label: `${label}运` }));
const ORIENTATION_OPTIONS = XUANKONG_ORIENTATIONS.map((value) => ({ value, label: value }));

export function XuankongFeixingFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useXuankongFeixingSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const update = <Key extends keyof XuankongFeixingDraft>(key: Key, value: XuankongFeixingDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));

  async function submit() {
    if (lock.current) return;
    lock.current = true; setSubmitting(true); setError(null);
    try {
      const request: XuankongFeixingChartRequest = {
        chartDateTime: draft.chartDateTime.replace("T", " "),
        fortunePeriod: Number(draft.fortunePeriod),
        orientation: draft.orientation,
        method: draft.method,
        note: draft.note.trim(),
      };
      const response = await createXuankongFeixingChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/xuankong-feixing/result");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "玄空飞星排盘失败，请稍后重试"); }
    finally { lock.current = false; setSubmitting(false); }
  }

  return <PaipanPageShell pageClassName="form-page xuankong-form-page">
    <PageHeader title="玄空飞星" backTo="/paipan" backLabel="返回排盘导航" />
    <div className="xuankong-form">
      <div className="paipan-feature-intro xuankong-intro"><StarFour size={35} weight="duotone" /><div><h2>三元九运飞星盘</h2><p>按元运、二十四山与起盘时刻布山星、向星及年月日时飞星。</p></div></div>
      <PaipanSectionCard variant="form" labelledBy="xuankong-time-heading">
        <div className="form-card-heading"><span>01</span><h3 id="xuankong-time-heading">起盘条件</h3></div>
        <div className="form-field picker-field"><SolarDateTimePicker subject="起盘" value={draft.chartDateTime} onChange={(value) => update("chartDateTime", value)} /></div>
        <WheelSelectPicker label="元运" title="选择元运" value={draft.fortunePeriod} options={PERIOD_OPTIONS} onChange={(value) => update("fortunePeriod", value)} />
        <WheelSelectPicker label="山向" title="选择二十四山向" value={draft.orientation} options={ORIENTATION_OPTIONS} onChange={(value) => update("orientation", value as XuankongFeixingDraft["orientation"])} />
      </PaipanSectionCard>
      <PaipanSectionCard variant="form" labelledBy="xuankong-method-heading">
        <div className="form-card-heading"><span>02</span><h3 id="xuankong-method-heading">挨星方式</h3></div>
        <fieldset className="form-field juece-choice-field"><legend>排盘方式</legend><div className="segment-control juece-two-tabs"><button type="button" className={draft.method === "base" ? "active" : ""} aria-pressed={draft.method === "base"} onClick={() => update("method", "base")}>下盘</button><button type="button" className={draft.method === "replacement" ? "active" : ""} aria-pressed={draft.method === "replacement"} onClick={() => update("method", "replacement")}>替盘</button></div></fieldset>
        <label className="form-field"><span>备注 <small>选填，限 10 字</small></span><input value={draft.note} maxLength={10} placeholder="如：办公室" onChange={(event) => update("note", event.target.value)} /></label>
        <div className="xuankong-method-note"><Compass size={24} weight="duotone" /><p><strong>{draft.orientation} · {draft.method === "base" ? "下盘" : "替盘"}</strong><small>替盘按原系统替星规则布山向飞星；年月日时盘不受方式切换影响。</small></p></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="button" disabled={submitting} onClick={() => void submit()}>{submitting ? "正在排盘…" : "开始飞星排盘"}</button>
      </PaipanSectionCard>
    </div>
    <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
