# TrackAsap DevOps — UI Demo Guide & Expected Viva Q&A

A step-by-step live presentation guide for demonstrating TrackAsap's DevOps stack through browser UIs, followed by expected DevOps/CMS/Observability viva questions grounded directly in this project.

---

## Part 1: Pre-Demo Tab Setup (All Running Services)

Before presenting, verify the stack is up (`docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d`) and open these tabs in order:

| Tab | Service / UI | URL | Credentials | What It Proves |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **TrackAsap App (Nginx + React)** | `http://localhost:3000` | — | Frontend served by Nginx 1.25 container, proxying `/api/*` cleanly to Express backend. |
| **2** | **Backend Health & Metrics** | `http://localhost:5000/api/health/deep`<br>`http://localhost:5000/metrics` | — | Live MongoDB (`connected`), Redis (`ready`), heap/RSS memory, event-loop lag, and Prometheus 0.0.4 metrics. |
| **3** | **Prometheus Targets & Alerts** | `http://localhost:9090/targets`<br>`http://localhost:9090/alerts` | — | All 4 scrape targets green (`UP`) + all 6 alert rules loaded (`alerts.yml`). |
| **4** | **Grafana Live Dashboard** | `http://localhost:3001/d/trackasap-overview` | `admin` / `trackasap_admin` | Auto-provisioned datasource + 8-panel dashboard (zero manual UI configuration). |
| **5** | **Nagios Core Active Checks** | `http://localhost:8085/nagios/` | `nagiosadmin` / `trackasap_nagios` | Host & service monitoring for `trackasap-backend`, `trackasap-frontend`, `trackasap-redis`, plus custom plugin output. |
| **6** | **Docker Desktop GUI** *(App)* | Docker Desktop → **Containers** | — | Visual proof of the `trackasap` multi-container stack (`healthy` badges, port mappings, resource stats). |

*(Optional: Run `docker compose --profile learn up -d learn` to also show the containerized Architecture Lab on `http://localhost:5174`.)*

---

## Part 2: 60-Second Live UI Walkthrough Script

1. **Docker Desktop GUI (10s)**:
   - Expand **`trackasap`** to show all 8 containers running (`frontend`, `backend`, `redis`, `prometheus`, `grafana`, `nagios`, `redis-exporter`, `node-exporter`) with green `healthy` status on `redis`, `backend`, and `frontend`.
2. **Generate Real Traffic (10s)**:
   - Switch to **Tab 1** (`http://localhost:3000`) and click around or refresh `http://localhost:3000/api/health` 4–5 times (this proves Nginx → Backend → Redis/DB routing works end-to-end).
3. **Grafana Live Reaction (15s)**:
   - Switch to **Tab 4** (`http://localhost:3001/d/trackasap-overview`), set top-right refresh to **`5s`**, and point out:
     - **MongoDB Status** = `CONNECTED` (green)
     - **Redis Cache Status** = `READY` (green)
     - **HTTP Request Rate** & **P95/P50 Latency** panels spiking in real time from the traffic you just generated.
4. **Prometheus & Nagios (15s)**:
   - In **Tab 3** (`:9090/targets` & `:9090/alerts`), show every target `UP` and the 6 alerting rules.
   - In **Tab 5** (`:8085/nagios/`), click **Services** → **`Backend Deep Dependency Health`** to show the green `OK - TrackAsap healthy` status and performance metrics (`heap_mb`, `lag_ms`, `queue_pending`) returned by [`devops/nagios/plugins/check_trackasap_health.sh`](devops/nagios/plugins/check_trackasap_health.sh).
5. **CMS (Ansible & Puppet) + CI Proof (10s)**:
   - Open [`devops/ansible/playbooks/site.yml`](devops/ansible/playbooks/site.yml), [`devops/puppet/manifests/site.pp`](devops/puppet/manifests/site.pp), and [`.github/workflows/test.yml`](.github/workflows/test.yml) (plus the GitHub **Actions** UI tab if pushed) to show automated provisioning, drift control, and CI validation.

---

## Part 3: Expected Viva Questions & Answers (DevOps Only)

### A. Docker, Compose & Nginx

