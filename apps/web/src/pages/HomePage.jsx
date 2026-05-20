import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showingsApi } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function MovieCard({ movie, onSelect }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="movie-card" onClick={() => onSelect(movie)}>
      {!imgError ? (
        <img
          className="movie-poster"
          src={movie.poster}
          alt={movie.title}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="movie-poster" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem",
          background: "var(--bg-elevated)"
        }}>
          🎬
        </div>
      )}
      <div className="movie-info">
        <div className="movie-title">{movie.title}</div>
        <div className="movie-meta">
          ⏱ {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [showings, setShowings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [movies, setMovies]       = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    showingsApi.list()
      .then((res) => {
        const all = res.data || [];
        setShowings(all);
        // Unique movies
        const seen = new Set();
        const unique = [];
        for (const s of all) {
          if (!seen.has(s.movie?.id)) {
            seen.add(s.movie?.id);
            unique.push(s.movie);
          }
        }
        setMovies(unique.filter(Boolean));
      })
      .catch(() => toast.error("Could not load movies"))
      .finally(() => setLoading(false));
  }, []);

  const filteredShowings = selectedMovie
    ? showings.filter((s) => s.movie?.id === selectedMovie.id)
    : [];

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p className="text-muted">Loading movies…</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "32px 0 48px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-1px", marginBottom: 12 }}>
          What's <span className="text-accent">playing</span> today?
        </h1>
        <p className="text-muted">Pick a movie and book your seats in seconds.</p>
      </div>

      {movies.length === 0 ? (
        <div className="error-state">
          <h3>No movies found</h3>
          <p>The database may not be seeded yet. Run <code>pnpm prisma:seed</code> in the api directory.</p>
        </div>
      ) : (
        <>
          <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Now Showing</h2>
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={(m) => setSelectedMovie(selectedMovie?.id === m.id ? null : m)}
              />
            ))}
          </div>

          {/* Showings panel */}
          {selectedMovie && (
            <div className="card fade-in" style={{ marginTop: 32 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700 }}>
                  Showings for <span className="text-accent">{selectedMovie.title}</span>
                </h2>
                <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }}
                  onClick={() => setSelectedMovie(null)}>
                  ✕ Close
                </button>
              </div>

              {filteredShowings.length === 0 ? (
                <p className="text-muted">No showings available.</p>
              ) : (
                <div className="flex-col gap-3">
                  {filteredShowings.map((s) => (
                    <div
                      key={s.id}
                      className="showing-card"
                      onClick={() => navigate(`/seat-selection/${s.id}`)}
                    >
                      <div>
                        <div className="font-semibold">
                          🕐 {new Date(s.startsAt).toLocaleString("en-IN", {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                        <div className="text-sm text-muted mt-2">🏛 {s.theater?.name}</div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="badge badge-gold">₹{s.price}</span>
                        <span className="badge badge-green">
                          {s._count?.seats - (s._count?.bookings ?? 0)} seats left
                        </span>
                        <span className="text-muted text-sm">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
