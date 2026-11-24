# TrackAsap DevOps & Observability Suite

Infrastructure-as-Code, containerization, and monitoring stack for **TrackAsap** (`backend`, `frontend`, `learn`, `ai-agent`, `livekit`, `redis`).

## Components Included

| Tool | Location | Purpose |
| :--- | :--- | :--- |
| **Docker & Compose** | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `learn/Dockerfile`, `docker/docker-compose.yml` | Multi-service container builds with Node 20, Nginx proxy fixes, Redis cache, and healthchecks |
| **Prometheus** | `devops/prometheus/prometheus.yml`, `alerts.yml` | Scrapes `/metrics` on TrackAsap API + Redis + Node Exporter with 6 production alert rules |
| **Prometheus & Grafana** | [`docker-compose.monitoring.yml`](../docker-compose.monitoring.yml) | Scrape config + alerts + provisioned Grafana dashboard (`:3001`) + Nagios (`:8085`) |
| **Nagios** | `devops/nagios/objects/`, `devops/nagios/plugins/check_trackasap_health.sh` | Host/service monitoring + custom deep-health plugin checking `/api/health/deep` (`:8085`) |
| **Ansible** | `devops/ansible/` | Playbooks (`site.yml`, `deploy.yml`) & roles (`docker_host`, `trackasap_app`, `monitoring_agent`) |
| **Puppet** | `devops/puppet/` | Hiera + manifests (`init.pp`, `docker.pp`, `nginx.pp`, `nagios_nrpe.pp`) for server state drift control |

## Quick Start

### 1. Run Application Stack
```bash
docker compose up -d --build
```
Include the `learn` Architecture Lab:
```bash
docker compose --profile learn up -d --build
```

### 2. Run Observability Stack (Prometheus + Grafana + Nagios)
```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```
- **Grafana:** `http://localhost:3001` (`admin` / `trackasap_admin`)
- **Prometheus:** `http://localhost:9090`
- **Nagios:** `http://localhost:8085` (`nagiosadmin` / `trackasap_nagios`)
- **Backend Metrics:** `http://localhost:5000/metrics`
- **Deep Health Check:** `http://localhost:5000/api/health/deep`

### 3. Validate All Configs Locally
```bash
python devops/scripts/verify_devops.py
```

### 4. Provision Servers via Ansible / Puppet
```bash
ansible-playbook -i devops/ansible/inventory/hosts.ini devops/ansible/playbooks/site.yml
puppet apply --hiera_config=devops/puppet/hiera.yaml --modulepath=devops/puppet/modules devops/puppet/manifests/site.pp
```
