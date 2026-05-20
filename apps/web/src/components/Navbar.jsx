import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({ connected }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div
        className="navbar-logo"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <span style={{ fontSize: "1.4rem" }}>🎬</span>
        <span>Cine<span>X</span></span>
      </div>

      <div className="navbar-actions">
        <div className="conn-pill">
          <div className={`conn-dot ${connected ? "online" : ""}`} />
          {connected ? "Live" : "Offline"}
        </div>

        {user ? (
          <>
            <span className="text-sm text-muted" style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              👤 {user.name}
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}
              style={{ padding: "7px 14px", fontSize: "0.8rem" }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => navigate("/login")}
              style={{ padding: "7px 14px", fontSize: "0.8rem" }}>
              Login
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/register")}
              style={{ padding: "7px 14px", fontSize: "0.8rem" }}>
              Sign up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
