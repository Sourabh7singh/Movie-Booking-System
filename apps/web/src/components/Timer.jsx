import React, { useEffect, useMemo, useState } from "react";

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Timer — counts down from expiresAt.
 * onExpire is called when the countdown reaches 0.
 */
export default function Timer({ expiresAt, onExpire }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const secondsLeft = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  }, [expiresAt, now]);

  useEffect(() => {
    if (expiresAt && secondsLeft === 0) onExpire?.();
  }, [secondsLeft, expiresAt, onExpire]);

  if (!expiresAt) return null;

  const urgent = secondsLeft <= 30;

  return (
    <div className={`timer-pill ${urgent ? "urgent" : ""}`}>
      <span>⏱</span>
      <span className="timer-digit">{formatTime(secondsLeft)}</span>
      <span style={{ fontSize: "0.75rem", color: urgent ? "inherit" : "var(--text-2)" }}>
        seat hold
      </span>
    </div>
  );
}
