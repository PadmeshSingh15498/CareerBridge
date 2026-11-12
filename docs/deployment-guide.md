# CareerBridge — Production Deployment Guide

This guide provides end-to-end instructions for deploying CareerBridge v1.0.0 to production environments with high availability, secure credentials management, zero-downtime health checking, and data persistence.

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph Client["End Users & Browsers"]
        Browser["Desktop & Mobile Web Browsers"]
    end

    subgraph CDN["Edge & Frontend (Vercel / Cloudflare)"]
        NextJS["Next.js 14 App Router\n(SSR, Streaming & UI)"]
    end

    subgraph BackendTier["Application Tier (Docker / Render / AWS)"]
        Nginx["Reverse Proxy / SSL Termination"]
        FastAPI["FastAPI 4-Worker Cluster (Uvicorn)\nAsync Event Loop"]
    end

    subgraph StorageTier["Data & Persistence Tier"]
        MySQL[("MySQL 8.0 Production DB\nutf8mb4_unicode_ci\nConnection Pool (20-40)")]
        Disk[("Persistent Volume Mount\n/app/storage/resumes")]
    end

    subgraph External["External APIs"]
        Gemini["Google Gemini AI API\n(Flash 2.5 / 1.5)"]
        SMTP["SMTP Mail Gateway\n(Transactional Emails)"]
    end

    Browser -->|HTTPS| NextJS
    Browser -->|HTTPS /api/v1| Nginx
    NextJS -->|Server Actions / Client Fetch| Nginx
    Nginx -->|Proxy Pass| FastAPI
    FastAPI -->|SQLAlchemy 2.0 Pool| MySQL
    FastAPI -->|Secure I/O| Disk
    FastAPI -->|HTTPS REST| Gemini
    FastAPI -->|TLS Port 587| SMTP
```

---

## 2. Production Prerequisites

Before deploying to production, ensure you have:
1. **Registered Domain & Subdomain**:
   - Frontend: `https://careerbridge.university.edu` (or `https://careerbridge.example.com`)
   - Backend API: `https://api.careerbridge.university.edu` (or `https://api.careerbridge.example.com`)
2. **Production MySQL 8.0 Instance**:
   - Managed DB (AWS RDS, Google Cloud SQL, Render Postgres/MySQL, or Railway MySQL).
   - Minimum specs: 2 vCPU, 4GB RAM, 20GB SSD with automated daily snapshots.