**Q1. Why did you use a multi-stage Dockerfile for `frontend` and `learn`, but a single-stage Dockerfile for `backend`?**
- **Answer:** The frontend (`Vite` + `React`) needs Node.js, TypeScript/JSX tooling, and `devDependencies` only during build time to produce static `dist/` bundles. Using a multi-stage build (`node:20-alpine` → `nginx:1.25-alpine`) strips out Node and `node_modules` from the final production image, shrinking image size and attack surface. The Express `backend` executes JS directly at runtime with Node 20, so it runs `npm ci --omit=dev` in a slim `node:20-alpine` image.

**Q2. What is the difference between `depends_on` with default `service_started` vs `condition: service_healthy` in your `docker-compose.yml`?**
- **Answer:** Default `depends_on` only waits until Docker starts the container process, not until the service inside is ready. In TrackAsap, `backend` uses `condition: service_healthy` on `redis` (`redis-cli ping`), and `frontend` uses `condition: service_healthy` on `backend` (`fetch('/api/health')`). That prevents premature connection errors during cold startup.

**Q3. Why is the trailing slash in Nginx `proxy_pass http://backend:8080;` critical, and what bug did you catch in `.dockerignore`?**
- **Answer:**
  1. In Nginx, `location /api/` paired with `proxy_pass http://backend:8080/;` (with a trailing `/`) strips `/api/` and forwards `/auth/login` instead of `/api/auth/login` — breaking all Express routes. Removing the trailing slash (`proxy_pass http://backend:8080;`) preserves the `/api/` path prefix.
  2. `frontend/.dockerignore` originally listed `nginx.conf`, which excluded the config file from the Docker build context and broke `COPY nginx.conf` in `frontend/Dockerfile`. Removing `nginx.conf` from `.dockerignore` fixed the build.

**Q4. Why do `frontend` and `backend` both listen on port `8080` internally without colliding?**
- **Answer:** Each container has its own isolated network namespace inside `trackasap-net`. On the host side they bind to separate ports (`3000:8080` for frontend, `5000:8080` for backend), while inter-container DNS resolves `http://backend:8080` directly over the Docker bridge network.

---

### B. Configuration Management Systems (Ansible & Puppet)

**Q5. Both Ansible and Puppet are Configuration Management tools — why did you include both in TrackAsap instead of just one?**
- **Answer:** They solve complementary halves of infrastructure management:
  - **Ansible (Push, Agentless over SSH)** excels at **Day-0 provisioning** (`site.yml`: installing Docker, opening UFW ports, rendering secrets via Ansible Vault) and **orchestrated Day-2 rolling deployments** (`deploy.yml` with `serial: 1` and HTTP readiness polling).
  - **Puppet (Pull/Declarative, Agent-based)** excels at **continuous configuration drift control**. Using Hiera data (`common.yaml`) and declarative resource graphs (`docker.pp`, `nginx.pp`, `nagios_nrpe.pp`), Puppet periodically ensures no admin manually broke `/etc/docker/daemon.json` log rotation, Nginx `/metrics` IP restrictions, or NRPE configs.

**Q6. How does your Ansible rolling deploy (`deploy.yml`) achieve zero/minimal downtime?**
- **Answer:** It sets `serial: 1` so Ansible upgrades one `app_servers` host at a time rather than all at once. On each host it pulls the `devops` branch, rebuilds `backend` and `frontend`, recreates containers, and uses `ansible.builtin.uri` with `retries: 12` / `delay: 5` to wait until `GET /api/health/deep` returns HTTP `200` before moving to the next server.

**Q7. Why did you avoid `community.general.ufw` and `apt_repository` in your Ansible `docker_host` role?**
- **Answer:** During container verification in minimal `ansible-core` (Alpine), `community.general.ufw` failed because external Galaxy collections aren't bundled with `ansible-core`, and `apt_repository` triggered deprecation warnings toward `ansible-core 2.25`. Switching to `ansible.builtin.deb822_repository` and `ansible.builtin.command` made the playbook completely self-contained with zero warnings.

