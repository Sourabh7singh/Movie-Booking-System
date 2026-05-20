import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "../services/socket";

const DEMO_SHOWING_ID = "demo-showing";

/**
 * useSeatLock — manages the full real-time seat state for a showing.
 *
 * - Joins the socket room for showingId
 * - Listens to seats:snapshot, seats:locked, seats:released, seats:booked
 * - Provides `selectSeat` / `deselectSeat` (toggle local selection)
 * - Provides `lockSelected` to emit lock:seats for selected seats
 * - Tracks `myLockedSeats` and their `expiresAt` timestamp
 */
export function useSeatLock(showingId, token) {
  // seats from server: { [seatLabel]: { lockStatus, type, ... } }
  const [seats, setSeats] = useState({});
  // seats the current user has SELECTED (pre-lock, waiting in UI)
  const [selectedSeats, setSelectedSeats] = useState([]);
  // seats the current user has LOCKED (confirmed by server)
  const [myLockedSeats, setMyLockedSeats] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [lockError, setLockError] = useState(null);

  const socketRef = useRef(null);
  const myUserKey = useRef(null); // userId as seen by server (we learn it from events)

  useEffect(() => {
    if (!showingId) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    function applySnapshot(data) {
      if (data.yourUserId) myUserKey.current = data.yourUserId;
      const map = {};
      for (const seat of data.seats || []) {
        map[seat.seatLabel] = seat;
      }
      setSeats(map);
    }

    function applyLocked({ seatLabels, lockedBy, expiresAt: exp }) {
      const lockedByMe = lockedBy === myUserKey.current;
      setSeats((prev) => {
        const next = { ...prev };
        for (const label of seatLabels) {
          next[label] = {
            ...(next[label] || {}),
            lockStatus: lockedByMe ? "LOCKED_BY_ME" : "LOCKED_BY_OTHER",
            lockedBy,
          };
        }
        return next;
      });
      if (lockedByMe) {
        setMyLockedSeats(seatLabels);
        setExpiresAt(exp);
        setSelectedSeats([]);
      }
    }

    function applyReleased({ seatLabels }) {
      setSeats((prev) => {
        const next = { ...prev };
        for (const label of seatLabels) {
          if (next[label]) next[label] = { ...next[label], lockStatus: "AVAILABLE", lockedBy: null };
        }
        return next;
      });
      setMyLockedSeats((cur) => cur.filter((s) => !seatLabels.includes(s)));
    }

    function applyBooked({ seatLabels }) {
      setSeats((prev) => {
        const next = { ...prev };
        for (const label of seatLabels) {
          if (next[label]) next[label] = { ...next[label], lockStatus: "BOOKED", status: "BOOKED" };
        }
        return next;
      });
      setMyLockedSeats((cur) => cur.filter((s) => !seatLabels.includes(s)));
    }

    function onLockFailed({ seatLabels, reason }) {
      setLockError(reason || "Could not lock seats");
      setSelectedSeats([]);
    }

    socket.on("seats:snapshot",    applySnapshot);
    socket.on("seats:locked",      applyLocked);
    socket.on("seats:released",    applyReleased);
    socket.on("seats:booked",      applyBooked);
    socket.on("seats:lock_failed", onLockFailed);

    // Join the room once connected
    function joinRoom() {
      socket.emit("join:showing", { showingId });
    }

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.off("seats:snapshot",    applySnapshot);
      socket.off("seats:locked",      applyLocked);
      socket.off("seats:released",    applyReleased);
      socket.off("seats:booked",      applyBooked);
      socket.off("seats:lock_failed", onLockFailed);
      socket.off("connect",           joinRoom);
    };
  }, [showingId, token]);

  /** Toggle a seat in/out of local selection (before locking) */
  const toggleSeat = useCallback((seatLabel) => {
    setSelectedSeats((cur) =>
      cur.includes(seatLabel)
        ? cur.filter((s) => s !== seatLabel)
        : [...cur, seatLabel]
    );
    setLockError(null);
  }, []);

  /** Emit lock:seats for the current selection */
  const lockSelected = useCallback((bookingId = `temp-${Date.now()}`) => {
    if (selectedSeats.length === 0) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("lock:seats", { showingId, seatLabels: selectedSeats, bookingId });
  }, [showingId, selectedSeats]);

  /** Release specific seats */
  const releaseSeats = useCallback((seatLabels) => {
    socketRef.current?.emit("release:seats", { showingId, seatLabels });
  }, [showingId]);

  return {
    seats,
    selectedSeats,
    myLockedSeats,
    expiresAt,
    lockError,
    toggleSeat,
    lockSelected,
    releaseSeats,
    clearError: () => setLockError(null),
  };
}
