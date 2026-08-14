import type { PaipanAreaNode, XingxiangChartRequest } from "@guoxue/contracts";
import { MapPin, Planet, Sparkle, SunHorizon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/PageHeader";
import { PaipanActionButton } from "../../../components/paipan/PaipanActionButton";
import { PaipanPageShell } from "../../../components/paipan/PaipanPageShell";
import { PaipanSectionCard } from "../../../components/paipan/PaipanSectionCard";
import { createXingxiangChart, fetchPaipanAreas } from "../../../lib/api-client";
import { AreaWheelPicker, SolarDateTimePicker } from "../bazi/BaziMobilePickers";
import { useXingxiangSession, type XingxiangDraft } from "./XingxiangSession";

export function XingxiangFormPage() {
  const navigate = useNavigate();
  const { draft, setDraft, setResult } = useXingxiangSession();
  const [areas, setAreas] = useState<PaipanAreaNode[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const update = <Key extends keyof XingxiangDraft>(key: Key, value: XingxiangDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }));

  const loadAreas = useCallback(async () => {
    setAreasLoading(true);
    setAreaError(null);
    try {
      setAreas(await fetchPaipanAreas());
    } catch (reason) {
      setAreaError(reason instanceof Error ? reason.message : "出生地区暂时无法加载");
    } finally {
      setAreasLoading(false);
    }
  }, []);

  useEffect(() => { void loadAreas(); }, [loadAreas]);

  async function submit() {
    if (lock.current) return;
    const name = draft.name.trim();
    if (!name) { setError("请填写姓名"); return; }
    if (name.length > 10) { setError("姓名最多 10 个字"); return; }
    if (draft.useTrueSolarTime && draft.areaCode === "999999") { setError("真太阳时请选择具体的国内出生地区"); return; }
    lock.current = true; setSubmitting(true); setError(null);
    try {
      const request: XingxiangChartRequest = {
        name,
        gender: draft.gender,
        birthDateTime: draft.birthDateTime.replace("T", " "),
        areaCode: draft.areaCode,
        useTrueSolarTime: draft.useTrueSolarTime,
        school: "flying",
      };
      const response = await createXingxiangChart(request);
      const { paipan_ref: reference, expiresAt: _expiresAt, ...chart } = response;
      setResult(chart, request, reference);
      navigate("/paipan/xingxiang/result");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "星像排盘失败，请稍后重试"); }
    finally { lock.current = false; setSubmitting(false); }
  }

  return <PaipanPageShell pageClassName="form-page xingxiang-form-page">
    <PageHeader title="星像学" backTo="/paipan" backLabel="返回排盘导航" />
    <div className="xingxiang-form">
      <div className="xingxiang-intro"><Planet size={34} weight="duotone" /><div><h2>飞星紫微盘</h2><p>以十二宫、星曜四化与大限流年建立完整阅读路径。</p></div></div>
      <PaipanSectionCard variant="form" labelledBy="xingxiang-info-heading">
        <div className="form-card-heading"><span>01</span><h3 id="xingxiang-info-heading">出生信息</h3></div>
        <label className="form-field"><span>姓名</span><input value={draft.name} maxLength={10} autoComplete="name" placeholder="请输入姓名" onChange={(event) => update("name", event.target.value)} /></label>
        <fieldset className="form-field juece-choice-field"><legend>性别</legend><div className="segment-control juece-two-tabs"><button type="button" className={draft.gender === "male" ? "active" : ""} aria-pressed={draft.gender === "male"} onClick={() => update("gender", "male")}>男</button><button type="button" className={draft.gender === "female" ? "active" : ""} aria-pressed={draft.gender === "female"} onClick={() => update("gender", "female")}>女</button></div></fieldset>
        <div className="form-field picker-field"><SolarDateTimePicker subject="出生" value={draft.birthDateTime} onChange={(value) => update("birthDateTime", value)} /></div>
      </PaipanSectionCard>
      <PaipanSectionCard variant="form" labelledBy="xingxiang-place-heading">
        <div className="form-card-heading"><span>02</span><h3 id="xingxiang-place-heading">出生地区与计时</h3></div>
        <div className="form-field icon-field picker-field"><span><MapPin size={18} aria-hidden="true" /> 地区</span><AreaWheelPicker areas={areas} value={draft.areaCode} disabled={areasLoading || Boolean(areaError)} onChange={(value) => update("areaCode", value)} /></div>
        {areaError && <div className="inline-error" role="alert"><span>{areaError}</span><PaipanActionButton variant="retry" onClick={() => void loadAreas()}>重试</PaipanActionButton></div>}
        <label className="solar-toggle"><span className="toggle-copy"><SunHorizon size={22} aria-hidden="true" /><span><strong>使用真太阳时</strong><small>根据出生地区校正后再进行晚子时换日</small></span></span><input type="checkbox" checked={draft.useTrueSolarTime} onChange={(event) => update("useTrueSolarTime", event.target.checked)} /></label>
      </PaipanSectionCard>
      <PaipanSectionCard variant="form" labelledBy="xingxiang-school-heading">
        <div className="form-card-heading"><span>03</span><h3 id="xingxiang-school-heading">排盘流派</h3></div>
        <div className="xingxiang-school"><Sparkle size={24} weight="duotone" /><div><strong>飞星派</strong><small>保留生年四化、宫干自化、大限与流年联动</small></div><span>已选</span></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="submit-chart" type="button" disabled={submitting || areasLoading || Boolean(areaError)} onClick={() => void submit()}>{submitting ? "正在排盘…" : "开始排盘"}</button>
      </PaipanSectionCard>
    </div>
    <p className="culture-notice form-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
  </PaipanPageShell>;
}
