import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingsApi, paymentsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Timer from "../components/Timer";

export default function CheckoutPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();

  const { showingId, seatLabels = [], expiresAt, showing } = location.state || {};

  const [booking, setBooking]   = useState(null);
  const [paying, setPaying]     = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [step, setStep]         = useState("review"); // review | paying | done

  // If coming from seat selection with locked seats, create a DB booking
  useEffect(() => {
    if (!showingId || seatLabels.length === 0) return;

    if (user && !booking) {
      setCreatingBooking(true);
      // Create a real booking via API
      bookingsApi.create(showingId, seatLabels)
        .then((res) => {
          setBooking(res.data.booking);
        })
        .catch((err) => {
          toast.error(err.message || "Failed to initialize order. Please try again.");
        })
        .finally(() => {
          setCreatingBooking(false);
        });
    }
  }, [showingId, user]);

  async function handlePay() {
    setPaying(true);
    setStep("paying");
    try {
      let bookingId = booking?.id;

      if (!bookingId) {
        toast.error("No booking found. Please select seats again.");
        navigate(`/seat-selection/${showingId}`);
        return;
      }

      // Get payment intent (shows summary data)
      await paymentsApi.createIntent(bookingId);

      // Simulate a 1.5s payment processing delay
      await new Promise((r) => setTimeout(r, 1500));

      // Mock webhook to confirm the booking
      await paymentsApi.mockPay(bookingId);

      setStep("done");
      setTimeout(() => {
        navigate("/confirmation", {
          state: { booking, showing, seatLabels },
        });
      }, 800);
    } catch (err) {
      toast.error(err.message || "Payment failed");
      setStep("review");
    } finally {
      setPaying(false);
    }
  }

  function handleGuestPay() {
    // Guest mode: navigate straight to confirmation with local state
    toast.success("Booking confirmed! (Guest mode)");
    navigate("/confirmation", {
      state: { booking: null, showing, seatLabels, guest: true },
    });
  }

  const totalPrice = showing ? seatLabels.length * showing.price : 0;

  if (!showingId || seatLabels.length === 0) {
    return (
      <div className="loading-center">
        <p className="text-muted">No booking data. Please go back and select seats.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>← Home</button>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in" style={{ paddingTop: 24, paddingBottom: 64 }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost" style={{ padding: "8px 12px" }} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Checkout</h1>
        {expiresAt && (
          <div style={{ marginLeft: "auto" }}>
            <Timer expiresAt={expiresAt} onExpire={() => {
              toast.warning("Seat hold expired!");
              navigate(`/seat-selection/${showingId}`);
            }} />
          </div>
        )}
      </div>

      <div className="checkout-grid">
        {/* Order summary */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Order Summary</h2>

          {showing && (
            <div className="flex-col gap-3" style={{ marginBottom: 20 }}>
              <div className="flex justify-between">
                <span className="text-muted">Movie</span>
                <span className="font-semibold">{showing.movie?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Theater</span>
                <span>{showing.theater?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Showtime</span>
                <span>{new Date(showing.startsAt).toLocaleString("en-IN", {
                  dateStyle: "medium", timeStyle: "short"
                })}</span>
              </div>
            </div>
          )}

          <div className="divider" />

          <div className="flex-col gap-3" style={{ marginBottom: 20 }}>
            <div className="flex justify-between">
              <span className="text-muted">Seats</span>
              <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                {seatLabels.map((s) => (
                  <span key={s} className="badge badge-accent">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Price per seat</span>
              <span>₹{showing?.price ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Quantity</span>
              <span>{seatLabels.length}</span>
            </div>
          </div>

          <div className="divider" />

          <div className="flex justify-between" style={{ marginTop: 8 }}>
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg text-accent">
              ₹{totalPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Payment panel */}
        <div className="flex-col gap-4">
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Payment</h2>

            {step === "paying" ? (
              <div className="loading-center" style={{ minHeight: 120 }}>
                <div className="spinner" />
                <p className="text-muted">Processing payment…</p>
              </div>
            ) : step === "done" ? (
              <div className="text-center text-green font-bold" style={{ padding: "24px 0" }}>
                ✅ Payment confirmed!
              </div>
            ) : (
              <>
                {/* Mock card display */}
                <div style={{
                  background: "linear-gradient(135deg, var(--accent-dim), var(--accent))",
                  borderRadius: 12,
                  padding: "20px 24px",
                  marginBottom: 20,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: 16 }}>DEMO CARD</div>
                  <div style={{ fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: 3, marginBottom: 12 }}>
                    4242 4242 4242 4242
                  </div>
                  <div className="flex justify-between" style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                    <span>DEMO USER</span>
                    <span>12/28</span>
                  </div>
                  <div style={{
                    position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
                    fontSize: "2rem", opacity: 0.15
                  }}>💳</div>
                </div>

                <div className="text-xs text-muted" style={{ marginBottom: 16, textAlign: "center" }}>
                  🔒 This is a mock payment — no real charge is made
                </div>

                {user ? (
                  <button
                    className="btn btn-primary w-full btn-lg"
                    onClick={handlePay}
                    disabled={paying || creatingBooking || !booking}
                  >
                    {paying ? "Processing…" : creatingBooking ? "Creating Order…" : `Pay ₹${totalPrice.toLocaleString("en-IN")}`}
                  </button>
                ) : (
                  <div className="flex-col gap-3">
                    <button className="btn btn-primary w-full btn-lg" onClick={handleGuestPay}>
                      Continue as Guest → Pay ₹{totalPrice.toLocaleString("en-IN")}
                    </button>
                    <button className="btn btn-ghost w-full" onClick={() => navigate("/login")}>
                      Login for full booking history
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card-glass" style={{ padding: 16, textAlign: "center" }}>
            <div className="text-xs text-muted">
              Seats are held for 3 minutes while you complete payment.
              <br />After payment, your booking is permanent.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
