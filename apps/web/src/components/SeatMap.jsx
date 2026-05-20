import React, { useMemo } from "react";
import Seat from "./Seat";

/**
 * SeatMap
 * Renders the full seat grid from a `seats` object (seatLabel → seat data).
 * Falls back to a demo grid if seats is empty (DB not seeded yet).
 */
export default function SeatMap({ seats = {}, selectedSeats = [], myLockedSeats = [], onSeatClick }) {
  // Derive rows from seat data, or fall back to demo
  const { rows, cols } = useMemo(() => {
    const seatList = Object.values(seats);
    if (seatList.length === 0) {
      return { rows: ["A","B","C","D","E","F"], cols: [1,2,3,4,5,6,7,8,9,10] };
    }
    const rowSet = [...new Set(seatList.map((s) => s.row))].sort();
    const colSet = [...new Set(seatList.map((s) => s.col))].sort((a, b) => a - b);
    return { rows: rowSet, cols: colSet };
  }, [seats]);

  // Gap in the middle of each row (aisle after col 3/4 depending on width)
  const aisleAfter = Math.floor(cols.length / 2) - 1;

  return (
    <div>
      {/* Screen */}
      <div className="screen-wrap">
        <div className="screen-bar" />
        <div className="screen-label">Screen — All eyes this way</div>
      </div>

      {/* Seat grid */}
      <div className="seat-map-wrap">
        {rows.map((row) => (
          <div key={row} className="seat-row">
            <div className="seat-row-label">{row}</div>

            {cols.map((col, colIdx) => {
              const label = `${row}${col}`;
              const seat  = seats[label];
              const lockStatus = seat?.lockStatus ?? "AVAILABLE";
              const type       = seat?.type ?? "STANDARD";
              const isSelected = selectedSeats.includes(label);

              return (
                <React.Fragment key={label}>
                  {/* Aisle gap */}
                  {colIdx === aisleAfter + 1 && (
                    <div style={{ width: 16, flexShrink: 0 }} />
                  )}
                  <Seat
                    seatLabel={label}
                    lockStatus={lockStatus}
                    type={type}
                    selected={isSelected}
                    onClick={
                      lockStatus === "AVAILABLE" || isSelected
                        ? () => onSeatClick?.(label)
                        : undefined
                    }
                  />
                </React.Fragment>
              );
            })}

            <div className="seat-row-label" />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="seat-legend">
        {[
          { cls: "available", label: "Available",      bg: "var(--green-dim)",  border: "var(--green)" },
          { cls: "mine",      label: "Selected / Mine", bg: "var(--blue-dim)",   border: "var(--blue)" },
          { cls: "locked",    label: "Reserved",        bg: "var(--amber-dim)",  border: "var(--amber)" },
          { cls: "booked",    label: "Booked",          bg: "var(--red-dim)",    border: "var(--red)" },
        ].map(({ cls, label, bg, border }) => (
          <div key={cls} className="legend-item">
            <div className="legend-dot" style={{ background: bg, borderColor: border }} />
            {label}
          </div>
        ))}
        <div className="legend-item"><span style={{ color: "var(--gold)" }}>♦</span> Recliner</div>
        <div className="legend-item"><span style={{ color: "var(--accent)" }}>★</span> Premium</div>
      </div>
    </div>
  );
}
