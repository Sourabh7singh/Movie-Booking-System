# CineX - Movie Theater Seat Booking System

CineX is a production-ready, real-time movie theater seat booking system. It handles concurrent user seat selections, temporary locking with countdown timers, and mock payment confirmation.

## Features
- **Real-time Seat Selection**: Powered by Socket.IO, users can see when seats are selected by others in real-time.
- **Reliable Seat Locking**: Uses Redis and BullMQ to temporarily lock seats (e.g., for 3 minutes) while a user completes checkout. If checkout is not completed in time, the lock expires and seats become available again.
- **End-to-End Booking Flow**: Browse showings, select seats, review booking, and confirm with a mock payment.
- **Modern Tech Stack**: React frontend (Vite), Node.js/Express API, PostgreSQL database (Prisma ORM), and Redis for caching/queues.

## Project Structure
- `apps/api` — Backend REST API and Socket.IO server
- `apps/web` — React frontend UI
- `apps/api/prisma/schema.prisma` — Database schema

## Prerequisites
- Docker and Docker Compose
- Node.js (v18+)

## Getting Started

1. **Environment Setup**:
   Copy `.env.example` to `.env` in the root and in the `apps/api`, `apps/web` directories (if applicable).
   
2. **Start Infrastructure (Database & Redis)**:
   ```bash
   docker-compose up -d
   ```

3. **Install Dependencies**:
   ```bash
   cd apps/api && npm install
   cd ../web && npm install
   ```

4. **Database Migration & Seeding**:
   ```bash
   cd apps/api
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Run the Application**:
   Start the API server:
   ```bash
   cd apps/api
   npm run dev
   ```
   
   Start the frontend server (in a new terminal):
   ```bash
   cd apps/web
   npm run dev
   ```

6. Open `http://localhost:5173` to view the CineX app.