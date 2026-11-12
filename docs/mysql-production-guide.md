# CareerBridge Production Database Deployment Guide (MySQL 8.0+)

This guide provides exhaustive operational instructions for deploying, managing, and maintaining the production relational database for the **CareerBridge** platform.

---

## 1. Architecture Overview

CareerBridge requires an enterprise-grade ACID-compliant relational store. In production:
- **Engine:** MySQL 8.0+ or AWS Aurora MySQL / Google Cloud SQL.
- **Driver:** `mysql+pymysql` with connection pooling, automatic pinging, and pool recycling.
- **Character Encoding:** Strictly `utf8mb4` with `utf8mb4_unicode_ci` collation (supports full Unicode, emojis in resumes, international names, and technical symbols).
- **Storage Engine:** `InnoDB` for all tables (row-level locking, foreign key integrity, crash recovery).
- **Isolation Level:** `READ COMMITTED` or `REPEATABLE READ`.

> [!IMPORTANT]
> In production environments (`ENVIRONMENT=production`), CareerBridge **strictly prohibits fallback to SQLite**. If the primary database cannot be reached, the application fails fast rather than serving stale, local, or unpersisted records.

---

## 2. Database & User Provisioning

Never run the application using MySQL's `root` account. Provision a dedicated service user adhering to the principle of least privilege:

```sql
-- 1. Create Production Database
CREATE DATABASE IF NOT EXISTS careerbridge_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Create Service User with strong password
CREATE USER IF NOT EXISTS 'cb_app_user'@'%'
  IDENTIFIED WITH mysql_native_password BY '<STRONG_PASSWORD>';

-- 3. Grant Explicit Table Operations (No global administrative rights)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES, LOCK TABLES
  ON careerbridge_prod.*
  TO 'cb_app_user'@'%';

FLUSH PRIVILEGES;
```

---

## 3. Production Connection String Format

Configure `DATABASE_URL` in your production environment variables:

```bash
DATABASE_URL=mysql+pymysql://cb_app_user:<STRONG_PASSWORD>@<DB_HOST>:3306/careerbridge_prod?charset=utf8mb4
```

### Connection Pool Calibration
The application configures SQLAlchemy's QueuePool as follows:
- `pool_size`: 20 connections per worker process.
- `max_overflow`: 40 additional burst connections.
- `pool_recycle`: 1800 seconds (30 minutes) to prevent MySQL `wait_timeout` disconnects.
- `pool_pre_ping`: `True` (issues `SELECT 1` heartbeat prior to checking out connections, automatically discarding stale sockets).
- `connect_timeout`: 10 seconds.

### SSL / TLS Encryption
For cloud deployments (AWS RDS, PlanetScale, GCP Cloud SQL):
1. Download your cloud provider's CA bundle (e.g. `rds-combined-ca-bundle.pem`).
2. Mount the certificate into the container at `/etc/ssl/certs/rds-combined-ca-bundle.pem`.
3. Set the environment variable:
   ```bash
   DATABASE_SSL_CA="/etc/ssl/certs/rds-combined-ca-bundle.pem"
   ```

---

## 4. Schema Migration & Table Initialization

To provision tables and apply schema changes:

### Option A: Automated CLI Setup Utility
Run the automated verification script:
```bash
python backend/scripts/setup_mysql_production.py
```
This script:
1. Validates TCP connectivity and MySQL version.
2. Checks that `character_set_database` is `utf8mb4`.
3. Creates all 37 schema tables and 58 custom indexes via SQLAlchemy ORM.
4. Seeds the initial 9 Curated Target Role definitions and skills taxonomy.

### Option B: Alembic Database Migrations
If using Alembic migration versions:
```bash
cd backend
alembic upgrade head
```

---

## 5. Automated Backup & Disaster Recovery

### Online Non-Blocking Backups
CareerBridge includes `backend/scripts/backup_mysql.sh` which executes consistent point-in-time snapshots using MySQL's InnoDB single-transaction mode (causing zero read/write locks):

```bash
# Run manual backup
chmod +x backend/scripts/backup_mysql.sh
./backend/scripts/backup_mysql.sh
```

### Automated Daily Cron Schedule
Add to system crontab (`crontab -e`) to execute daily at 02:00 AM UTC with 14-day automatic rotation:
```cron
0 2 * * * /app/scripts/backup_mysql.sh >> /var/log/careerbridge_backup.log 2>&1
```

### Restoration Procedure
To restore from a compressed backup snapshot:
```bash
# 1. Uncompress and restore into database
gunzip < /var/backups/careerbridge/careerbridge_prod_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u cb_app_user -p careerbridge_prod

# 2. Run post-restore integrity check
python backend/scripts/setup_mysql_production.py
```

---

## 6. Security Checklist
- [x] Dedicated service user (`cb_app_user`) without `SUPER` or `GRANT OPTION` privileges.
- [x] Database port 3306 bound to private VPC subnet / internal docker network only.
- [x] SSL/TLS enforcement for all cross-network database traffic.
- [x] Passwords never committed to git repositories or Dockerfiles.
- [x] Automated daily compressed backups with retention cleanup.
- [x] Engine-level `utf8mb4` encoding for rich character support.

