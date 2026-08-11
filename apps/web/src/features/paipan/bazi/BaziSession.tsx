import type { BaziChartRequest, BaziChartResponse } from "@guoxue/contracts";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { fetchPaipanContext } from "../../../lib/api-client";
import { usePaipanSessionRestore } from "../../../hooks/usePaipanSessionRestore";

export type BirthMode = "solar" | "lunar" | "fourPillars";

export interface BaziDraft {
  name: string;
  gender: "male" | "female";
  mode: BirthMode;
  solarDateTime: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarHour: number;
  lunarMinute: number;
  lunarLeapMonth: boolean;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  areaCode: string;
  useTrueSolarTime: boolean;
}

const initialDraft: BaziDraft = {
  name: "",
  gender: "male",
  mode: "solar",
  solarDateTime: "1990-01-01T12:00",
  lunarYear: 1989,
  lunarMonth: 12,
  lunarDay: 5,
  lunarHour: 12,
  lunarMinute: 0,
  lunarLeapMonth: false,
  yearPillar: "己巳",
  monthPillar: "丙子",
  dayPillar: "丙寅",
  hourPillar: "甲午",
  areaCode: "110101",
  useTrueSolarTime: false,
};

interface BaziSessionValue {
  draft: BaziDraft;
  setDraft: Dispatch<SetStateAction<BaziDraft>>;
  chart: BaziChartResponse | null;
  chartRequest: BaziChartRequest | null;
  paipanRef: string | null;
  isRestoring: boolean;
  setResult: (
    chart: BaziChartResponse,
    request: BaziChartRequest,
    paipanRef: string,
  ) => void;
}

const BaziSessionContext = createContext<BaziSessionValue | null>(null);
const PAIPAN_REF_STORAGE_KEY = "guoxue.paipan_ref.v1";

export function BaziSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const [chart, setChart] = useState<BaziChartResponse | null>(null);
  const [chartRequest, setChartRequest] = useState<BaziChartRequest | null>(null);
  const [paipanRef, setPaipanRef] = useState<string | null>(null);
  const { isRestoring, rememberReference } = usePaipanSessionRestore({
    storageKey: PAIPAN_REF_STORAGE_KEY,
    fetchContext: fetchPaipanContext,
    onRestore(context) {
      setChart(context.chart);
      setChartRequest(context.chartRequest);
      setPaipanRef(context.paipan_ref);
    },
  });

  const value = useMemo<BaziSessionValue>(
    () => ({
      draft,
      setDraft,
      chart,
      chartRequest,
      paipanRef,
      isRestoring,
      setResult(nextChart, request, nextPaipanRef) {
        setChart(nextChart);
        setChartRequest(request);
        setPaipanRef(nextPaipanRef);
        rememberReference(nextPaipanRef);
      },
    }),
    [chart, chartRequest, draft, isRestoring, paipanRef, rememberReference],
  );
  return <BaziSessionContext.Provider value={value}>{children}</BaziSessionContext.Provider>;
}

export function useBaziSession() {
  const value = useContext(BaziSessionContext);
  if (!value) throw new Error("BaziSessionProvider is missing");
  return value;
}
