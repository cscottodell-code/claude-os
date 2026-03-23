# ADR-003: Infrastructure Separation Plan

**Status:** Proposed | **Date:** March 22, 2026 | **Author:** Scott (via Claude) | **Applies to:** All projects (Advosy, Bresco, Personal)

---

## The Problem

Right now, everything likely runs on one Hetzner VPS managed by Coolify: your Nuxt apps, SurrealDB, and any other services. This works fine today, but creates risks as you scale:

- **Single point of failure.** If the OS crashes, everything goes down. Apps, database, all of it.
- **Resource contention.** A CPU spike from a Nuxt build can starve SurrealDB mid-query.
- **No independent scaling.** You cannot give SurrealDB more RAM without also paying for a bigger app server.
- **Backup complexity.** Backing up the database while apps are hitting it requires coordination.

> **Spreadsheet analogy:** It is like having your raw data, your pivot tables, and your presentation all in one giant Excel file. If the file corrupts, you lose everything. Separating them means a crash in one does not take down the others.

## Decision: Phased Separation

Do not do everything at once. Separate infrastructure in phases based on actual need, not speculation.

## Current State (Assumed)

```
┌─────────────────────────────────────────────┐
│  Hetzner VPS (Single Server)                │
│  ┌─────────────────────────────────────┐    │
│  │  Coolify v4                          │    │
│  │  ├── Advosy App (Nuxt 4)            │    │
│  │  ├── Bresco App (Nuxt 4)            │    │
│  │  ├── SurrealDB (Docker)             │    │
│  │  └── Other services                  │    │
│  └─────────────────────────────────────┘    │
│  Public IP: xxx.xxx.xxx.xxx                 │
└─────────────────────────────────────────────┘
```

---

## Phase 1: Separate SurrealDB to Its Own Server

**DO NOW (Before Bresco gets paying customers)**

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Hetzner Cloud Private Network (10.0.0.0/16)               │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐       │
│  │  App Server           │    │  DB Server            │       │
│  │  CPX21 (~8 EUR/mo)   │    │  CPX31 (~15 EUR/mo)  │       │
│  │                       │    │                       │       │
│  │  Coolify v4           │    │  SurrealDB v3         │       │
│  │  ├── Advosy App      │    │  ├── RocksDB backend  │       │
│  │  ├── Bresco App      │    │  ├── Port 8000        │       │
│  │  └── Other services  │    │  └── No public access │       │
│  │                       │    │                       │       │
│  │  Public: yes          │    │  Public: no           │       │
│  │  Private: 10.0.1.2   │    │  Private: 10.0.2.2   │       │
│  └──────────────────────┘    └──────────────────────┘       │
│                                                              │
│  Connection: ws://10.0.2.2:8000/rpc (private network only)  │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Create a Hetzner Private Network

In Hetzner Cloud Console:

- Go to Networks, click "Create Network"
- Name: `app-db-network`
- IP Range: `10.0.0.0/16`
- Add a subnet: `10.0.0.0/24` in your preferred zone (e.g., eu-central for Germany, us-east for Virginia)

This is free. Private network traffic between servers in the same network has no bandwidth charges.

### Step 2: Create the Database Server

In Hetzner Cloud Console:

- Create a new server: **CPX31** (4 vCPU, 8 GB RAM, 160 GB NVMe) at ~15 EUR/month
- Image: Ubuntu 22.04
- Attach to the `app-db-network` private network
- The server will auto-receive a private IP (e.g., 10.0.2.2) via DHCP (hc-utils handles this)
- Add your SSH key

### Step 3: Install SurrealDB on the DB Server

```bash
# SSH into the DB server
ssh root@db-server-public-ip

# Install SurrealDB
curl -sSf https://install.surrealdb.com | sh

# Create data directory
mkdir -p /var/lib/surrealdb

# Create systemd service
cat > /etc/systemd/system/surrealdb.service <<'EOF'
[Unit]
Description=SurrealDB
After=network.target

[Service]
Type=simple
ExecStart=/root/.surrealdb/surreal start \
  --bind 10.0.2.2:8000 \
  --log info \
  --user root \
  --pass YOUR_STRONG_PASSWORD_HERE \
  rocksdb:/var/lib/surrealdb/data.db
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl enable surrealdb
systemctl start surrealdb
```

> **CRITICAL:** The `--bind 10.0.2.2:8000` flag means SurrealDB ONLY listens on the private network IP. It is not reachable from the public internet. This is the most important security step.

### Step 4: Set Up Hetzner Firewall

In Hetzner Cloud Console, create a Firewall for the DB server:

| Direction | Protocol | Port | Source | Action |
|-----------|----------|------|--------|--------|
| Inbound | TCP | 22 | Your IP only | Allow (SSH) |
| Inbound | TCP | 8000 | 10.0.1.2/32 (app server) | Allow (SurrealDB) |
| Inbound | Any | Any | Any | Deny (default) |

This means: only SSH from your IP, only SurrealDB from the app server. Everything else is blocked.

### Step 5: Update App Server Connection

```bash
# In your Coolify environment variables for each app:
SURREAL_URL=ws://10.0.2.2:8000/rpc
SURREAL_NS=production
SURREAL_DB=advosy    # or bresco
SURREAL_USER=root
SURREAL_PASS=YOUR_STRONG_PASSWORD_HERE
```

### Step 6: Set Up Automated Backups

