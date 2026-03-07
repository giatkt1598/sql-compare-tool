import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import {
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { type MouseEvent, useState } from 'react';
import type { Profile } from '../../models/profile';

interface ProfilesTableProps {
  profiles: Profile[];
  onOpenTestCases: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onBackup: (profile: Profile) => void;
}

function ProfilesTable({
  profiles,
  onOpenTestCases,
  onEdit,
  onDelete,
  onBackup,
}: ProfilesTableProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>, profile: Profile) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveProfile(profile);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveProfile(null);
  };

  if (profiles.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">No data.</Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>DB Host</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow
                key={profile.id}
                hover
                onClick={() => onOpenTestCases(profile)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="subtitle2">{profile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profile.description || 'No description'}
                  </Typography>
                </TableCell>
                <TableCell>{profile.sqlProvider}</TableCell>
                <TableCell>{profile.sqlConnection.host}</TableCell>
                <TableCell>{new Date(profile.updatedAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={(event) => handleMenuOpen(event, profile)} color="default">
                    <MoreVertOutlinedIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            if (activeProfile) {
              onEdit(activeProfile);
            }
            handleMenuClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeProfile) {
              onDelete(activeProfile);
            }
            handleMenuClose();
          }}
        >
          Delete
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeProfile) {
              onBackup(activeProfile);
            }
            handleMenuClose();
          }}
        >
          Backup
        </MenuItem>
      </Menu>
    </>
  );
}

export default ProfilesTable;