**Q8. Explain how Puppet Hiera and `notify => Service[...]` work in your Puppet module.**
- **Answer:**
  - **Hiera 5 (`hiera.yaml` + `data/common.yaml`)** separates environment data (ports, `docker_log_max_size`, `nagios_allowed_hosts`) from Puppet manifest code (`*.pp`), allowing per-node overrides under `nodes/%{trusted.certname}.yaml` without editing logic.
  - **`notify => Service['nginx']` (and `'docker'`, `'nagios-nrpe-server'`)** creates an event-driven idempotent trigger: Puppet only restarts the service when the managed config file (`/etc/nginx/sites-available/trackasap.conf`, `daemon.json`, or `nrpe.d/trackasap.cfg`) actually changes.

**Q9. How does Puppet secure `/metrics` at the host Nginx layer?**
- **Answer:** In `devops/puppet/modules/trackasap/manifests/nginx.pp`, the `/metrics` location block allows only `127.0.0.1` and the monitoring subnet `10.0.2.0/24`, denying public internet access (`deny all`) so internal telemetry and heap stats aren't exposed publicly.

---

### C. Observability: Prometheus, Grafana & Nagios

**Q10. Why run both Prometheus AND Nagios? Aren't they redundant?**
- **Answer:** No — they serve different operational purposes:
  - **Prometheus + Grafana** focus on **pull-based time-series metrics & trend analysis** (RPS, P95 latency histograms, event-loop lag trends, Heap/RSS memory curves) with PromQL alert thresholds.
  - **Nagios** focuses on **active availability probing & immediate host/service state checks** (`OK` / `WARNING` / `CRITICAL`), verifying TCP sockets (`6379`), HTTP endpoints (`/nginx-health`), and running custom diagnostic scripts (`check_trackasap_health.sh`) with NRPE host checks (disk, CPU load).

**Q11. How does your Express backend prevent high-cardinality memory leaks in Prometheus metrics?**
- **Answer:** In `prometheusMetrics.js`, `normalizeRoute(req)` uses Express's matched `req.route?.path` when available, and strips raw 24-hex Mongo ObjectIds (`/^[0-9a-fA-F]{24}$/` → `/:id`) and numeric IDs (`/:num`) from fallback paths. Without normalization, every user/problem ID would generate a unique time series in Prometheus.

**Q12. Why did you call `.unref()` on the event-loop lag `setInterval` in `prometheusMetrics.js`?**
- **Answer:** A standard `setInterval` keeps Node.js's event loop alive, causing automated integration tests (like Jest + Supertest) to hang after tests finish. Calling `lagInterval.unref()` tells Node not to block process exit solely for that background telemetry timer.

**Q13. What happens when Redis goes down? How do `/api/health/deep`, Nagios, and Prometheus reflect it?**
- **Answer:** TrackAsap's Redis layer (`redis.js`) is designed to **fail open** so the app keeps working via MongoDB even if Redis drops:
  - `GET /api/health/deep` still returns **HTTP `200`** with `status: "degraded"` (returning `503` only if MongoDB disconnects).
  - Nagios plugin `check_trackasap_health.sh` exits **`1` (`WARNING`)** instead of `2` (`CRITICAL`), alerting SREs without causing a false outage page.
  - Prometheus fires the warning alert `TrackAsapRedisDisconnected` when `trackasap_redis_connected == 0` for `2m`.

**Q14. How are Grafana dashboards set up without clicking around in the UI after every container recreate?**
- **Answer:** Through **Grafana Provisioning** (`devops/grafana/provisioning/`). Mounting `datasources/datasource.yml` and `dashboards/trackasap-overview.json` into `/etc/grafana/provisioning` makes Grafana auto-register Prometheus and load the 8-panel dashboard automatically on container startup.

---

### D. CI/CD & Verification

**Q15. What does your `verify_devops.py` verification script and GitHub Actions `devops-verify` job check?**
- **Answer:** `verify_devops.py` validates every YAML file (Ansible, Prometheus, Grafana, Puppet Hiera, GitHub workflows), Grafana dashboard JSON, Nagios `.cfg` block syntax, Puppet `.pp` braces, `frontend/.dockerignore` safety, and runs `docker compose config --quiet` across all 4 Compose files. Combined with containerized `ansible-playbook --syntax-check`, `puppet parser validate`, `promtool check config`, `nagios -v`, and Jest `observability.test.js`, every layer is verified before merge.
