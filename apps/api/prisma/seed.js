import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice Kumar", passwordHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob Sharma", passwordHash },
  });

  console.log(`✅ Users: ${alice.name}, ${bob.name}`);

  // ── Movies ─────────────────────────────────────────────────────────────────
  const moviesData = [
    {
      title: "Interstellar Odyssey",
      duration: 169,
      poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
    },
    {
      title: "Neon Requiem",
      duration: 142,
      poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80",
    },
    {
      title: "The Last Algorithm",
      duration: 118,
      poster: "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=400&q=80",
    },
    {
      title: "Crimson Horizon",
      duration: 135,
      poster: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    },
    {
      title: "Echo Protocol",
      duration: 125,
      poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
    },
  ];

  const movies = [];
  for (const m of moviesData) {
    const movie = await prisma.movie.upsert({
      where: { id: m.title }, // won't match, will create
      update: {},
      create: m,
    }).catch(() => prisma.movie.findFirst({ where: { title: m.title } }));
    movies.push(movie);
  }

  console.log(`✅ Movies: ${movies.map((m) => m.title).join(", ")}`);

  // ── Theaters ───────────────────────────────────────────────────────────────
  const theatersData = [
    { name: "Screen 1 — IMAX", rows: 8, cols: 12 },
    { name: "Screen 2 — Standard", rows: 6, cols: 10 },
    { name: "Screen 3 — VIP", rows: 4, cols: 8 },
  ];

  const theaters = [];
  for (const t of theatersData) {
    const theater = await prisma.theater.findFirst({ where: { name: t.name } }) ??
      await prisma.theater.create({ data: t });
    theaters.push(theater);
  }

  console.log(`✅ Theaters: ${theaters.map((t) => t.name).join(", ")}`);

  // ── Showings & Seats ───────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const showingSlots = [
    { hour: 10, minute: 0, label: "Morning" },
    { hour: 14, minute: 30, label: "Afternoon" },
    { hour: 18, minute: 0, label: "Evening" },
    { hour: 21, minute: 30, label: "Night" },
  ];

  // Create showings: 2 movies × 2 theaters × today+tomorrow × 2 slots
  const showingPairs = [
    { movie: movies[0], theater: theaters[0], price: 350 },
    { movie: movies[1], theater: theaters[1], price: 280 },
    { movie: movies[2], theater: theaters[2], price: 450 },
    { movie: movies[3], theater: theaters[0], price: 300 },
    { movie: movies[4], theater: theaters[1], price: 280 },
  ];

  let totalShowings = 0;
  let totalSeats = 0;

  for (const { movie, theater, price } of showingPairs) {
    for (const day of [today, tomorrow]) {
      for (const slot of showingSlots.slice(0, 2)) {
        const startsAt = new Date(day);
        startsAt.setHours(slot.hour, slot.minute, 0, 0);

        // Skip if already exists
        const existing = await prisma.showing.findFirst({
          where: { movieId: movie.id, theaterId: theater.id, startsAt },
        });
        if (existing) continue;

        const showing = await prisma.showing.create({
          data: { movieId: movie.id, theaterId: theater.id, startsAt, price },
        });
        totalShowings++;

        // Generate seats for this showing
        const ROWS = "ABCDEFGH".slice(0, theater.rows);
        const seatTypeMap = (row, col) => {
          if (row === "A") return "RECLINER";
          if (["B", "C"].includes(row)) return "PREMIUM";
          return "STANDARD";
        };

        const seatsData = [];
        for (const row of ROWS) {
          for (let col = 1; col <= theater.cols; col++) {
            seatsData.push({
              showingId: showing.id,
              row,
              col,
              seatLabel: `${row}${col}`,
              type: seatTypeMap(row, col),
            });
          }
        }

        await prisma.seat.createMany({ data: seatsData, skipDuplicates: true });
        totalSeats += seatsData.length;
      }
    }
  }

  console.log(`✅ Showings: ${totalShowings} created, Seats: ${totalSeats} generated`);
  console.log("\n🎬 Seed complete! Test credentials:");
  console.log("   alice@example.com / password123");
  console.log("   bob@example.com   / password123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
