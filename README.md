# GateKeeper Service

GateKeeper is a standalone rate limiting service designed to manage and enforce rate limits for clients based on their unique identifiers or specific routes. This service can be utilized as a small SaaS solution for applications requiring rate limiting functionality.

## Features

- Health Check Endpoint
- Client registration (returns a one-time API key)
- Rate Limit Check and Set Custom Limits (protected by API key)
- Redis for rate limit counters and config; Sequelize (SQLite or PostgreSQL) for clients
- Optional Swagger API docs in non-production

---

## What to do before you push

**Minimum (recommended):** run tests locally so you don’t break CI.

1. **Start Redis and Postgres** (tests need both):
   ```bash
   docker run -d -p 6379:6379 --name redis redis:alpine
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name postgres postgres:16-alpine
   ```
   (Or use locally installed Redis and Postgres.)
2. **Install and test:**
   ```bash
   npm install
   npm test
   ```
3. If all tests pass → commit and push. GitHub Actions will run the same tests again on the server.

**Optional:** run the app locally to try endpoints (see “Run locally” below). You don’t need Docker or Kubernetes for normal local dev or before push.

---

## How the infrastructure fits together

| Thing | What it is | When you use it |
|-------|------------|------------------|
| **Local (Node + Redis)** | Run `npm start` on your machine; Redis and SQLite/Postgres on your machine or Docker. | Day-to-day development, trying the API. |
| **Docker (docker compose)** | One command runs API + Redis + Postgres in containers on your machine. | “Production-like” run locally, or to test the Dockerfile. No Kubernetes needed. |
| **Kubernetes (k8s/)** | Manifests to run the API (and optionally Redis/Postgres) inside a **cluster**. | When you deploy to a real cluster (cloud or local cluster like minikube/kind). |
| **GitHub Actions** | CI: on every push/PR, runs `npm test` in the cloud with Redis. | Nothing to run yourself; just push and check the “Tests” workflow. |

- **Docker** = run the app (and its dependencies) in containers. Works on your laptop or on a server. **You don’t need Docker to run tests or the app locally** (Node + Redis is enough).
- **Kubernetes** = run and scale the app inside a cluster. It **can** run “locally” with **minikube** or **kind** (they create a small cluster on your machine), but that’s optional. Most people use Docker Compose for local “full stack” and use Kubernetes only when deploying to a real/cluster environment.

**Simple flow:**

- **Before push:** `npm test` (with Redis running).
- **Run app locally:** `npm start` (and Redis), or `docker compose up` for API + Redis + Postgres.
- **Deploy to a cluster:** build image, apply the files in `k8s/`, and have Redis/Postgres available (in or outside the cluster).

---

## How the app works

- **Request flow**
  - **Public:** `GET /` (health), `POST /register` (create client, get API key). No auth.
  - **Protected:** `POST /check-limit`, `POST /set-limit` — **auth** (API key in `Authorization` header) → **rate limiter** (middleware) → controller.
- **Redis:** Used by the rate limiter service to store per-client/route counters and custom limit config (keys like `rate:client:id:route:...`, `config:client:id`).
- **DB (Sequelize):** Used for the `Client` model (registration, lookup by API key). Default is SQLite; set `DB_DIALECT=postgres` and DB_* env vars for PostgreSQL.
- **Assumptions:** Protected routes expect `req.client` to be set by the auth middleware (Client instance with `id`, `isActive`, `revokedAt`). The rate limiter can also use `req.body.clientId` / `req.query.clientId` or fall back to IP.

---

## Running the app

### 1. Run locally

1. Clone and install:
   ```bash
   git clone <repository-url>
   cd GateKeeper
   npm install
   ```
2. Copy env and start Redis (and optionally Postgres):
   ```bash
   cp .env.example .env
   # Edit .env if needed. Defaults: SQLite, Redis at localhost:6379
   ```
   Ensure Redis is running (e.g. `redis-server` or Docker: `docker run -d -p 6379:6379 redis:alpine`).
3. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-reload: `npm run dev`.

- API: **http://localhost:3000**
- In non-production, Swagger UI: **http://localhost:3000/api-docs**

### 2. Run with Docker

Build and run the full stack (API + Redis + PostgreSQL):

```bash
docker compose up --build
```

- API: **http://localhost:3000**
- Redis: `localhost:6379`; Postgres: `localhost:5432` (user `gatekeeper`, DB `gatekeeper`).
- Optional: set `DB_PASSWORD` in `.env` or in the shell before `docker compose up`; default is `gatekeeper_secret`.

