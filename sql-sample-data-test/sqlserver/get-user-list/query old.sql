DECLARE @delay_seconds INT = ABS(CHECKSUM(NEWID())) % 10 + 1;
DECLARE @delay_time CHAR(8) =
  CONVERT(VARCHAR(8), DATEADD(SECOND, @delay_seconds, CAST('00:00:00' AS TIME)), 108);
WAITFOR DELAY @delay_time;

SELECT
  u.id,
  u.email,
  u.enabled,
  oa.access_code AS org_access,
  la.access_code AS location_access,
  o.name AS organization_name,
  l.name AS location_name,
  u.user_status,
  u.last_login_at
FROM dbo.users u
JOIN dbo.user_organization_access uoa ON uoa.user_id = u.id
JOIN dbo.organization_access oa ON oa.id = uoa.organization_access_id
JOIN dbo.organizations o ON o.id = oa.organization_id
JOIN dbo.user_location_access ula ON ula.user_id = u.id
JOIN dbo.location_access la ON la.id = ula.location_access_id
JOIN dbo.locations l ON l.id = la.location_id
WHERE (@id IS NULL OR u.id = @id)
  AND (@email IS NULL OR LOWER(u.email) LIKE '%' + LOWER(@email) + '%')
  AND (@enabled IS NULL OR u.enabled = @enabled)
  AND (@org_access IS NULL OR oa.access_code = @org_access)
  AND (@location_access IS NULL OR la.access_code = @location_access)
ORDER BY oa.access_code, la.access_code;
