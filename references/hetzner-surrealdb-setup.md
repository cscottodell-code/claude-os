# Setting Up SurrealDB on Hetzner Server

**Server:** ubuntu-2gb-hil-1
**IP:** 5.78.128.41
**Purpose:** Production SurrealDB for BreSco Platform

## Status

- [x] Step 1: SSH into server
- [x] Step 2: Install SurrealDB (v2.6.1)
- [x] Step 3: Create data directory
- [x] Step 4: Start SurrealDB (via systemd service)
- [x] Step 5: Test it's running (200 OK)
- [x] Step 6: Open firewall port 8000 (UFW inactive, not needed)
- [x] Step 7: Test remote connection (200 OK)
- [x] Step 8: Make SurrealDB start on boot (systemd enabled)
- [x] Step 9: Update Vercel env vars (already set)
- [x] Step 10: Redeploy and verify

---

## Step 1: SSH into the server

Open your Mac terminal (not Claude Code) and run:

```bash
ssh root@5.78.128.41
```

**What happens:** It asks for a password. This is the root password Hetzner emailed you when you created the server. Check your email for "Your Hetzner Cloud server is ready" from Hetzner.

**If you forgot the password:** Go to Hetzner Console → Servers → Click your server → Click "Rescue" tab → "Reset Root Password". They'll email you a new one.

**If it asks "Are you sure you want to continue connecting?"** Type `yes` and press Enter.

**Success looks like:** You see `root@ubuntu-2gb-hil-1:~#` — you're now on your server.

---

## Step 2: Install SurrealDB

Run this command on the server (after SSH-ing in):

```bash
curl -sSf https://install.surrealdb.com | sh
```

**What this does:** Downloads and installs SurrealDB v2.x from the official source. Takes about 30 seconds.

**Success looks like:** Something like "SurrealDB successfully installed" with a version number.

**Verify it installed:**

```bash
surreal version
```

Should show something like `surreal 2.6.0` or similar.

---

## Step 3: Create data directory

```bash
mkdir -p /var/lib/surrealdb
```

**What this does:** Creates a folder where SurrealDB stores its data files. Without this, your data would be lost every time the server restarts.

---

## Step 4: Start SurrealDB

```bash
surreal start --bind 0.0.0.0:8000 --user [see credentials.md] --pass [see credentials.md] file:/var/lib/surrealdb/data.db &
```

**Breaking this down:**
- `surreal start` — starts the database server
- `--bind 0.0.0.0:8000` — listen on port 8000 from any IP address (so Vercel can connect)
- `--user [see credentials.md]` — the admin username (like a master login)
- `--pass [see credentials.md]` — the admin password
- `file:/var/lib/surrealdb/data.db` — save data to disk (persists after restart)
- `&` — run in the background so you can keep using the terminal

**The credentials we're using:**
- Username: `[see credentials.md → Hetzner / BreSco SurrealDB]`
- Password: `[see credentials.md → Hetzner / BreSco SurrealDB]`
- These go into Vercel as `NUXT_SURREALDB_ROOT_USER` and `NUXT_SURREALDB_ROOT_PASS`

**Success looks like:** Some startup text, then you get your prompt back.

---

## Step 5: Test it's running

```bash
curl http://localhost:8000/health
```

**Success looks like:** Returns `OK`

**If it doesn't work:**
- Check if it's running: `ps aux | grep surreal`
- Check if port is in use: `ss -tlnp | grep 8000`
- Try starting again without `&` to see error messages: `surreal start --bind 0.0.0.0:8000 --user [see credentials.md] --pass [see credentials.md] file:/var/lib/surrealdb/data.db`

---

## Step 6: Open firewall port 8000

**Option A: Via Hetzner Console (recommended)**

1. Go to https://console.hetzner.cloud
2. Log in with [see credentials.md → Hetzner / BreSco SurrealDB]
3. Click into your project
4. Click **Firewalls** in the left sidebar (or go to your server → Networking tab)
5. Click **Create Firewall** (or edit existing)
6. Add an **Inbound Rule**:
   - Protocol: **TCP**
   - Port: **8000**
   - Source IPs: Leave blank or enter `0.0.0.0/0` (allows any IP)
7. Apply the firewall to your server (ubuntu-2gb-hil-1)

**Option B: Via command line on the server (if no Hetzner firewall)**

Some Hetzner servers use UFW (Ubuntu Firewall) instead:

```bash
ufw allow 8000/tcp
ufw status
```

**Note:** If `ufw status` shows "inactive", the firewall isn't blocking anything and you can skip this step.

---

## Step 7: Test remote connection

**From your Mac terminal** (NOT on the server — open a new terminal tab):

```bash
curl http://5.78.128.41:8000/health
```

**Success looks like:** Returns `OK`

**If it doesn't work:**
- Firewall might not be open yet (Step 6)
- SurrealDB might not be running (Step 5)
- Wait 30 seconds and try again (firewall rules can take a moment)

---

## Step 8: Make SurrealDB start on boot

If the server restarts, SurrealDB won't auto-start unless we set it up. Run this on the server:

```bash
cat > /etc/systemd/system/surrealdb.service << 'EOF'
[Unit]
Description=SurrealDB Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/surreal start --bind 0.0.0.0:8000 --user [see credentials.md] --pass [see credentials.md] file:/var/lib/surrealdb/data.db
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Then enable it:

```bash
systemctl daemon-reload
systemctl enable surrealdb
systemctl start surrealdb
systemctl status surrealdb
```

**What this does:** Creates a "service" that automatically starts SurrealDB whenever the server boots up, and restarts it if it crashes.

**Success looks like:** `systemctl status surrealdb` shows "active (running)" in green.

**Note:** If you already started SurrealDB with `&` in Step 4, kill it first:
```bash
pkill surreal
systemctl start surrealdb
```

---

## Step 9: Update Vercel env vars

Tell Claude Code to run these (or do it in Vercel dashboard):

- `NUXT_SURREALDB_URL` = `ws://5.78.128.41:8000`
- `NUXT_SURREALDB_ROOT_USER` = `[see credentials.md]`
- `NUXT_SURREALDB_ROOT_PASS` = `[see credentials.md]`

---

## Step 10: Redeploy and verify

Tell Claude Code to redeploy, or push any change to GitHub (Vercel auto-deploys).

Then visit: https://automation-business.vercel.app

**Success looks like:** The login page loads instead of a 500 error.

---

## Credentials Summary

| What | Value |
|------|-------|
| All credentials | `[see credentials.md → Hetzner / BreSco SurrealDB]` |

---

## Security Notes (do later)

- [ ] Change SurrealDB to use WSS (encrypted) with SSL certificate
- [ ] Restrict firewall to only Vercel's IP ranges
- [ ] Create a non-root Linux user for SSH
- [ ] Disable root SSH login
- [ ] Set up automated backups for /var/lib/surrealdb/
