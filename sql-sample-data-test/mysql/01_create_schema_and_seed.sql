-- MySQL setup script for SQL comparer testing

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_location_access;
DROP TABLE IF EXISTS user_organization_access;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS location_access;
DROP TABLE IF EXISTS organization_access;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS organizations;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE organizations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_access (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  access_level VARCHAR(50) NOT NULL,
  can_manage_users TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_organization_access_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE location_access (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  location_id BIGINT NOT NULL,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  access_scope VARCHAR(50) NOT NULL,
  can_export_data TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_location_access_location
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  user_status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_organization_access (
  user_id BIGINT NOT NULL,
  organization_access_id BIGINT NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, organization_access_id),
  CONSTRAINT fk_user_organization_access_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_organization_access_access
    FOREIGN KEY (organization_access_id) REFERENCES organization_access(id) ON DELETE CASCADE
);

CREATE TABLE user_location_access (
  user_id BIGINT NOT NULL,
  location_access_id BIGINT NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, location_access_id),
  CONSTRAINT fk_user_location_access_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_location_access_access
    FOREIGN KEY (location_access_id) REFERENCES location_access(id) ON DELETE CASCADE
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
  ('LOC_SG', 'Sai Gon Office', 'APAC', 'Asia/Ho_Chi_Minh', 1),
  ('LOC_HN', 'Ha Noi Office', 'APAC', 'Asia/Ho_Chi_Minh', 1),
  ('LOC_US', 'US Branch', 'NA', 'America/Los_Angeles', 1),
  ('LOC_OLD', 'Old Warehouse', 'APAC', 'Asia/Ho_Chi_Minh', 0);

INSERT INTO organization_access (organization_id, access_code, access_level, can_manage_users, enabled) VALUES
  (1, 'ORG_ADMIN', 'admin', 1, 1),
  (1, 'ORG_READ', 'read', 0, 1),
  (2, 'DEV_ADMIN', 'admin', 1, 1),
  (3, 'LEGACY_READ', 'read', 0, 0);

INSERT INTO location_access (location_id, access_code, access_scope, can_export_data, enabled) VALUES
  (1, 'LOC_FULL', 'full', 1, 1),
  (2, 'LOC_READ', 'read', 0, 1),
  (3, 'LOC_US_FULL', 'full', 1, 1),
  (4, 'LOC_OLD_READ', 'read', 0, 0);

INSERT INTO users (username, email, full_name, phone, enabled, user_status, last_login_at) VALUES
  ('giatk', 'giatk@example.com', 'Gia TK', '0900000001', 1, 'active', UTC_TIMESTAMP() - INTERVAL 1 DAY),
  ('admin_demo', 'admin@example.com', 'Admin Demo', '0900000002', 1, 'active', UTC_TIMESTAMP() - INTERVAL 2 HOUR),
  ('legacy_user', 'legacy@example.com', 'Legacy User', '0900000003', 0, 'locked', UTC_TIMESTAMP() - INTERVAL 30 DAY),
  ('newbie', 'newbie@example.com', 'New User', '0900000004', 1, 'pending', NULL);

INSERT INTO user_organization_access (user_id, organization_access_id, is_primary) VALUES
  (1, 1, 1),
  (1, 2, 0),
  (2, 3, 1),
  (3, 4, 1),
  (4, 2, 1);

INSERT INTO user_location_access (user_id, location_access_id, source) VALUES
  (1, 1, 'sync'),
  (1, 2, 'manual'),
  (2, 3, 'sync'),
  (3, 4, 'manual'),
  (4, 2, 'manual');
