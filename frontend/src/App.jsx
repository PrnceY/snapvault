import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RequireRole from "./RequireRole.jsx";

// Each area is loaded lazily so only its own stylesheet is loaded.
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const ShopApp = lazy(() => import("./ShopApp.jsx"));
const CustomerApp = lazy(() => import("./pages/CustomerApp.jsx"));
const SuperAdminLogin = lazy(() => import("./pages/SuperAdminLogin.jsx"));
const SuperAdminApp = lazy(() => import("./pages/SuperAdminApp.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<RequireRole role="shop"><ShopApp /></RequireRole>} />
          <Route path="/customer" element={<RequireRole role="customer"><CustomerApp /></RequireRole>} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/superadmin" element={<RequireRole role="superadmin" redirect="/superadmin/login"><SuperAdminApp /></RequireRole>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
