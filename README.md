# School Admission System

A full-stack **first-come, first-served** online school admission system built for the Onnorokom Projukti Limited take-home assignment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | C# / .NET 8, PostgreSQL |
| **Containerization** | Docker, Docker Compose |

## Quick Start — Docker

```bash
# Clone the repository
git clone <repo-url>
cd school-admission-system

# Start everything (PostgreSQL + Backend + Frontend)
docker compose up --build

# Access the app
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
```

> **No other dependencies** are needed — just Docker.

## Quick Start — Development

### Frontend (React / Next.js)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Set the backend URL in `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend (.NET 8)

```bash
cd backend
dotnet run
# → http://localhost:8080
```

Set the database connection string via environment variable:
```
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=school_admission;Username=sa_user;Password=sa_password
```

## Running Tests

### Backend Tests
```bash
cd backend
dotnet test
```

## Project Structure

```
├── docker-compose.yml        # Orchestrates all services
├── frontend/                 # Next.js + TypeScript + Tailwind + shadcn/ui
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   └── lib/              # API client, types, utilities
│   └── .env.local
├── backend/                  # .NET 8 Web API (to be added)
│   └── Dockerfile
├── ASSUMPTIONS.md
├── AI_USAGE.md
└── README.md
```

## Features

- **Class Management**: Admins create classes with shift names and seat capacities
- **First-Come, First-Served**: Students apply for classes; seats are held temporarily
- **Live Countdown**: Application hold timer counts down in real-time
- **Auto-Refresh**: Seat counts update every 5 seconds without page reload
- **Auto-Expiry**: When a hold expires, the UI updates immediately (no manual refresh)
- **Error Handling**: User-friendly error messages for all failure scenarios
- **Persistent Identity**: Birth Registration Number persisted in localStorage
- **Docker Ready**: Full Docker Compose setup with PostgreSQL, backend, and frontend

