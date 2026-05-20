import React from "react";
import { api } from "../services/api";

export default function CheckoutModal({ socket, showingId }) {
  async function createMockBooking() {
    await api("/api/payments/intent", { method: "POST", body: JSON.stringify({ bookingId: "mock-booking" }) });
    socket?.emit("lock:seats", { showingId, seatLabels: ["A1", "A2"], bookingId: "mock-booking" });
  }

  return (
    <button
      onClick={createMockBooking}
      style={{
        padding: "12px 18px",
        borderRadius: 12,
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer"
      }}
    >
      Mock Checkout
    </button>
  );
}