3. **Google Gemini API Key**:
   - Obtain from [Google AI Studio](https://aistudio.google.com/).
4. **Production SMTP Credentials**:
   - SendGrid, AWS SES, Mailgun, or institutional SMTP relay.
5. **SSL/TLS Certificates**:
   - Let's Encrypt (Certbot) or Managed Cloud Certificates (Vercel/Render/Cloudflare).

---

## 3. Environment Configuration & Secret Generation

### 3.1 Cryptographic Key Generation
Generate cryptographically strong secrets using standard tools:

```bash
# Generate SECRET_KEY (64 hex characters)
openssl rand -hex 32

# Generate FIRST_SUPERADMIN_PASSWORD (24 random alphanumeric characters)
openssl rand -base64 18
```

### 3.2 Environment Variable Matrix

#### Backend (`backend/.env` or Platform Environment Variables)

| Variable | Required | Description | Example / Recommended Value |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | **Yes** | Execution mode (`development`, `testing`, `production`) | `production` |
| `SECRET_KEY` | **Yes** | 64-character hex key for JWT signing & hashing | *[Generated cryptographically]* |
| `DEBUG` | **Yes** | Must be `False` in production | `False` |
| `DATABASE_URL` | **Yes** | MySQL connection URI with PyMySQL driver | `mysql+pymysql://cb_app_user:Pass@mysql.internal:3306/careerbridge_prod` |
| `DATABASE_POOL_SIZE` | No | SQLAlchemy persistent pool size | `20` |
| `DATABASE_MAX_OVERFLOW` | No | Overflow connections under high burst traffic | `40` |
| `DATABASE_POOL_RECYCLE` | No | Recycle connections before MySQL timeout (sec) | `1800` |
| `DATABASE_SSL_CA` | Conditional | Path to SSL CA certificate bundle (RDS/Aiven) | `/app/certs/ca-bundle.pem` |
| `ENABLE_DB_FALLBACK` | **Yes** | Enforce strict failure if primary DB is down | `False` *(Enforced by Pydantic validator)* |
| `CORS_ORIGINS` | **Yes** | JSON array of authorized frontend origins | `["https://careerbridge.university.edu"]` |
| `COOKIE_SECURE` | **Yes** | Restrict session cookies to HTTPS | `True` *(Enforced in production)* |
| `COOKIE_SAMESITE` | No | Cross-site cookie attribute | `lax` |
| `GEMINI_API_KEY` | **Yes** | API key for Gemini AI features | `AIzaSy...` |
| `GEMINI_MODEL` | No | Model name for BridgeAI & resume analysis | `gemini-1.5-flash` |
| `UPLOAD_DIR` | No | Directory for resume file uploads | `/app/storage/resumes` |
| `LOG_LEVEL` | No | Application logging verbosity | `INFO` |
| `SMTP_HOST` | Conditional | SMTP Server hostname | `smtp.sendgrid.net` |
| `SMTP_PORT` | Conditional | SMTP TLS port | `587` |
| `SMTP_USER` | Conditional | SMTP account username | `apikey` |
| `SMTP_PASSWORD` | Conditional | SMTP account password / API secret | `SG.xxxxxxxx` |
| `EMAILS_FROM_EMAIL` | Conditional | Default From header | `noreply@careerbridge.university.edu` |

#### Frontend (`frontend/.env.production` or Platform Environment Variables)

| Variable | Required | Description | Example Value |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | Public endpoint to the FastAPI backend API | `https://api.careerbridge.university.edu` |
| `PORT` | No | Container listener port (defaults to 3000) | `3000` |
| `NODE_ENV` | No | Node environment | `production` |

---

## 4. Deployment Option A: Multi-Container Production Stack (Docker Compose)

Ideal for self-hosted instances on Ubuntu 22.04 LTS / 24.04 LTS VPS (Hetzner, DigitalOcean, Linode, AWS EC2).

### Step 1: Provision Host and Install Docker
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban certbot python3-certbot-nginx

# Install Docker Engine & Compose plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone Repository & Configure Environment
```bash
git clone https://github.com/your-org/careerbridge.git /opt/careerbridge
cd /opt/careerbridge

# Copy production environment templates
cp .env.example .env
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production

# Edit configurations with real secrets
nano backend/.env
nano frontend/.env.production
nano .env
```

### Step 3: Run Database Schema Initialization
```bash
# Start MySQL first
docker compose -f docker-compose.prod.yml up -d mysql

# Verify MySQL healthy state
docker compose -f docker-compose.prod.yml ps

# Initialize schema and seed target roles
docker compose -f docker-compose.prod.yml run --rm backend python scripts/setup_mysql_production.py
```

### Step 4: Launch Full Production Stack
```bash
docker compose -f docker-compose.prod.yml up -d --build

# Verify all containers are healthy
docker compose -f docker-compose.prod.yml ps
```

### Step 5: Configure Nginx Host Reverse Proxy & SSL
Create `/etc/nginx/sites-available/careerbridge`:
```nginx
# API Backend
server {
    server_name api.careerbridge.university.edu;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}

# Frontend Application
server {
    server_name careerbridge.university.edu;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and acquire SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/careerbridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d careerbridge.university.edu -d api.careerbridge.university.edu
```

---

## 5. Deployment Option B: Cloud PaaS (Render + Vercel)

This is the recommended hybrid architecture for automated CI/CD and zero server maintenance.

### 5.1 Backend & MySQL on Render

The repository includes a ready-to-deploy Infrastructure as Code blueprint: [`render.yaml`](file:///c:/Users/padme/OneDrive/Desktop/project1/render.yaml).

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **Blueprints** -> **New Blueprint Instance**.
3. Connect your repository.
4. Render automatically detects `render.yaml` and provisions:
   - **Service 1**: `careerbridge-api` (FastAPI Web Service, Python 3.11).
     - Health Check Path: `/health`
     - Auto-mounted Persistent Disk: `/app/storage/resumes` (10 GB).
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4 --proxy-headers --forwarded-allow-ips "*"`
   - **Service 2**: `careerbridge-db` (Managed MySQL 8 Database with automatic daily backups).
5. In the Render Dashboard, set your private environment variables:
   - `SECRET_KEY`: *[Your generated 64-char key]*
   - `GEMINI_API_KEY`: *[Your Gemini Key]*
   - `CORS_ORIGINS`: `["https://careerbridge.vercel.app", "https://careerbridge.university.edu"]`
   - `FIRST_SUPERADMIN_PASSWORD`: *[Your admin bootstrap password]*
6. Once deployed, run the one-time DB setup job via the Render Shell:
   ```bash
   python scripts/setup_mysql_production.py
   ```

### 5.2 Frontend on Vercel

1. Log into [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://careerbridge-api.onrender.com` (or your custom backend domain `https://api.careerbridge.university.edu`)
5. Click **Deploy**. Vercel will build the frontend, deploy to global edge networks, and provision automated SSL.

---

## 6. Database Production Procedures

### 6.1 MySQL User & Privilege Segregation
Ensure your production database never runs under the `root` administrative account. Execute the following script on your MySQL instance:

```bash
mysql -u root -p < backend/scripts/init_mysql_production.sql
```

This creates:
- Database: `careerbridge_prod` (`utf8mb4` and `utf8mb4_unicode_ci`).
- Application User: `cb_app_user` with restricted DML/DDL permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `INDEX`, `ALTER`, `CREATE VIEW`, `SHOW VIEW`).
- Revoked superuser privileges (`SHUTDOWN`, `FILE`, `GRANT OPTION`).

### 6.2 Schema Initialization & Seeding
Run the standalone migration runner:
```bash
cd backend
python scripts/setup_mysql_production.py
```
This tests connectivity, verifies table creation, builds all 58 database indexes and unique constraints, and seeds standard industry career roles.

### 6.3 Automated Non-Blocking Database Backups
Schedule daily backups using the provided shell script:
```bash
# Add execution permission
chmod +x backend/scripts/backup_mysql.sh

# Test a backup run
MYSQL_USER=cb_app_user MYSQL_PASSWORD="SecretPassword" MYSQL_DATABASE=careerbridge_prod backend/scripts/backup_mysql.sh

# Add to crontab for daily execution at 02:00 AM
crontab -e
# Add:
0 2 * * * /opt/careerbridge/backend/scripts/backup_mysql.sh >> /var/log/careerbridge_backup.log 2>&1
```

---

## 7. Post-Deployment Verification & Smoke Testing

After deploying, run the automated verification suite to validate system health:

```bash
# Run readiness check from the backend container or CI runner
cd backend
python scripts/verify_production_readiness.py
```

### Manual Verification Checklist:
1. **Health Endpoint**:
   ```bash
   curl -i https://api.careerbridge.university.edu/health
   # Expected: HTTP 200 OK, {"status": "ok", "environment": "production", "database": "healthy"}
   ```
2. **CORS Security**:
   ```bash
   curl -i -H "Origin: https://malicious-site.com" https://api.careerbridge.university.edu/health
   # Verify that Access-Control-Allow-Origin does NOT include malicious-site.com
   ```
3. **Resume File Storage**:
   Log into the student portal, upload a test PDF resume, and verify it stores in `/app/storage/resumes` without permission errors.
4. **AI Assistant Communication**:
   Open BridgeAI on the student portal and send a career inquiry to confirm external Gemini API connectivity.

---

## 8. Maintenance, Monitoring & Rollbacks

### 8.1 Log Monitoring
Backend logs output in structured formats with log levels (`INFO`, `WARNING`, `ERROR`).
```bash
# Docker Compose
docker compose -f docker-compose.prod.yml logs -f --tail=100 backend

# Render / PaaS
# View live streaming logs via the Render/AWS cloud console.
```

### 8.2 Rolling Updates
To update application code with zero downtime:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --no-deps backend frontend
```

### 8.3 Disaster Recovery & Rollback
If a deployment fails:
1. Revert container image or Git commit:
   ```bash
   git checkout tags/v1.0.0
   docker compose -f docker-compose.prod.yml up -d --build
   ```
2. Restore MySQL snapshot:
   ```bash
   gunzip < /opt/careerbridge/backups/mysql_backup_20261112_020000.sql.gz | mysql -u cb_app_user -p careerbridge_prod
   ```

