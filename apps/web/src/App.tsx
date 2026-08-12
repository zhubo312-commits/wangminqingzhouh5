import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HomePage } from "./features/home/HomePage";
import { PaipanMenuPage } from "./features/paipan/PaipanMenuPage";
import { BaziFormPage } from "./features/paipan/bazi/BaziFormPage";
import { BaziResultPage } from "./features/paipan/bazi/BaziResultPage";
import { BaziSessionProvider } from "./features/paipan/bazi/BaziSession";
import { DunjiaFormPage } from "./features/paipan/dunjia/DunjiaFormPage";
import { DunjiaResultPage } from "./features/paipan/dunjia/DunjiaResultPage";
import { DunjiaSessionProvider } from "./features/paipan/dunjia/DunjiaSession";
import { JueceFormPage } from "./features/paipan/juece/JueceFormPage";
import { JueceResultPage } from "./features/paipan/juece/JueceResultPage";
import { JueceSessionProvider } from "./features/paipan/juece/JueceSession";
import { YinpanFormPage } from "./features/paipan/yinpan/YinpanFormPage";
import { YinpanResultPage } from "./features/paipan/yinpan/YinpanResultPage";
import { YinpanSessionProvider } from "./features/paipan/yinpan/YinpanSession";
import { MeihuaSessionProvider } from "./features/paipan/meihua/MeihuaSession";
import { LuojiSessionProvider } from "./features/paipan/luoji/LuojiSession";
import { XingxiangSessionProvider } from "./features/paipan/xingxiang/XingxiangSession";

const MeihuaFormPage = lazy(() => import("./features/paipan/meihua/MeihuaFormPage").then((module) => ({ default: module.MeihuaFormPage })));
const MeihuaResultPage = lazy(() => import("./features/paipan/meihua/MeihuaResultPage").then((module) => ({ default: module.MeihuaResultPage })));
const LuojiFormPage = lazy(() => import("./features/paipan/luoji/LuojiFormPage").then((module) => ({ default: module.LuojiFormPage })));
const LuojiResultPage = lazy(() => import("./features/paipan/luoji/LuojiResultPage").then((module) => ({ default: module.LuojiResultPage })));
const XingxiangFormPage = lazy(() => import("./features/paipan/xingxiang/XingxiangFormPage").then((module) => ({ default: module.XingxiangFormPage })));
const XingxiangResultPage = lazy(() => import("./features/paipan/xingxiang/XingxiangResultPage").then((module) => ({ default: module.XingxiangResultPage })));

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : import.meta.env.BASE_URL.replace(/\/$/, "");

function BaziSessionLayout() {
  return <BaziSessionProvider><Outlet /></BaziSessionProvider>;
}

function DunjiaSessionLayout() {
  return <DunjiaSessionProvider><Outlet /></DunjiaSessionProvider>;
}

function JueceSessionLayout() {
  return <JueceSessionProvider><Outlet /></JueceSessionProvider>;
}

function YinpanSessionLayout() {
  return <YinpanSessionProvider><Outlet /></YinpanSessionProvider>;
}

function MeihuaSessionLayout() {
  return <MeihuaSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入梅花学…</div>}><Outlet /></Suspense></MeihuaSessionProvider>;
}

function LuojiSessionLayout() {
  return <LuojiSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入逻辑学…</div>}><Outlet /></Suspense></LuojiSessionProvider>;
}

function XingxiangSessionLayout() {
  return <XingxiangSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入星像学…</div>}><Outlet /></Suspense></XingxiangSessionProvider>;
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/paipan" element={<PaipanMenuPage />} />
        <Route element={<BaziSessionLayout />}>
          <Route path="/paipan/shengping-zishi" element={<BaziFormPage />} />
          <Route
            path="/paipan/shengping-zishi/result"
            element={<BaziResultPage />}
          />
        </Route>
        <Route element={<DunjiaSessionLayout />}>
          <Route path="/paipan/dunjia" element={<DunjiaFormPage />} />
          <Route path="/paipan/dunjia/result" element={<DunjiaResultPage />} />
        </Route>
        <Route element={<JueceSessionLayout />}>
          <Route path="/paipan/juece" element={<JueceFormPage />} />
          <Route path="/paipan/juece/result" element={<JueceResultPage />} />
        </Route>
        <Route element={<YinpanSessionLayout />}>
          <Route path="/paipan/yinpan-juece" element={<YinpanFormPage />} />
          <Route
            path="/paipan/yinpan-juece/result"
            element={<YinpanResultPage />}
          />
        </Route>
        <Route element={<MeihuaSessionLayout />}>
          <Route path="/paipan/meihua" element={<MeihuaFormPage />} />
          <Route path="/paipan/meihua/result" element={<MeihuaResultPage />} />
        </Route>
        <Route element={<LuojiSessionLayout />}>
          <Route path="/paipan/luoji" element={<LuojiFormPage />} />
          <Route path="/paipan/luoji/result" element={<LuojiResultPage />} />
        </Route>
        <Route element={<XingxiangSessionLayout />}>
          <Route path="/paipan/xingxiang" element={<XingxiangFormPage />} />
          <Route path="/paipan/xingxiang/result" element={<XingxiangResultPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
