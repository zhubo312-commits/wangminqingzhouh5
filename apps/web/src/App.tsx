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
import { ShanxiangSessionProvider } from "./features/paipan/shanxiang/ShanxiangSession";
import { XingxiangSessionProvider } from "./features/paipan/xingxiang/XingxiangSession";
import { ShuziGuilvSessionProvider } from "./features/paipan/shuzi/ShuziGuilvSession";
import { XuankongFeixingSessionProvider } from "./features/paipan/xuankong/XuankongFeixingSession";
import { XingmingSessionProvider } from "./features/paipan/xingming/XingmingSession";

const MeihuaFormPage = lazy(() => import("./features/paipan/meihua/MeihuaFormPage").then((module) => ({ default: module.MeihuaFormPage })));
const MeihuaResultPage = lazy(() => import("./features/paipan/meihua/MeihuaResultPage").then((module) => ({ default: module.MeihuaResultPage })));
const LuojiFormPage = lazy(() => import("./features/paipan/luoji/LuojiFormPage").then((module) => ({ default: module.LuojiFormPage })));
const LuojiResultPage = lazy(() => import("./features/paipan/luoji/LuojiResultPage").then((module) => ({ default: module.LuojiResultPage })));
const ShanxiangFormPage = lazy(() => import("./features/paipan/shanxiang/ShanxiangFormPage").then((module) => ({ default: module.ShanxiangFormPage })));
const ShanxiangResultPage = lazy(() => import("./features/paipan/shanxiang/ShanxiangResultPage").then((module) => ({ default: module.ShanxiangResultPage })));
const XingxiangFormPage = lazy(() => import("./features/paipan/xingxiang/XingxiangFormPage").then((module) => ({ default: module.XingxiangFormPage })));
const XingxiangResultPage = lazy(() => import("./features/paipan/xingxiang/XingxiangResultPage").then((module) => ({ default: module.XingxiangResultPage })));
const ShuziGuilvFormPage = lazy(() => import("./features/paipan/shuzi/ShuziGuilvFormPage").then((module) => ({ default: module.ShuziGuilvFormPage })));
const ShuziGuilvResultPage = lazy(() => import("./features/paipan/shuzi/ShuziGuilvResultPage").then((module) => ({ default: module.ShuziGuilvResultPage })));
const XuankongFeixingFormPage = lazy(() => import("./features/paipan/xuankong/XuankongFeixingFormPage").then((module) => ({ default: module.XuankongFeixingFormPage })));
const XuankongFeixingResultPage = lazy(() => import("./features/paipan/xuankong/XuankongFeixingResultPage").then((module) => ({ default: module.XuankongFeixingResultPage })));
const XingmingFormPage = lazy(() => import("./features/paipan/xingming/XingmingFormPage").then((module) => ({ default: module.XingmingFormPage })));
const XingmingResultPage = lazy(() => import("./features/paipan/xingming/XingmingResultPage").then((module) => ({ default: module.XingmingResultPage })));

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

function ShanxiangSessionLayout() {
  return <ShanxiangSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入山向决策…</div>}><Outlet /></Suspense></ShanxiangSessionProvider>;
}

function XingxiangSessionLayout() {
  return <XingxiangSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入星像学…</div>}><Outlet /></Suspense></XingxiangSessionProvider>;
}

function ShuziGuilvSessionLayout() {
  return <ShuziGuilvSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入数字规律…</div>}><Outlet /></Suspense></ShuziGuilvSessionProvider>;
}

function XuankongFeixingSessionLayout() {
  return <XuankongFeixingSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入玄空飞星…</div>}><Outlet /></Suspense></XuankongFeixingSessionProvider>;
}

function XingmingSessionLayout() {
  return <XingmingSessionProvider><Suspense fallback={<div className="route-loading" role="status">正在载入姓名学…</div>}><Outlet /></Suspense></XingmingSessionProvider>;
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
        <Route element={<ShanxiangSessionLayout />}>
          <Route path="/paipan/shanxiang-juece" element={<ShanxiangFormPage />} />
          <Route path="/paipan/shanxiang-juece/result" element={<ShanxiangResultPage />} />
        </Route>
        <Route element={<XingxiangSessionLayout />}>
          <Route path="/paipan/xingxiang" element={<XingxiangFormPage />} />
          <Route path="/paipan/xingxiang/result" element={<XingxiangResultPage />} />
        </Route>
        <Route element={<ShuziGuilvSessionLayout />}>
          <Route path="/paipan/shuzi-guilv" element={<ShuziGuilvFormPage />} />
          <Route path="/paipan/shuzi-guilv/result" element={<ShuziGuilvResultPage />} />
        </Route>
        <Route element={<XuankongFeixingSessionLayout />}>
          <Route path="/paipan/xuankong-feixing" element={<XuankongFeixingFormPage />} />
          <Route path="/paipan/xuankong-feixing/result" element={<XuankongFeixingResultPage />} />
        </Route>
        <Route element={<XingmingSessionLayout />}>
          <Route path="/paipan/xingming" element={<XingmingFormPage />} />
          <Route path="/paipan/xingming/result" element={<XingmingResultPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
