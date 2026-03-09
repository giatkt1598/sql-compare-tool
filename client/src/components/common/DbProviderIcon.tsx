import { Box, Tooltip, type SvgIconProps } from '@mui/material';
import type { SqlProvider } from '../../models/profile';
import { connectionFieldConfigByProvider } from '../profiles/connection-fields/providerRegistry';

interface DbProviderIconProps extends SvgIconProps {
  provider?: SqlProvider | string | null;
  withTooltip?: boolean;
}

export default function DbProviderIcon({
  provider,
  withTooltip = false,
  ...iconProps
}: DbProviderIconProps) {
  const providerConfig =
    provider && provider in connectionFieldConfigByProvider
      ? connectionFieldConfigByProvider[provider as SqlProvider]
      : null;
  const ProviderIcon = providerConfig?.icon;
  const providerLabel = providerConfig?.label ?? provider ?? '';

  if (!ProviderIcon) {
    return null;
  }

  const icon = <ProviderIcon {...iconProps} />;

  if (!withTooltip) {
    return icon;
  }

  return (
    <Tooltip title={providerLabel} arrow>
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</Box>
    </Tooltip>
  );
}
