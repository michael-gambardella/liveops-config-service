# LiveOps Config Service

A backend API for managing live events, configuration versions, and audit logs for mobile games. Built with TypeScript, Express, and PostgreSQL.

## Overview

This service powers LiveOps workflows — developers create events, attach versioned JSON configs, and publish them safely with full audit history and rollback support.

### Config lifecycle

```
Event (draft) → Event (active)
     ↓
Config v1 (draft) → Config v1 (published)
     ↓                      ↓
Config v2 (draft) → Config v2 (published)   Config v1 (rolled_back)
```

Every state transition is recorded in the audit log with the actor and a before/after snapshot.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Database | PostgreSQL (via `pg`) |
| Validation | Zod |
| Testing | Jest + Supertest |
| Local DB | Docker Compose |

---

## Project structure

```
liveops-config-service/
├── src/
│   ├── db/
│   │   ├── migrations/         # SQL migration files (run in order)
│   │   ├── queries/            # Raw SQL queries, one file per entity
│   │   └── client.ts           # pg Pool setup
│   ├── middleware/
│   │   ├── errorHandler.ts     # Global Express error handler + createError()
│   │   ├── requestLogger.ts    # Structured JSON request logging
│   │   └── validateBody.ts     # Zod schema validation middleware
│   ├── routes/                 # HTTP layer — parse request, call service, send response
│   ├── services/               # Business logic — versioning, status rules, audit writes
│   ├── schemas/                # Zod schemas for request validation
│   ├── types/                  # Shared TypeScript interfaces
│   └── app.ts                  # Express app setup (no listen)
├── scripts/
│   └── migrate.ts              # Migration runner
├── tests/                      # Jest + Supertest route tests (DB layer mocked)
├── openapi.yaml                # Full OpenAPI 3.0 spec
├── docker-compose.yml          # Local Postgres
└── server.ts                   # Entry point
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Postgres)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` match the Docker Compose Postgres config, so no changes are needed for local development.

### 3. Start Postgres

```bash
docker-compose up -d
```

Postgres will be available at `localhost:5432`. The first startup creates a persistent volume so your data survives restarts.

### 4. Run migrations

```bash
npm run migrate
```

This applies any unapplied SQL files from `src/db/migrations/` in order and tracks them in a `migrations` table.

### 5. Start the dev server

```bash
npm run dev
```

The server starts at `http://localhost:3000`. It hot-reloads on file changes via `nodemon`.

---

## API

The full spec is in [openapi.yaml](./openapi.yaml). A quick reference:

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health check |

### Events

| Method | Path | Description |
|---|---|---|
| GET | `/api/events` | List events (optional `?status=draft\|active\|archived`) |
| POST | `/api/events` | Create an event |
| GET | `/api/events/:id` | Get event by ID |
| PATCH | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Archive an event (soft delete) |

### Configs

| Method | Path | Description |
|---|---|---|
| GET | `/api/configs?event_id=` | List config versions for an event |
| POST | `/api/configs` | Create a new config version (always starts as draft) |
| GET | `/api/configs/:id` | Get config by ID |
| POST | `/api/configs/:id/publish` | Publish a draft config |
| POST | `/api/configs/:id/rollback` | Roll back a published config |

### Audit

| Method | Path | Description |
|---|---|---|
| GET | `/api/audit` | List audit entries (filter by `entity_type`, `entity_id`, `limit`, `offset`) |

### Actor header

Pass `x-actor` on any mutating request to identify who made the change. This value is written to the audit log.

```
x-actor: alice
```

---

## Example requests

**Create an event:**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "x-actor: alice" \
  -d '{
    "name": "Summer Festival",
    "description": "Double XP weekend",
    "start_time": "2024-06-01T00:00:00Z",
    "end_time": "2024-06-03T23:59:59Z"
  }'
```

**Create a config version:**
```bash
curl -X POST http://localhost:3000/api/configs \
  -H "Content-Type: application/json" \
  -H "x-actor: alice" \
  -d '{
    "event_id": "<event-id>",
    "payload": {
      "rewardType": "gem",
      "rewardAmount": 100,
      "durationHours": 48
    }
  }'
```

**Publish it:**
```bash
curl -X POST http://localhost:3000/api/configs/<config-id>/publish \
  -H "Content-Type: application/json" \
  -d '{ "published_by": "alice" }'
```

**Roll it back:**
```bash
curl -X POST http://localhost:3000/api/configs/<config-id>/rollback \
  -H "x-actor: alice"
```

**View audit trail:**
```bash
curl "http://localhost:3000/api/audit?entity_type=config&entity_id=<config-id>"
```

---

## Testing

Tests run against a mocked DB layer — no database required.

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests cover: happy paths, 404s, 409 conflict guards, validation rejections, and audit log assertions.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run migrate` | Apply pending database migrations |
