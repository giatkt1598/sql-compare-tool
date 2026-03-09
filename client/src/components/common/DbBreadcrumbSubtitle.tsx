import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Stack, Typography } from '@mui/material';
import type { SqlProvider } from '../../models/profile';
import DbProviderIcon from './DbProviderIcon';

interface DbBreadcrumbSubtitleProps {
  provider?: SqlProvider | string | null;
  profileName?: string | null;
  tailLabel?: string | null;
  tailSegments?: string[];
}

export default function DbBreadcrumbSubtitle({
  provider,
  profileName,
  tailLabel,
  tailSegments,
}: DbBreadcrumbSubtitleProps) {
  const resolvedTailSegments =
    tailSegments && tailSegments.length > 0
      ? tailSegments.filter(Boolean)
      : tailLabel
        ? [tailLabel]
        : [];

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      color="text.secondary"
    >
      <DbProviderIcon provider={provider as SqlProvider} withTooltip sx={{ fontSize: 16 }} />
      {profileName ? <Typography color="inherit">{profileName}</Typography> : null}
      {resolvedTailSegments.map((segment, index) => (
        <Stack key={`${segment}-${index}`} direction="row" spacing={0.5} alignItems="center">
          {(profileName || index > 0) ? (
            <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
          ) : null}
          <Typography color="inherit">{segment}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
