import type { YinpanChartRequest } from "@guoxue/contracts";
import { ClockCountdown, YinYang } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createYinpanChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { useYinpanSession, type YinpanDraft } from "./YinpanSession";

export function YinpanFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useYinpanSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);

  function update<Key extends keyof YinpanDraft>(key: Key, value: YinpanDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const request: YinpanChartRequest = {
        chartDateTime: draft.chartDateTime.replace("T", " "),
        gender: draft.gender,
        question: draft.question.trim(),
        mode: draft.mode,
        lifetime: draft.lifetime,
      };
      const response = await createYinpanChart(request);
      const { paipan_ref: paipanRef, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, paipanRef);
      navigate("/paipan/yinpan-juece/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "阴盘起局失败，请稍后重试");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <PaipanPageShell pageClassName="form-page yinpan-form-page">
      <PageHeader title="阴盘决策" backTo="/paipan" backLabel="返回排盘导航" />
      <form className="bazi-form yinpan-form" onSubmit={onSubmit}>
        <PaipanSectionCard variant="form" labelledBy="yinpan-condition-heading">
          <div className="form-card-heading">
            <span>01</span><h3 id="yinpan-condition-heading">起局信息</h3>
          </div>
          <div className="form-field picker-field">
            <SolarDateTimePicker subject="起盘" value={draft.chartDateTime} onChange={(value) => update("chartDateTime", value)} />
          </div>
          <fieldset className="form-field juece-choice-field">
            <legend>性别</legend>
            <div className="segment-control juece-two-tabs">
              <button type="button" className={draft.gender === "male" ? "active" : ""} aria-pressed={draft.gender === "male"} onClick={() => update("gender", "male")}>男</button>
              <button type="button" className={draft.gender === "female" ? "active" : ""} aria-pressed={draft.gender === "female"} onClick={() => update("gender", "female")}>女</button>
            </div>
          </fieldset>
          <label className="form-field yinpan-question-field">
            <span>所排事项 <small>选填，限30字</small></span>
            <textarea maxLength={30} value={draft.question} placeholder="请输入想要研究的事项" onChange={(event) => update("question", event.target.value)} />
            <em>{draft.question.length}/30</em>
          </label>
        </PaipanSectionCard>

        <PaipanSectionCard variant="form" labelledBy="yinpan-mode-heading">
          <div className="form-card-heading">
            <span>02</span><h3 id="yinpan-mode-heading">排盘方式</h3>
          </div>
          <fieldset className="form-field juece-choice-field">
            <legend>盘型</legend>
            <div className="yinpan-mode-grid">
              <button type="button" className={draft.mode === "time" ? "active" : ""} aria-pressed={draft.mode === "time"} onClick={() => update("mode", "time")}>
                <ClockCountdown size={25} weight="duotone" aria-hidden="true" /><strong>时盘排盘</strong><small>按时辰起局，前后局间隔两小时</small>
              </button>
              <button type="button" className={draft.mode === "ke" ? "active" : ""} aria-pressed={draft.mode === "ke"} onClick={() => update("mode", "ke")}>
                <YinYang size={25} weight="duotone" aria-hidden="true" /><strong>刻盘排盘</strong><small>按刻起局，前后局间隔十分钟</small>
              </button>
            </div>
          </fieldset>
          <label className="yinpan-lifetime-toggle">
            <input type="checkbox" checked={draft.lifetime} onChange={(event) => update("lifetime", event.target.checked)} />
            <span><strong>同时生成终身局资料</strong><small>附带四柱与大运结构，供盘面核验使用</small></span>
          </label>
        </PaipanSectionCard>

        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="submit" disabled={submitting}>{submitting ? "正在起局…" : draft.mode === "ke" ? "开始刻盘" : "开始时盘"}</button>
      </form>
      <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
