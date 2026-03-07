import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sqlApi } from '../apis/sqlApi';
import { testCaseApi } from '../apis/testCaseApi';
import type { TestCase } from '../models/testCase';

dayjs.extend(relativeTime);

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

function TestCasesPage() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const [items, setItems] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [runningTestCaseId, setRunningTestCaseId] = useState<string | null>(null);

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
        const result = await testCaseApi.getByProfileId(profileId);
        setItems(result.sort((a, b) => a.orderIndex - b.orderIndex));
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Load test cases failed');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchItems();
  }, [profileId]);

  const showToast = (message: string, severity: ToastState['severity']) => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  const handleDelete = async (item: TestCase) => {
    if (!window.confirm(`Delete test case "${item.name}"?`)) {
      return;
    }

    try {
      await testCaseApi.remove(item.id);
      setItems((current) => current.filter((testCase) => testCase.id !== item.id));
      showToast('Test case deleted successfully', 'success');
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : 'Delete test case failed',
        'error'
      );
    }
  };

  const handleRowClick = (item: TestCase) => {
    navigate(`/profiles/${profileId}/test-cases/${item.id}`);
  };

  const handleRunTestCase = async (item: TestCase) => {
    setRunningTestCaseId(item.id);
    try {
      const result = await sqlApi.runTestCase(item.id);
      setItems((current) =>
        current.map((testCase) =>
          testCase.id === item.id
            ? {
                ...testCase,
                executionCount: result.executionCount,
                status: result.status,
                error: result.error,
                executionDuration: result.executionDuration,
                executionTime: result.executionTime,
              }
            : testCase
        )
      );
      showToast(`Run "${item.name}" completed`, 'success');
    } catch (runError) {
      showToast(runError instanceof Error ? runError.message : 'Run test case failed', 'error');
    } finally {
      setRunningTestCaseId(null);
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
          <Typography variant="h4">Test Cases</Typography>
          <Typography color="text.secondary">Profile ID: {profileId}</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            variant="outlined"
            onClick={() => navigate('/profiles')}
          >
            Back to Profiles
          </Button>
          <Button
            startIcon={<TuneOutlinedIcon />}
            variant="outlined"
            onClick={() => navigate(`/profiles/${profileId}/parameters`)}
          >
            Edit SQL Parameters
          </Button>
          <Button
            startIcon={<AddCircleOutlineOutlinedIcon />}
            variant="contained"
            onClick={() => navigate(`/profiles/${profileId}/test-cases/new`)}
          >
            New Test Case
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading ? (
        <Stack alignItems="center" py={10}>
          <CircularProgress />
        </Stack>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>No test case found.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={120}>Order</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell width={120}>Enabled</TableCell>
                  <TableCell width={180}>Execution Duration</TableCell>
                  <TableCell width={220}>Execution Time</TableCell>
                  <TableCell width={160}>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <Tooltip
                    key={item.id}
                    arrow
                    placement="top-start"
                    title={
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          SQL Parameters
                        </Typography>
                        <Typography
                          component="pre"
                          sx={{
                            m: 0,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: 12,
                            maxWidth: 520,
                          }}
                        >
                          {item.parameter || '{}'}
                        </Typography>
                      </Stack>
                    }
                  >
                    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(item)}>
                      <TableCell>{item.orderIndex}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.enabled ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {item.executionDuration
                          ? `${item.executionDuration.toLocaleString()} ms`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.executionTime ? (
                          <Stack spacing={0.25}>
                            <Typography variant="body2">
                              {new Date(item.executionTime).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(item.executionTime).fromNow()}
                            </Typography>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{item.status ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Run">
                          <IconButton
                            color="primary"
                            disabled={runningTestCaseId === item.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleRunTestCase(item);
                            }}
                          >
                            <PlayArrowOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(item);
                            }}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Tooltip>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Total test cases: {items.length}
            </Typography>
            <Button variant="contained">Run All</Button>
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

export default TestCasesPage;
