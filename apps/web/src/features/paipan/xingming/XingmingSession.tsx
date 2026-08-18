import type { XingmingChartRequest, XingmingChartResponse } from "@guoxue/contracts";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchXingmingContext } from "../../../lib/api-client";

export interface XingmingDraft {
  surname: string;
  givenName: string;
  school: "wuge" | "liuge";
}

const initialDraft: XingmingDraft = { surname: "", givenName: "", school: "wuge" };
export const XINGMING_SESSION_STORAGE_KEY = "guoxue.paipan.xingming_ref.v2";

interface SessionValue {
  draft: XingmingDraft;
  setDraft: Dispatch<SetStateAction<XingmingDraft>>;
  chart: XingmingChartResponse | null;
  chartRequest: XingmingChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: XingmingChartResponse, request: XingmingChartRequest, paipanRef: string) => void;
}

const Context = createContext<SessionValue | null>(null);

export function XingmingSessionProvider({
  children,
  storageKey = XINGMING_SESSION_STORAGE_KEY,
}: {
  children: ReactNode;
  storageKey?: string;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<XingmingChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<XingmingChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey,
    fetchContext: fetchXingmingContext,
    onRestore(value) {
      setChart(value.chart);
      setChartRequest(value.chartRequest);
      setDraft(value.chartRequest);
    },
  });
  const value = useMemo<SessionValue>(() => ({
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
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useXingmingSession() {
  const value = useContext(Context);
  if (!value) throw new Error("XingmingSessionProvider is missing");
  return value;
}