Stop: `docker compose down`. Data: `docker compose down -v` removes the Postgres volume.

### 3. Deploy to Kubernetes (minikube / kind)

Kubernetes **can** run “locally” using **minikube** or **kind**: they start a small cluster on your machine. You don’t need this for everyday dev or for running tests; use it only when you want to try the app inside a real K8s cluster.

Manifests are in **`k8s/`**: `configmap.yaml`, `secret.yaml`, `deployment.yaml`, `service.yaml`. The API expects Redis and Postgres to be available (deploy them separately or use existing services).

1. **Build the image** so the cluster can use it:
   - **Kind:** `kind load docker-image gatekeeper:latest` (after `docker build -t gatekeeper:latest .`).
   - **Minikube:** `eval $(minikube docker-env)` then `docker build -t gatekeeper:latest .`.
2. **Create ConfigMap and Secret:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   ```
   Edit `k8s/secret.yaml` and replace the base64 values for `DB_PASSWORD` (and optionally `ADMIN_SECRET`) with your own; do not commit real secrets.
3. **Deploy API:**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```
4. **Access:** NodePort is set to `30300`. With minikube: `minikube service gatekeeper` or `http://$(minikube ip):30300`.

You must have Redis and Postgres running (in the cluster or elsewhere) and point `REDIS_URL`, `DB_HOST`, etc. in the ConfigMap/Secret to those services.

---

## API Endpoints

- **GET /** — Health check (no auth).
- **POST /register** — Register a client; body: `{ "clientName", "email" }`. Returns `clientId` and one-time `apiKey`.
- **POST /check-limit** — (Protected) Check rate limit; body can include `clientId`, `ip`, `route`. Header: `Authorization: <apiKey>`.
- **POST /set-limit** — (Protected) Set custom limit; body: `{ "clientId", "limit", "window" }`, optional `route`. Header: `Authorization: <apiKey>`.

In **non-production**, OpenAPI docs are available at **/api-docs** (Swagger UI).

### Example: Health Check

- **GET /**  
  **Response:**
  ```json
  { "status": "ok", "message": "🚦 GateKeeper is running" }
  ```

### Example: Rate Limit Check

- **POST /check-limit**  
  **Headers:** `Authorization: your-generated-api-key`  
  **Body:**
  ```json
  {
    "clientId": "client-uuid",
    "ip": "192.168.1.1",
    "route": "/api/resource"
  }
  ```
  **Response:**
  ```json
  {
    "allowed": true,
    "remaining": 9,
    "retryAfter": 0,
    "limit": 10,
    "window": 60
  }
  ```

### Example: Set Custom Limit

- **POST /set-limit**  
  **Headers:** `Authorization: your-generated-api-key`  
  **Body:**
  ```json
  {
    "clientId": "client-uuid",
    "route": "/api/resource",
    "limit": 20,
    "window": 120
  }
  ```
  **Response:**
  ```json
  {
    "message": "Limit updated",
    "identifier": "client-uuid:/api/resource",
    "limit": 20,
    "window": 120
  }
  ```

## Testing

Tests use **Jest** and **supertest**. Run them with:

```bash
npm test
```

**Requirements:** Redis and PostgreSQL (tests use Postgres by default so the `sqlite3` native module is not needed; this avoids binary/architecture issues on e.g. Apple Silicon).

Start both with Docker:

```bash
# Redis
docker run -d -p 6379:6379 --name redis redis:alpine

# Postgres (user/postgres, password/postgres, db/postgres)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name postgres postgres:16-alpine
```

Then run `npm test`. CI runs the same setup via **GitHub Actions** (`.github/workflows/test.yml`) with Redis and Postgres service containers.

**Troubleshooting**

- **`sqlite3` / "slice is not valid mach-o file"** – Tests no longer use SQLite by default, so this should be avoided. If you want to use in-memory SQLite instead of Postgres, run `npm rebuild sqlite3` (fixes many architecture mismatches), then:
  ```bash
  DB_DIALECT=sqlite DB_STORAGE=:memory: npm test
  ```
  You still need Redis running.

## Configuration

See `.env.example`. Main options: `PORT`, `NODE_ENV`, `DB_DIALECT` (sqlite | postgres), `DB_*`, `REDIS_URL`, `DEFAULT_LIMIT`, `DEFAULT_WINDOW`, `BCRYPT_ROUNDS`, `ADMIN_SECRET`. Config is read from `config/settings.js`.

## License

This project is licensed under the MIT License.
