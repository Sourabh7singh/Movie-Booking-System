import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error) {
      setErr(error.message || "Login failed");
    }
  }

  return (
    <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", paddingTop: 64 }}>
      <div className="card" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Welcome back</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>Sign in to your CineX account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="alice@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {err && (
            <div className="badge badge-red" style={{ padding: "8px 12px", borderRadius: 8, fontSize: "0.82rem" }}>
              ❌ {err}
            </div>
          )}

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm text-muted" style={{ marginTop: 20 }}>
          Demo: <code style={{ color: "var(--accent)" }}>alice@example.com</code> / <code style={{ color: "var(--accent)" }}>password123</code>
        </div>

        <div className="divider" />

        <p className="text-center text-sm text-muted">
          No account?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  );
}
