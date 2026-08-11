import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./features/home/HomePage";
import { PaipanMenuPage } from "./features/paipan/PaipanMenuPage";
import { BaziFormPage } from "./features/paipan/bazi/BaziFormPage";
import { BaziResultPage } from "./features/paipan/bazi/BaziResultPage";
import { BaziSessionProvider } from "./features/paipan/bazi/BaziSession";

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <BaziSessionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/paipan" element={<PaipanMenuPage />} />
          <Route path="/paipan/shengping-zishi" element={<BaziFormPage />} />
          <Route
            path="/paipan/shengping-zishi/result"
            element={<BaziResultPage />}
          />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BaziSessionProvider>
    </BrowserRouter>
  );
}
