import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (form.password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    try {
      await register(form.email, form.password, form.name);
      toast.success("Account created! Welcome 🎬");
      navigate("/");
    } catch (error) {
      setErr(error.message || "Registration failed");
    }
  }

  return (
    <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", paddingTop: 64 }}>
      <div className="card" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Create account</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>Join CineX to book your seats</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Your name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
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
              placeholder="Min 6 characters"
              required
              minLength={6}
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
