import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import { SvgIcon, type SvgIconProps } from '@mui/material';
import { siMysql, siPostgresql } from 'simple-icons';

export function SqlServerProviderIcon(props: SvgIconProps) {
  return <DnsRoundedIcon {...props} />;
}

export function PostgresProviderIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d={siPostgresql.path} />
    </SvgIcon>
  );
}

export function MySqlProviderIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d={siMysql.path} />
    </SvgIcon>
  );
}
