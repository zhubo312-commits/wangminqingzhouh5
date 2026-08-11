import type { MeihuaChartRequest, MeihuaChartResponse } from "@guoxue/contracts";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";
import { fetchMeihuaContext } from "../../../lib/api-client";

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export interface MeihuaDraft {
  chartDateTime: string;
  numberOne: string;
  numberTwo: string;
  includeHour: boolean;
  school: "digit_sum" | "raw_number";
  upperTrigram: number;
  lowerTrigram: number;
  movingLine: number;
}

const initialDraft: MeihuaDraft = {
  chartDateTime: localDateTimeValue(),
  numberOne: "",
  numberTwo: "",
  includeHour: false,
  school: "digit_sum",
  upperTrigram: 1,
  lowerTrigram: 8,
  movingLine: 1,
};

interface MeihuaSessionValue {
  draft: MeihuaDraft;
  setDraft: Dispatch<SetStateAction<MeihuaDraft>>;
  chart: MeihuaChartResponse | null;
  chartRequest: MeihuaChartRequest | null;
  isRestoring: boolean;
  setResult: (chart: MeihuaChartResponse, request: MeihuaChartRequest, paipanRef: string) => void;
}

const MeihuaSessionContext = createContext<MeihuaSessionValue | null>(null);
const STORAGE_KEY = "guoxue.paipan.meihua_ref.v1";

export function MeihuaSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<MeihuaChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<MeihuaChartRequest | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: STORAGE_KEY,
    fetchContext: fetchMeihuaContext,
    onRestore(context) {
      setChart(context.chart);
      setChartRequest(context.chartRequest);
    },
  });

  const value = useMemo<MeihuaSessionValue>(() => ({
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

  return <MeihuaSessionContext.Provider value={value}>{children}</MeihuaSessionContext.Provider>;
}

export function useMeihuaSession() {
  const value = useContext(MeihuaSessionContext);
  if (!value) throw new Error("MeihuaSessionProvider is missing");
  return value;
}
