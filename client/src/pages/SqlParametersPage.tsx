import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sqlParameterApi } from '../apis/sqlParameterApi';
import {
  sqlParameterDataTypes,
  type SqlParameter,
  type SqlParameterArrayItemInput,
} from '../models/sqlParameter';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

function createEmptyRow(nextIndex: number): SqlParameterArrayItemInput {
  return {
    index: nextIndex,
    name: `param_${nextIndex}`,
    dataType: 'string',
  };
}

function SqlParametersPage() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SqlParameterArrayItemInput[]>([]);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!profileId) {
      setError('profileId is required');
      setIsLoading(false);
      return;
    }

    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await sqlParameterApi.getByProfileId(profileId);
        const mapped = result
          .sort((a, b) => a.index - b.index)
          .map((item: SqlParameter) => ({
            id: item.id,
            index: item.index,
            name: item.name,
            dataType: item.dataType,
          }));
        setRows(mapped);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Load sql parameters failed');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchItems();
  }, [profileId]);

  const nextIndex = useMemo(() => {
    if (rows.length === 0) {
      return 1;
    }
    return Math.max(...rows.map((item) => item.index)) + 1;
  }, [rows]);

  const handleAddRow = () => {
    setRows((current) => [...current, createEmptyRow(nextIndex)]);
  };

  const handleRemoveRow = (targetIndex: number) => {
    setRows((current) => current.filter((_, index) => index !== targetIndex));
  };

  const handleUpdateRow = (rowIndex: number, patch: Partial<SqlParameterArrayItemInput>) => {
    setRows((current) =>
      current.map((item, index) => (index === rowIndex ? { ...item, ...patch } : item))
    );
  };

  const handleSaveAll = async () => {
    if (!profileId) {
      setError('profileId is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await sqlParameterApi.replaceByProfileId(profileId, rows);
      setRows(
        result
          .sort((a, b) => a.index - b.index)
          .map((item) => ({
            id: item.id,
            index: item.index,
            name: item.name,
            dataType: item.dataType,
          }))
      );
      setToast({
        open: true,
        message: 'Parameters saved successfully',
        severity: 'success',
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save parameters failed');
      setToast({
        open: true,
        message: saveError instanceof Error ? saveError.message : 'Save parameters failed',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!profileId) {
    return <Alert severity="error">profileId is required</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">SQL Parameters</Typography>
          <Typography color="text.secondary">Profile ID: {profileId}</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            variant="outlined"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            startIcon={<SaveOutlinedIcon />}
            variant="contained"
            onClick={() => void handleSaveAll()}
            disabled={isSaving || isLoading}
          >
            Save All
          </Button>
        </Stack>
      </Stack>

      <Paper
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          transition: 'background-color 220ms ease, border-color 220ms ease',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Field Array Mode: editing this table and clicking Save All will replace all SqlParameters
          of this profile on server.
        </Typography>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading ? (
        <Stack alignItems="center" py={10}>
          <CircularProgress />
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={140}>Index</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell width={220}>Data Type</TableCell>
                  <TableCell width={120} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary">
                        No parameter row. Click Add Row.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, rowIndex) => (
                    <TableRow key={row.id ?? `draft-${rowIndex}`} hover>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.index}
                          onChange={(event) =>
                            handleUpdateRow(rowIndex, {
                              index: Number.parseInt(event.target.value || '0', 10),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={row.name}
                          onChange={(event) =>
                            handleUpdateRow(rowIndex, {
                              name: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          select
                          fullWidth
                          value={row.dataType}
                          onChange={(event) =>
                            handleUpdateRow(rowIndex, {
                              dataType: event.target
                                .value as SqlParameterArrayItemInput['dataType'],
                            })
                          }
                        >
                          {sqlParameterDataTypes.map((dataType) => (
                            <MenuItem key={dataType} value={dataType}>
                              {dataType}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remove row">
                          <IconButton color="error" onClick={() => handleRemoveRow(rowIndex)}>
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              startIcon={<AddCircleOutlineOutlinedIcon />}
              variant="outlined"
              onClick={handleAddRow}
            >
              Add Row
            </Button>
          </Stack>
        </Stack>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          severity={toast.severity}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default SqlParametersPage;
