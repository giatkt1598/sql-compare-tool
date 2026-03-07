-- Postgres setup script for SQL comparer testing
-- Run in psql: \i 'D:/sql-compare-data-test/01_create_schema_and_seed.sql'

BEGIN;

DROP TABLE IF EXISTS user_location_access;
DROP TABLE IF EXISTS user_organization_access;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS location_access;
DROP TABLE IF EXISTS organization_access;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS organizations;

CREATE TABLE organizations (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_access (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  access_level VARCHAR(50) NOT NULL,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE location_access (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  access_scope VARCHAR(50) NOT NULL,
  can_export_data BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  user_status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_organization_access (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_access_id BIGINT NOT NULL REFERENCES organization_access(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_access_id)
);

CREATE TABLE user_location_access (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_access_id BIGINT NOT NULL REFERENCES location_access(id) ON DELETE CASCADE,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, location_access_id)
);

CREATE INDEX idx_users_enabled ON users(enabled);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_org_access_code ON organization_access(access_code);
CREATE INDEX idx_loc_access_code ON location_access(access_code);

INSERT INTO organizations (code, name, status) VALUES
  ('ORG_HQ', 'Headquarters', 'active'),
  ('ORG_DEV', 'Development Center', 'active'),
  ('ORG_LEGACY', 'Legacy Division', 'inactive');

INSERT INTO locations (code, name, region, timezone, is_active) VALUES
  ('LOC_SG', 'Sai Gon Office', 'APAC', 'Asia/Ho_Chi_Minh', TRUE),
  ('LOC_HN', 'Ha Noi Office', 'APAC', 'Asia/Ho_Chi_Minh', TRUE),
  ('LOC_US', 'US Branch', 'NA', 'America/Los_Angeles', TRUE),
  ('LOC_OLD', 'Old Warehouse', 'APAC', 'Asia/Ho_Chi_Minh', FALSE);

INSERT INTO organization_access (organization_id, access_code, access_level, can_manage_users, enabled) VALUES
  (1, 'ORG_ADMIN', 'admin', TRUE, TRUE),
  (1, 'ORG_READ', 'read', FALSE, TRUE),
  (2, 'DEV_ADMIN', 'admin', TRUE, TRUE),
  (3, 'LEGACY_READ', 'read', FALSE, FALSE);

INSERT INTO location_access (location_id, access_code, access_scope, can_export_data, enabled) VALUES
  (1, 'LOC_FULL', 'full', TRUE, TRUE),
  (2, 'LOC_READ', 'read', FALSE, TRUE),
  (3, 'LOC_US_FULL', 'full', TRUE, TRUE),
  (4, 'LOC_OLD_READ', 'read', FALSE, FALSE);

INSERT INTO users (username, email, full_name, phone, enabled, user_status, last_login_at) VALUES
  ('giatk', 'giatk@example.com', 'Gia TK', '0900000001', TRUE, 'active', NOW() - INTERVAL '1 day'),
  ('admin_demo', 'admin@example.com', 'Admin Demo', '0900000002', TRUE, 'active', NOW() - INTERVAL '2 hours'),
  ('legacy_user', 'legacy@example.com', 'Legacy User', '0900000003', FALSE, 'locked', NOW() - INTERVAL '30 days'),
  ('newbie', 'newbie@example.com', 'New User', '0900000004', TRUE, 'pending', NULL);

INSERT INTO user_organization_access (user_id, organization_access_id, is_primary) VALUES
  (1, 1, TRUE),
  (1, 2, FALSE),
  (2, 3, TRUE),
  (3, 4, TRUE),
  (4, 2, TRUE);

INSERT INTO user_location_access (user_id, location_access_id, source) VALUES
  (1, 1, 'sync'),
  (1, 2, 'manual'),
  (2, 3, 'sync'),
  (3, 4, 'manual'),
  (4, 2, 'manual');

COMMIT;
