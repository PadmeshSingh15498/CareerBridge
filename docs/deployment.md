# CareerBridge — Production Deployment Specification

> **Platform Version:** 1.0.0  
> **Supported Targets:** Multi-Container Docker Compose (Self-Hosted / VPS) and Cloud PaaS (Render API + Vercel Frontend + Managed MySQL 8)  
> **Health Check Endpoint:** `/health` (Backend), `/api/health` (Frontend)  

---

## 1. Quick Deployment Reference

```bash
# 1. Clone repository
git clone https://github.com/your-org/careerbridge.git /opt/careerbridge
cd /opt/careerbridge

# 2. Configure production secrets
cp .env.example .env
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production

# Edit secrets (SECRET_KEY, DB passwords, Gemini key)
nano backend/.env

# 3. Launch production Docker stack
docker compose -f docker-compose.prod.yml up -d --build

# 4. Initialize MySQL schema and seed target roles
docker compose -f docker-compose.prod.yml run --rm backend python scripts/setup_mysql_production.py

# 5. Verify system health
curl -f http://localhost:8000/health
```

---

## 2. Cloud PaaS Deployment (Render + Vercel)

### 2.1 Backend & MySQL on Render
1. Deploy using the included Infrastructure as Code blueprint: [`render.yaml`](file:///c:/Users/padme/OneDrive/Desktop/project1/render.yaml).
2. Render automatically provisions:
   - **`careerbridge-api`**: FastAPI Web Service (Python 3.11, 4 Uvicorn workers).
     - Health Check Path: `/health`
     - Persistent Disk: 10GB mounted at `/app/storage/resumes`.
   - **`careerbridge-db`**: Managed MySQL 8 Database with automated daily snapshots.
3. Configure private environment variables in Render Dashboard:
   - `SECRET_KEY`: 64-character hex key (`openssl rand -hex 32`).
   - `GEMINI_API_KEY`: API Key from Google AI Studio.
   - `CORS_ORIGINS`: `["https://careerbridge.vercel.app", "https://careerbridge.university.edu"]`
4. Run schema initialization from the Render shell:
   ```bash
   python scripts/setup_mysql_production.py
   ```

### 2.2 Frontend on Vercel
1. Import repository into Vercel with **Root Directory** set to `frontend`.
2. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://careerbridge-api.onrender.com`).
3. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Click **Deploy**. Vercel compiles the Next.js App Router and provisions automatic SSL.

---

## 3. Database Production Procedures

1. **User Segregation & Character Set:**
   Run [`backend/scripts/init_mysql_production.sql`](file:///c:/Users/padme/OneDrive/Desktop/project1/backend/scripts/init_mysql_production.sql) to create `careerbridge_prod` (`utf8mb4_unicode_ci`) and least-privilege user `cb_app_user`.
2. **Automated Daily Backups:**
   Schedule [`backend/scripts/backup_mysql.sh`](file:///c:/Users/padme/OneDrive/Desktop/project1/backend/scripts/backup_mysql.sh) in crontab for daily execution at 02:00 AM with 14-day automatic rotation.
3. Detailed reference: [MySQL Production Guide](file:///c:/Users/padme/OneDrive/Desktop/project1/docs/mysql-production-guide.md).

---

## 4. Disaster Recovery & Rollbacks

1. **Reverting Container Images:**
   ```bash
   git checkout tags/v1.0.0
   docker compose -f docker-compose.prod.yml up -d --build
   ```
2. **Restoring MySQL Snapshot:**
   ```bash
   gunzip < /opt/careerbridge/backups/mysql_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u cb_app_user -p careerbridge_prod
   ```

