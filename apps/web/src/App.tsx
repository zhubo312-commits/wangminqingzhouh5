import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
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

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : import.meta.env.BASE_URL.replace(/\/$/, "");
const jueceValidationRouteEnabled =
  import.meta.env.VITE_ENABLE_JUECE_VALIDATION === "true";

function BaziSessionLayout() {
  return <BaziSessionProvider><Outlet /></BaziSessionProvider>;
}

function DunjiaSessionLayout() {
  return <DunjiaSessionProvider><Outlet /></DunjiaSessionProvider>;
}

function JueceSessionLayout() {
  return <JueceSessionProvider><Outlet /></JueceSessionProvider>;
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
        {jueceValidationRouteEnabled && (
          <Route element={<JueceSessionLayout />}>
            <Route path="/paipan/juece" element={<JueceFormPage />} />
            <Route path="/paipan/juece/result" element={<JueceResultPage />} />
          </Route>
        )}
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
