import React from "react";

const SEAT_TYPE_LABEL = { RECLINER: "♦", PREMIUM: "★", STANDARD: "" };

/**
 * Individual seat button.
 * lockStatus: AVAILABLE | LOCKED_BY_ME | LOCKED_BY_OTHER | BOOKED
 */
export default function Seat({ seatLabel, lockStatus = "AVAILABLE", type = "STANDARD", selected, onClick }) {
  const isClickable = (lockStatus === "AVAILABLE" || lockStatus === "LOCKED_BY_ME") && onClick;
  const isSelected  = selected && lockStatus === "AVAILABLE";

  let cls = "seat-btn ";
  if (lockStatus === "BOOKED")          cls += "booked";
  else if (lockStatus === "LOCKED_BY_OTHER") cls += "locked";
  else if (lockStatus === "LOCKED_BY_ME")    cls += "mine";
  else if (isSelected)                  cls += "mine"; // selected looks like "mine"
  else                                  cls += "available";

  const tooltip =
    lockStatus === "BOOKED"           ? "Seat already booked" :
    lockStatus === "LOCKED_BY_OTHER"  ? "Reserved by someone else" :
    lockStatus === "LOCKED_BY_ME"     ? "Your seat (locked)" :
    isSelected                        ? "Selected — click to deselect" :
    "Click to select";

  return (
    <button
      className={cls}
      disabled={!isClickable}
      onClick={onClick}
      title={tooltip}
      aria-label={`Seat ${seatLabel} — ${tooltip}`}
      style={isSelected && lockStatus === "AVAILABLE" ? {
        background: "var(--blue-dim)",
        borderColor: "var(--blue)",
        color: "var(--blue)",
      } : undefined}
    >
      {SEAT_TYPE_LABEL[type]}{seatLabel}
    </button>
  );
}
