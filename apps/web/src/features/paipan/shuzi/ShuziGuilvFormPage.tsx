import type { ShuziGuilvChartRequest } from "@guoxue/contracts";
import { HashStraight, Sparkle } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createShuziGuilvChart } from "../../../lib/api-client";
import { SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { useShuziGuilvSession, type ShuziGuilvDraft } from "./ShuziGuilvSession";

export function ShuziGuilvFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useShuziGuilvSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const update = <Key extends keyof ShuziGuilvDraft>(key: Key, value: ShuziGuilvDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));

  async function submit() {
    if (lock.current) return;
    const name = draft.name.trim();
    if (!name) { setError("请填写姓名"); return; }
    if (name.length > 10) { setError("姓名最多 10 个字"); return; }
    lock.current = true; setSubmitting(true); setError(null);
    try {
      const request: ShuziGuilvChartRequest = { name, gender: draft.gender, birthDateTime: draft.birthDateTime.replace("T", " ") };
      const response = await createShuziGuilvChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/shuzi-guilv/result");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "数字规律排盘失败，请稍后重试"); }
    finally { lock.current = false; setSubmitting(false); }
  }

  return <PaipanPageShell pageClassName="form-page shuzi-form-page">
    <PageHeader title="数字规律" backTo="/paipan" backLabel="返回排盘导航" />
    <div className="shuzi-form">
      <div className="paipan-feature-intro shuzi-intro"><HashStraight size={34} weight="duotone" /><div><h2>先后天数字盘</h2><p>由生肖、农历月日与时辰取数，对照阴阳五行与特殊数组。</p></div></div>
      <PaipanSectionCard variant="form" labelledBy="shuzi-info-heading">
        <div className="form-card-heading"><span>01</span><h3 id="shuzi-info-heading">出生信息</h3></div>
        <label className="form-field"><span>姓名</span><input value={draft.name} maxLength={10} autoComplete="name" placeholder="请输入姓名" onChange={(event) => update("name", event.target.value)} /></label>
        <fieldset className="form-field juece-choice-field"><legend>性别</legend><div className="segment-control juece-two-tabs"><button type="button" className={draft.gender === "male" ? "active" : ""} aria-pressed={draft.gender === "male"} onClick={() => update("gender", "male")}>男</button><button type="button" className={draft.gender === "female" ? "active" : ""} aria-pressed={draft.gender === "female"} onClick={() => update("gender", "female")}>女</button></div></fieldset>
        <div className="form-field picker-field"><SolarDateTimePicker subject="出生" value={draft.birthDateTime} onChange={(value) => update("birthDateTime", value)} /></div>
      </PaipanSectionCard>
      <PaipanSectionCard className="shuzi-method-card" labelledBy="shuzi-method-heading">
        <div className="shuzi-method-line"><Sparkle size={24} weight="duotone" /><div><h3 id="shuzi-method-heading">原盘取数规则</h3><p>晚 23 点后按次日农历计算；先天数按原值，后天数按六位转换。</p></div></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="button" disabled={submitting} onClick={() => void submit()}>{submitting ? "正在排盘…" : "开始排盘"}</button>
      </PaipanSectionCard>
    </div>
    <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