```bash
# On the DB server, create a backup script
cat > /root/backup-surrealdb.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/lib/surrealdb/backups"
mkdir -p $BACKUP_DIR

# Export each namespace/database
surreal export \
  --conn http://10.0.2.2:8000 \
  --user root --pass YOUR_PASSWORD \
  --ns production --db advosy \
  > "$BACKUP_DIR/advosy_$DATE.surql"

surreal export \
  --conn http://10.0.2.2:8000 \
  --user root --pass YOUR_PASSWORD \
  --ns production --db bresco \
  > "$BACKUP_DIR/bresco_$DATE.surql"

# Keep only last 30 days
find $BACKUP_DIR -name "*.surql" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup-surrealdb.sh

# Run daily at 3 AM
echo "0 3 * * * /root/backup-surrealdb.sh" | crontab -
```

> **Optional upgrade:** Copy backups to Hetzner Object Storage (S3-compatible) or an external bucket for disaster recovery. This adds ~2-5 EUR/month depending on data size.

### Cost Estimate (Phase 1)

| Item | Current | After Separation |
|------|---------|-----------------|
| App Server | ~15-20 EUR/mo (one server) | CPX21: ~8 EUR/mo |
| DB Server | (included above) | CPX31: ~15 EUR/mo |
| Private Network | Free | Free |
| Backups (Object Storage) | - | ~2-5 EUR/mo |
| **Total** | **~15-20 EUR/mo** | **~25-28 EUR/mo** |

About 10 EUR/month more for proper separation, backup, and independent scaling. Worth it once you have paying customers.

---

## Phase 2: Per-Project Database Isolation

**DO WHEN: Bresco Has 5+ Paying Customers**

Right now, Advosy and Bresco can share one SurrealDB instance using different namespaces (`--ns advosy` vs `--ns bresco`). SurrealDB's namespace isolation keeps data separate.

When Bresco scales, consider one of these options:

| Option | Setup | Cost | When |
|--------|-------|------|------|
| **A: Separate namespaces** (current) | Same SurrealDB, different `--ns` | Free (shared server) | Fine for now |
| **B: Separate SurrealDB instances** | Second Docker container on same DB server, different port | ~0 extra (same server) | When you want fully isolated resources |
| **C: Separate DB servers** | Dedicated Hetzner VPS per project | +15 EUR/mo per server | When one project's load affects the other |
| **D: SurrealDB Cloud for Bresco** | Managed instance, zero ops | Variable (usage-based) | When ops burden outweighs cost savings |

**Recommendation:** Start with Option A (namespaces). Move to B or C only if you see resource contention. Evaluate D when Bresco revenue justifies the convenience.

---

## Phase 3: Production Hardening

**DO WHEN: Revenue Justifies It**

### Monitoring

SurrealDB's monitoring ecosystem is immature. No official Prometheus exporter exists yet. For now:

- **Host-level:** Install `node_exporter` on the DB server. Monitor CPU, RAM, disk I/O, network via Grafana.
- **Application-level:** Log query latency and errors in your Nuxt server routes. Send to a log aggregator.
- **Health check:** Ping `http://10.0.2.2:8000/health` from the app server on a schedule. Alert on failure.

### TLS Between Services

Traffic on Hetzner's private network is not encrypted by default. For Bresco (SaaS, customer data), add TLS:

- Generate self-signed certs for internal communication
- Start SurrealDB with `--web-crt` and `--web-key` flags
- Update connection string to `wss://10.0.2.2:8000/rpc`

### High Availability (HA)

Single-node SurrealDB with RocksDB has no HA. If the server dies, you restore from backup. For true HA:

- Move to TiKV storage backend (requires 3+ nodes minimum)
- This is a significant jump in complexity and cost (3x CPX31 = ~45 EUR/mo just for TiKV)
- Only needed if downtime tolerance is very low (minutes, not hours)

**Recommendation:** Do not pursue HA until Bresco has enough revenue to justify 3+ database nodes. Hetzner snapshot backups + daily exports provide adequate recovery for most scenarios.

### Hetzner Snapshots

As an additional safety net, enable Hetzner Cloud server snapshots:

- Manual: Create before risky deployments or migrations
- Automated: Use Hetzner API to schedule weekly snapshots
- Cost: ~0.01 EUR per GB per month (very cheap for peace of mind)
- Recovery: Spin up a new server from snapshot in minutes

---

## Decision Matrix: Self-Hosted vs SurrealDB Cloud

| Factor | Self-Hosted (Hetzner) | SurrealDB Cloud |
|--------|----------------------|-----------------|
| Monthly cost (small workload) | ~15 EUR | Variable, likely 30-80 USD |
| Ops burden | You manage backups, updates, monitoring | Zero ops |
| Data location | You choose (Germany, Finland, US) | AWS (region options expanding) |
| Compliance | You manage | SOC 2, ISO 27001, GDPR, CCPA included |
| Scaling | Manual (resize VPS or add nodes) | Auto-scaling |
| Backups | Custom scripts | Automated daily |
| Support | Community | Official support included |

> **Bottom line:** Self-host on Hetzner while you are learning and building. Evaluate SurrealDB Cloud when Bresco needs compliance certs (SOC 2, etc.) or when the ops time spent managing infrastructure costs more than the Cloud subscription.

---

## Action Items (Ordered by Priority)

1. **Create Hetzner private network** (5 minutes, free, do this today)
2. **Spin up a DB server** on CPX31, attach to private network
3. **Install SurrealDB v3** with RocksDB, bind to private IP only
4. **Set up Hetzner Firewall rules** (allow only app server on port 8000)
5. **Migrate data** from current instance: `surreal export` then `surreal import` on new server
6. **Update Coolify env vars** to point at new private IP
7. **Set up automated backups** (cron + surreal export)
8. **Test everything.** Kill the old SurrealDB container. Verify apps connect to the new server.
9. **Optional:** Set up Hetzner Object Storage for off-server backup copies
