import type { ShanxiangChartRequest, ShanxiangChartResponse } from "@guoxue/contracts";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchShanxiangContext } from "../../../lib/api-client";

export interface ShanxiangDraft {
  year: number;
  degrees: string;
  question: string;
}

const initialDraft: ShanxiangDraft = {
  year: new Date().getFullYear(),
  degrees: "0",
  question: "",
};

interface ShanxiangSessionValue {
  draft: ShanxiangDraft;
  setDraft: Dispatch<SetStateAction<ShanxiangDraft>>;
  chart: ShanxiangChartResponse | null;
  chartRequest: ShanxiangChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: ShanxiangChartResponse, request: ShanxiangChartRequest, paipanRef: string) => void;
}

const ShanxiangSessionContext = createContext<ShanxiangSessionValue | null>(null);
const STORAGE_KEY = "guoxue.paipan.shanxiang_juece_ref.v1";

export function ShanxiangSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<ShanxiangChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<ShanxiangChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: STORAGE_KEY,
    fetchContext: fetchShanxiangContext,
    onRestore(context) {
      setChart(context.chart);
      setChartRequest(context.chartRequest);
    },
  });

  const value = useMemo<ShanxiangSessionValue>(() => ({
    draft,
    setDraft,
    chart,
    chartRequest,
    isRestoring,
    setResult(nextChart, request, paipanRef) {
      setChart(nextChart);
      setChartRequest(request);
      rememberReference(paipanRef);
    },
  }), [chart, chartRequest, draft, isRestoring, rememberReference]);

  return <ShanxiangSessionContext.Provider value={value}>{children}</ShanxiangSessionContext.Provider>;
}

export function useShanxiangSession() {
  const value = useContext(ShanxiangSessionContext);
  if (!value) throw new Error("ShanxiangSessionProvider is missing");
  return value;
}
