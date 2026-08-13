import { XUANKONG_ORIENTATIONS, type XuankongFeixingChartRequest, type XuankongFeixingChartResponse } from "@guoxue/contracts";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchXuankongFeixingContext } from "../../../lib/api-client";

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export interface XuankongFeixingDraft {
  chartDateTime: string;
  fortunePeriod: string;
  orientation: (typeof XUANKONG_ORIENTATIONS)[number];
  method: "base" | "replacement";
  note: string;
}
const initialDraft: XuankongFeixingDraft = { chartDateTime: localDateTimeValue(), fortunePeriod: "9", orientation: XUANKONG_ORIENTATIONS[1], method: "base", note: "" };

interface SessionValue {
  draft: XuankongFeixingDraft;
  setDraft: Dispatch<SetStateAction<XuankongFeixingDraft>>;
  chart: XuankongFeixingChartResponse | null;
  chartRequest: XuankongFeixingChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: XuankongFeixingChartResponse, request: XuankongFeixingChartRequest, paipanRef: string) => void;
}
const Context = createContext<SessionValue | null>(null);

export function XuankongFeixingSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<XuankongFeixingChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<XuankongFeixingChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: "guoxue.paipan.xuankong_feixing_ref.v1",
    fetchContext: fetchXuankongFeixingContext,
    onRestore(value) { setChart(value.chart); setChartRequest(value.chartRequest); },
  });
  const value = useMemo<SessionValue>(() => ({
    draft, setDraft, chart, chartRequest, isRestoring,
    setResult(nextChart, request, paipanRef) { setChart(nextChart); setChartRequest(request); rememberReference(paipanRef); },
  }), [chart, chartRequest, draft, isRestoring, rememberReference]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useXuankongFeixingSession() {
  const value = useContext(Context);
  if (!value) throw new Error("XuankongFeixingSessionProvider is missing");
  return value;
}
