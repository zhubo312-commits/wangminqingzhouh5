import type { LuojiChartRequest, LuojiChartResponse } from "@guoxue/contracts";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchLuojiContext } from "../../../lib/api-client";

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export interface LuojiDraft {
  chartDateTime: string;
  question: string;
  mode: "coins" | "names" | "backs";
  coinBacks: string;
  originalHexagram: string;
  changedHexagram: string;
}

const initialDraft: LuojiDraft = {
  chartDateTime: localDateTimeValue(),
  question: "",
  mode: "coins",
  coinBacks: "",
  originalHexagram: "乾为天",
  changedHexagram: "乾为天",
};

interface LuojiSessionValue {
  draft: LuojiDraft;
  setDraft: Dispatch<SetStateAction<LuojiDraft>>;
  chart: LuojiChartResponse | null;
  chartRequest: LuojiChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: LuojiChartResponse, request: LuojiChartRequest, reference: string) => void;
}

const LuojiSessionContext = createContext<LuojiSessionValue | null>(null);
const STORAGE_KEY = "guoxue.paipan.luoji_ref.v1";

export function LuojiSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<LuojiChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<LuojiChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({ storageKey: STORAGE_KEY, fetchContext: fetchLuojiContext, onRestore(context) { setChart(context.chart); setChartRequest(context.chartRequest); } });
  const value = useMemo<LuojiSessionValue>(() => ({
    draft, setDraft, chart, chartRequest, isRestoring,
    setResult(nextChart, request, reference) { setChart(nextChart); setChartRequest(request); rememberReference(reference); },
  }), [chart, chartRequest, draft, isRestoring, rememberReference]);
  return <LuojiSessionContext.Provider value={value}>{children}</LuojiSessionContext.Provider>;
}

export function useLuojiSession() {
  const value = useContext(LuojiSessionContext);
  if (!value) throw new Error("LuojiSessionProvider is missing");
  return value;
}
