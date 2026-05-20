import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { booking, showing, seatLabels = [], guest } = location.state || {};

  const totalPrice = showing ? seatLabels.length * showing.price : 0;
  const bookingId  = booking?.id ?? "GUEST-" + Date.now().toString(36).toUpperCase();

  return (
    <div className="page-wrapper fade-in" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div className="card" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        {/* Big checkmark */}
        <div className="confirm-icon">✅</div>

        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
          Booking Confirmed!
        </h1>
        <p className="text-muted" style={{ marginBottom: 32 }}>
          Your seats are booked. Enjoy the show! 🍿
        </p>

        {/* Booking card */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          textAlign: "left",
        }}>
          <div className="flex justify-between" style={{ marginBottom: 12 }}>
            <span className="text-muted text-sm">Booking ID</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--accent)" }}>
              {bookingId.slice(0, 12)}…
            </span>
          </div>

          {showing && (
            <>
              <div className="flex justify-between" style={{ marginBottom: 12 }}>
                <span className="text-muted text-sm">Movie</span>
                <span className="font-semibold">{showing.movie?.title}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 12 }}>
                <span className="text-muted text-sm">Theater</span>
                <span>{showing.theater?.name}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 12 }}>
                <span className="text-muted text-sm">Showtime</span>
                <span>{new Date(showing.startsAt).toLocaleString("en-IN", {
                  dateStyle: "medium", timeStyle: "short"
                })}</span>
              </div>
            </>
          )}

          <div className="divider" />

          <div className="flex justify-between" style={{ marginBottom: 8 }}>
            <span className="text-muted text-sm">Seats</span>
            <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
              {seatLabels.map((s) => (
                <span key={s} className="badge badge-green">{s}</span>
              ))}
            </div>
          </div>

          {showing && (
            <div className="flex justify-between">
              <span className="text-muted text-sm">Total Paid</span>
              <span className="font-bold text-green">₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>
          )}

          {guest && (
            <div className="badge badge-amber" style={{ marginTop: 16, display: "inline-flex" }}>
              ⚠️ Guest booking — create an account to see history
            </div>
          )}
        </div>

        <div className="flex gap-3" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
