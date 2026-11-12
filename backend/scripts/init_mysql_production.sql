-- ==============================================================================
-- CareerBridge Production MySQL 8.0 Provisioning Script
-- Run as root or DBA user:
--   mysql -u root -p < init_mysql_production.sql
-- ==============================================================================

-- 1. Create Production Database with strict utf8mb4 encoding
CREATE DATABASE IF NOT EXISTS careerbridge_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Create Application Service User (Restricted privileges, no root access)
-- Replace 'CHANGE_ME_TO_A_VERY_SECURE_PASSWORD' before executing
CREATE USER IF NOT EXISTS 'cb_app_user'@'%'
  IDENTIFIED WITH mysql_native_password BY 'CHANGE_ME_TO_A_VERY_SECURE_PASSWORD';

-- 3. Grant Required DML and DDL permissions on application database
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES, LOCK TABLES
  ON careerbridge_prod.*
  TO 'cb_app_user'@'%';

-- 4. Apply privilege changes
FLUSH PRIVILEGES;

-- 5. Verification query
SELECT user, host, plugin FROM mysql.user WHERE user = 'cb_app_user';
SHOW VARIABLES LIKE 'character_set_database';
SHOW VARIABLES LIKE 'collation_database';

