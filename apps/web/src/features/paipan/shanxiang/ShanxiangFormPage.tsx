import type { ShanxiangChartRequest } from "@guoxue/contracts";
import { CompassRose } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createShanxiangChart } from "../../../lib/api-client";
import { useShanxiangSession, type ShanxiangDraft } from "./ShanxiangSession";

export function ShanxiangFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useShanxiangSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);

  function update<Key extends keyof ShanxiangDraft>(key: Key, value: ShanxiangDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    const degrees = Number(draft.degrees);
    if (!Number.isFinite(degrees) || degrees < 0 || degrees > 360) {
      setError("山向度数只能介于 0～360 度之间");
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const request: ShanxiangChartRequest = { year: draft.year, degrees, question: draft.question.trim() };
      const response = await createShanxiangChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/shanxiang-juece/result");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "山向排盘失败，请稍后重试");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <PaipanPageShell pageClassName="form-page shanxiang-form-page">
      <PageHeader title="山向决策" backTo="/paipan" backLabel="返回排盘导航" />
      <form className="bazi-form shanxiang-form" onSubmit={onSubmit}>
        <PaipanSectionCard variant="form" labelledBy="shanxiang-condition-heading">
          <div className="form-card-heading"><span>01</span><h3 id="shanxiang-condition-heading">山向条件</h3></div>
          <label className="form-field"><span>排盘年份</span><input aria-label="排盘年份" type="number" min={1930} max={2100} value={draft.year} onChange={(event) => update("year", Number(event.target.value))} /></label>
          <label className="form-field"><span>山向度数 <small>0～360 度</small></span><input aria-label="山向度数" type="number" min={0} max={360} step="0.1" inputMode="decimal" value={draft.degrees} onChange={(event) => update("degrees", event.target.value)} /></label>
          <label className="form-field shanxiang-question"><span>所排事项 <small>选填，限80字</small></span><textarea maxLength={80} value={draft.question} placeholder="请输入需要研究的山向事项" onChange={(event) => update("question", event.target.value)} /><em>{draft.question.length}/80</em></label>
          <div className="shanxiang-method-note"><CompassRose size={24} aria-hidden="true" /><p><strong>三局联排</strong><small>按所在十五度山向区间生成三组五度分金，并优先展示当前度数所属局。</small></p></div>
        </PaipanSectionCard>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="submit" disabled={submitting}>{submitting ? "正在排盘…" : "开始山向排盘"}</button>
      </form>
      <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
    </PaipanPageShell>
  );
}
