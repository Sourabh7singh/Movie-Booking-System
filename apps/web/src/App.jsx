import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SeatSelectionPage from "./pages/SeatSelectionPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./contexts/AuthContext";
import "./styles/globals.css";

// Inner layout that has access to auth context
function AppLayout() {
  const { token } = useAuth();
  const { connected } = useSocket(token);

  return (
    <>
      <Navbar connected={connected} />
      <main>
        <Routes>
          <Route path="/"                        element={<HomePage />} />
          <Route path="/seat-selection/:showingId" element={<SeatSelectionPage />} />
          <Route path="/checkout/:showingId"     element={<CheckoutPage />} />
          <Route path="/confirmation"            element={<ConfirmationPage />} />
          <Route path="/login"                   element={<LoginPage />} />
          <Route path="/register"                element={<RegisterPage />} />
          <Route path="*"                        element={
            <div className="loading-center">
              <p style={{ fontSize: "3rem" }}>404</p>
              <p className="text-muted">Page not found</p>
            </div>
          } />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
