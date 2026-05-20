import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatMap from "../components/SeatMap";
import Timer from "../components/Timer";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useSeatLock } from "../hooks/useSeatLock";
import { showingsApi, bookingsApi } from "../services/api";

export default function SeatSelectionPage() {
  const { showingId } = useParams();
  const navigate      = useNavigate();
  const { user, token } = useAuth();
  const toast         = useToast();

  const [showing, setShowing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [booking, setBooking]   = useState(null);   // confirmed booking
  const [locking, setLocking]   = useState(false);  // waiting for lock response

  const {
    seats,
    selectedSeats,
    myLockedSeats,
    expiresAt,
    lockError,
    toggleSeat,
    lockSelected,
    releaseSeats,
    clearError,
  } = useSeatLock(showingId, token);

  // Load showing details
  useEffect(() => {
    if (!showingId) return;
    setLoading(true);
    showingsApi.getById(showingId)
      .then((res) => setShowing(res.data))
      .catch(() => toast.error("Could not load showing details"))
      .finally(() => setLoading(false));
  }, [showingId]);

  // Show lock errors as toasts
  useEffect(() => {
    if (lockError) {
      toast.error(lockError);
      clearError();
    }
  }, [lockError]);

  // Lock selected seats (emit via socket for real-time)
  function handleLockSeats() {
    if (selectedSeats.length === 0) return;
    setLocking(true);
    lockSelected();
    // Server will respond with seats:locked event which updates the state
    setTimeout(() => setLocking(false), 2000);
  }

  // Proceed to checkout after locking
  function handleProceedToCheckout() {
    if (myLockedSeats.length === 0) {
      toast.warning("Please lock your seats first");
      return;
    }
    navigate(`/checkout/${showingId}`, {
      state: { showingId, seatLabels: myLockedSeats, expiresAt, showing },
    });
  }

  // Timer expired — release and redirect
  function handleTimerExpire() {
    toast.warning("Your seat hold expired! Please select again.");
    navigate(`/seat-selection/${showingId}`);
  }

  const totalPrice = showing
    ? (myLockedSeats.length || selectedSeats.length) * showing.price
    : 0;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-muted">Loading seat map…</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Page Header */}
      <div className="page-hero" style={{ paddingBottom: 16 }}>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>
            {showing?.movie?.title ?? "Select Seats"}
          </h1>
          <div className="flex gap-3 items-center" style={{ flexWrap: "wrap" }}>
            {showing && (
              <>
                <span className="text-muted text-sm">🏛 {showing.theater?.name}</span>
                <span className="text-muted text-sm">
                  🕐 {new Date(showing.startsAt).toLocaleString("en-IN", {
                    dateStyle: "medium", timeStyle: "short"
                  })}
                </span>
                <span className="badge badge-accent">₹{showing.price} / seat</span>
              </>
            )}
          </div>
        </div>
        {/* Timer pill in header */}
        {expiresAt && (
          <Timer expiresAt={expiresAt} onExpire={handleTimerExpire} />
        )}
      </div>

      {/* Seat Map Card */}
      <div className="card fade-in">
        <SeatMap
          seats={seats}
          selectedSeats={selectedSeats}
          myLockedSeats={myLockedSeats}
          onSeatClick={toggleSeat}
        />
      </div>

      {/* Selection Bar — fixed at bottom */}
      {(selectedSeats.length > 0 || myLockedSeats.length > 0) && (
        <div className="selection-bar">
          <div style={{ flex: 1 }}>
            {myLockedSeats.length > 0 ? (
              <>
                <div className="text-xs text-muted" style={{ marginBottom: 6 }}>
                  🔒 Seats held for you:
                </div>
                <div className="selection-bar-seats">
                  {myLockedSeats.map((s) => (
                    <span key={s} className="selection-seat-chip">{s}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-muted" style={{ marginBottom: 6 }}>
                  Selected ({selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""}):
                </div>
                <div className="selection-bar-seats">
                  {selectedSeats.map((s) => (
                    <span key={s} className="selection-seat-chip">{s}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-col" style={{ alignItems: "flex-end", gap: 8 }}>
            {showing && (
              <div className="font-bold" style={{ fontSize: "1.1rem" }}>
                ₹{totalPrice.toLocaleString("en-IN")}
              </div>
            )}

            {myLockedSeats.length > 0 ? (
              <button className="btn btn-primary" onClick={handleProceedToCheckout}>
                Proceed to Checkout →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleLockSeats}
                disabled={locking || selectedSeats.length === 0}
              >
                {locking ? "Locking…" : `🔒 Hold ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
