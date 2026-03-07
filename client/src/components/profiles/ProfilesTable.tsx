import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Profile } from '../../models/profile';

interface ProfilesTableProps {
  profiles: Profile[];
  onOpenTestCases: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onParameters: (profile: Profile) => void;
}

function ProfilesTable(props: ProfilesTableProps) {
  const { profiles, onOpenTestCases, onEdit, onDelete } = props;

  if (profiles.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">No data.</Typography>
      </Paper>
    );
  }

  return (
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
                <Tooltip title="Edit">
                  <IconButton
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(profile);
                    }}
                    color="primary"
                  >
                    <EditOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(profile);
                    }}
                    color="error"
                  >
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProfilesTable;
