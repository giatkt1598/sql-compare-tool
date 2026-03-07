-- SQL Server setup script for SQL comparer testing
-- Run in SSMS / sqlcmd against the target database.

IF OBJECT_ID('dbo.user_location_access', 'U') IS NOT NULL DROP TABLE dbo.user_location_access;
IF OBJECT_ID('dbo.user_organization_access', 'U') IS NOT NULL DROP TABLE dbo.user_organization_access;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.location_access', 'U') IS NOT NULL DROP TABLE dbo.location_access;
IF OBJECT_ID('dbo.organization_access', 'U') IS NOT NULL DROP TABLE dbo.organization_access;
IF OBJECT_ID('dbo.locations', 'U') IS NOT NULL DROP TABLE dbo.locations;
IF OBJECT_ID('dbo.organizations', 'U') IS NOT NULL DROP TABLE dbo.organizations;

CREATE TABLE dbo.organizations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CONSTRAINT DF_organizations_status DEFAULT 'active',
  created_at DATETIME2 NOT NULL CONSTRAINT DF_organizations_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_organizations_updated_at DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.locations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  is_active BIT NOT NULL CONSTRAINT DF_locations_is_active DEFAULT 1,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_locations_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_locations_updated_at DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.organization_access (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  access_level VARCHAR(50) NOT NULL,
  can_manage_users BIT NOT NULL CONSTRAINT DF_organization_access_can_manage_users DEFAULT 0,
  enabled BIT NOT NULL CONSTRAINT DF_organization_access_enabled DEFAULT 1,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_organization_access_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_organization_access_updated_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_organization_access_organization
    FOREIGN KEY (organization_id) REFERENCES dbo.organizations(id) ON DELETE CASCADE
);

CREATE TABLE dbo.location_access (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  location_id BIGINT NOT NULL,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  access_scope VARCHAR(50) NOT NULL,
  can_export_data BIT NOT NULL CONSTRAINT DF_location_access_can_export_data DEFAULT 0,
  enabled BIT NOT NULL CONSTRAINT DF_location_access_enabled DEFAULT 1,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_location_access_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_location_access_updated_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_location_access_location
    FOREIGN KEY (location_id) REFERENCES dbo.locations(id) ON DELETE CASCADE
);

CREATE TABLE dbo.users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  enabled BIT NOT NULL CONSTRAINT DF_users_enabled DEFAULT 1,
  user_status VARCHAR(20) NOT NULL CONSTRAINT DF_users_status DEFAULT 'active',
  last_login_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.user_organization_access (
  user_id BIGINT NOT NULL,
  organization_access_id BIGINT NOT NULL,
  is_primary BIT NOT NULL CONSTRAINT DF_user_organization_access_is_primary DEFAULT 0,
  assigned_at DATETIME2 NOT NULL CONSTRAINT DF_user_organization_access_assigned_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_user_organization_access PRIMARY KEY (user_id, organization_access_id),
  CONSTRAINT FK_user_organization_access_user
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
  CONSTRAINT FK_user_organization_access_access
    FOREIGN KEY (organization_access_id) REFERENCES dbo.organization_access(id) ON DELETE CASCADE
);

CREATE TABLE dbo.user_location_access (
  user_id BIGINT NOT NULL,
  location_access_id BIGINT NOT NULL,
  source VARCHAR(30) NOT NULL CONSTRAINT DF_user_location_access_source DEFAULT 'manual',
  assigned_at DATETIME2 NOT NULL CONSTRAINT DF_user_location_access_assigned_at DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_user_location_access PRIMARY KEY (user_id, location_access_id),
  CONSTRAINT FK_user_location_access_user
    FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
  CONSTRAINT FK_user_location_access_access
    FOREIGN KEY (location_access_id) REFERENCES dbo.location_access(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_enabled ON dbo.users(enabled);
CREATE INDEX idx_users_email ON dbo.users(email);
CREATE INDEX idx_org_access_code ON dbo.organization_access(access_code);
CREATE INDEX idx_loc_access_code ON dbo.location_access(access_code);

INSERT INTO dbo.organizations (code, name, status) VALUES
  ('ORG_HQ', 'Headquarters', 'active'),
  ('ORG_DEV', 'Development Center', 'active'),
  ('ORG_LEGACY', 'Legacy Division', 'inactive');

INSERT INTO dbo.locations (code, name, region, timezone, is_active) VALUES
  ('LOC_SG', 'Sai Gon Office', 'APAC', 'Asia/Ho_Chi_Minh', 1),
  ('LOC_HN', 'Ha Noi Office', 'APAC', 'Asia/Ho_Chi_Minh', 1),
  ('LOC_US', 'US Branch', 'NA', 'America/Los_Angeles', 1),
  ('LOC_OLD', 'Old Warehouse', 'APAC', 'Asia/Ho_Chi_Minh', 0);

INSERT INTO dbo.organization_access (organization_id, access_code, access_level, can_manage_users, enabled) VALUES
  (1, 'ORG_ADMIN', 'admin', 1, 1),
  (1, 'ORG_READ', 'read', 0, 1),
  (2, 'DEV_ADMIN', 'admin', 1, 1),
  (3, 'LEGACY_READ', 'read', 0, 0);

INSERT INTO dbo.location_access (location_id, access_code, access_scope, can_export_data, enabled) VALUES
  (1, 'LOC_FULL', 'full', 1, 1),
  (2, 'LOC_READ', 'read', 0, 1),
  (3, 'LOC_US_FULL', 'full', 1, 1),
  (4, 'LOC_OLD_READ', 'read', 0, 0);

INSERT INTO dbo.users (username, email, full_name, phone, enabled, user_status, last_login_at) VALUES
  ('giatk', 'giatk@example.com', 'Gia TK', '0900000001', 1, 'active', DATEADD(DAY, -1, SYSUTCDATETIME())),
  ('admin_demo', 'admin@example.com', 'Admin Demo', '0900000002', 1, 'active', DATEADD(HOUR, -2, SYSUTCDATETIME())),
  ('legacy_user', 'legacy@example.com', 'Legacy User', '0900000003', 0, 'locked', DATEADD(DAY, -30, SYSUTCDATETIME())),
  ('newbie', 'newbie@example.com', 'New User', '0900000004', 1, 'pending', NULL);

INSERT INTO dbo.user_organization_access (user_id, organization_access_id, is_primary) VALUES
  (1, 1, 1),
  (1, 2, 0),
  (2, 3, 1),
  (3, 4, 1),
  (4, 2, 1);

INSERT INTO dbo.user_location_access (user_id, location_access_id, source) VALUES
  (1, 1, 'sync'),
  (1, 2, 'manual'),
  (2, 3, 'sync'),
  (3, 4, 'manual'),
  (4, 2, 'manual');
