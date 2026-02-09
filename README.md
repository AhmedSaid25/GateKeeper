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

## How to test Docker and Kubernetes

### Testing the workflow (CI)

1. **Push or open a PR** to `main` or `master`. GitHub Actions runs the **Tests** workflow (`.github/workflows/test.yml`).
2. **Check the run:** Repo → **Actions** → select the run → open the **test** job. It uses Redis and Postgres service containers and runs `npm test` with the same env as below.
3. **Same locally:** To mimic CI locally, set the same env and run tests (Redis and Postgres must be running, e.g. via Docker):
   ```bash
   REDIS_URL=redis://localhost:6379 DB_DIALECT=postgres DB_HOST=localhost DB_PORT=5432 DB_NAME=postgres DB_USER=postgres DB_PASSWORD=postgres npm test
   ```

### Testing Docker

1. **Build and run the stack:**
   ```bash
   docker compose up --build
   ```
2. **Check the API:**
   - Health: `curl http://localhost:3000/`
   - Register: `curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"clientName":"Test","email":"test@example.com"}'`
   - Use the returned `apiKey` in the `Authorization` header for `/check-limit` and `/set-limit`.
3. **Stop:** `docker compose down` (add `-v` to remove the Postgres volume).

### Testing Kubernetes (minikube or kind)

1. **Start a local cluster:**
   - **minikube:** `minikube start`
   - **kind:** `kind create cluster`
2. **Run Redis and Postgres** (so the API can connect). Example with plain manifests or Helm; minimal example:
   ```bash
   # Optional: run Redis + Postgres in the cluster (example with simple Deployments/Services)
   kubectl apply -f - <<EOF
   apiVersion: v1
   kind: Pod
   metadata:
     name: redis
     labels: { app: redis }
   spec:
     containers:
       - name: redis
         image: redis:7-alpine
         ports: [ { containerPort: 6379 } ]
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: redis
   spec:
     selector: { app: redis }
     ports: [ { port: 6379, targetPort: 6379 } ]
   EOF
   ```
   (You’d add a similar Postgres Pod/Service or use Helm/operators; the `k8s/` manifests assume Redis and Postgres exist and are reachable at the names in the ConfigMap.)
3. **Build the image** so the cluster can use it:
   - **minikube:** `eval $(minikube docker-env)` then `docker build -t gatekeeper:latest .`
   - **kind:** `docker build -t gatekeeper:latest .` then `kind load docker-image gatekeeper:latest`
4. **Apply GateKeeper manifests:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```
5. **Check the API:**
   - **minikube:** `minikube service gatekeeper` (opens URL) or `curl http://$(minikube ip):30300/`
   - **kind:** `kubectl port-forward service/gatekeeper 3000:3000` then `curl http://localhost:3000/` (or use NodePort 30300 and the node IP).

Ensure `k8s/configmap.yaml` and `k8s/secret.yaml` point to your Redis and Postgres (service names or host/port). The default ConfigMap uses `REDIS_URL=redis://redis:6379` and `DB_HOST=postgres`; those hostnames only work if Redis and Postgres are in the same cluster with those service names.

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
