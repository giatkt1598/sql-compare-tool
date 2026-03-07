import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
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

interface RunManyDialogState {
  open: boolean;
  scope: 'all' | 'enabled';
  runInParallel: 'yes' | 'no';
}

interface TestCaseStreamEvent {
  type: 'connected' | 'running' | 'completed' | 'error';
  testCaseId: string;
  status?: 'success' | 'failed' | 'running' | 'error' | null;
  executionCount?: number;
  executionTime?: string | null;
  message?: string;
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
  const [isRunManySubmitting, setIsRunManySubmitting] = useState(false);
  const [runManyDialog, setRunManyDialog] = useState<RunManyDialogState>({
    open: false,
    scope: 'enabled',
    runInParallel: 'no',
  });

  useEffect(() => {
    if (!profileId) {
      setError('profileId is required');
      setIsLoading(false);
      return;
    }

    void fetchItems(profileId);
  }, [profileId]);

  useEffect(() => {
    const eventSources = items.map((item) => {
      const eventSource = new EventSource(sqlApi.getTestCaseEventsUrl(item.id));
      const handleStreamEvent = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as TestCaseStreamEvent;
          if (!payload.testCaseId) {
            return;
          }

          if (payload.type === 'running') {
            setItems((current) =>
              current.map((testCase) =>
                testCase.id === payload.testCaseId
                  ? {
                      ...testCase,
                      status: 'running',
                      error: null,
                      executionTime: payload.executionTime ?? testCase.executionTime,
                      executionCount: payload.executionCount ?? testCase.executionCount,
                    }
                  : testCase
              )
            );
            return;
          }

          if (payload.type === 'completed' || payload.type === 'error') {
            void testCaseApi.getById(payload.testCaseId).then((latestTestCase) => {
              setItems((current) =>
                current.map((testCase) =>
                  testCase.id === latestTestCase.id ? latestTestCase : testCase
                )
              );
            });
          }
        } catch {
          // Ignore malformed event payloads.
        }
      };

      eventSource.addEventListener('running', handleStreamEvent);
      eventSource.addEventListener('completed', handleStreamEvent);
      eventSource.addEventListener('error', handleStreamEvent);

      return {
        eventSource,
        cleanup: () => {
          eventSource.removeEventListener('running', handleStreamEvent);
          eventSource.removeEventListener('completed', handleStreamEvent);
          eventSource.removeEventListener('error', handleStreamEvent);
          eventSource.close();
        },
      };
    });

    return () => {
      for (const current of eventSources) {
        current.cleanup();
      }
    };
  }, [items.map((item) => item.id).join('|')]);

  const fetchItems = async (profileId: string) => {
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
    navigate(`/profiles/${profileId}/test-cases/${item.id}/results`);
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
      if (result.success) {
        showToast(`Run "${item.name}" completed`, 'success');
      } else {
        showToast(result.error ?? result.message, 'error');
      }
    } catch (runError: any) {
      profileId && fetchItems(profileId);
      showToast(runError instanceof Error ? runError.message : 'Run test case failed', 'error');
    } finally {
      setRunningTestCaseId(null);
    }
  };

  const handleRunMany = async () => {
    if (!profileId) {
      return;
    }

    setIsRunManySubmitting(true);
    try {
      await sqlApi.runManyTestCases({
        profileId,
        scope: runManyDialog.scope,
        runInParallel: runManyDialog.runInParallel === 'yes',
      });
      setRunManyDialog((current) => ({ ...current, open: false }));
      showToast('Run many started', 'success');
    } catch (runManyError) {
      showToast(runManyError instanceof Error ? runManyError.message : 'Run many failed', 'error');
    } finally {
      setIsRunManySubmitting(false);
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
                        <Tooltip title="Edit">
                          <IconButton
                            color="default"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/profiles/${profileId}/test-cases/${item.id}/edit`);
                            }}
                          >
                            <EditOutlinedIcon />
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
            <Button
              variant="contained"
              onClick={() => setRunManyDialog((current) => ({ ...current, open: true }))}
            >
              Run Many
            </Button>
          </Stack>
        </Stack>
      )}

      <Dialog
        open={runManyDialog.open}
        onClose={() => {
          if (!isRunManySubmitting) {
            setRunManyDialog((current) => ({ ...current, open: false }));
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Test case will run?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Scope</Typography>
              <RadioGroup
                value={runManyDialog.scope}
                onChange={(event) =>
                  setRunManyDialog((current) => ({
                    ...current,
                    scope: event.target.value as 'all' | 'enabled',
                  }))
                }
              >
                <Stack direction="row" spacing={8}>
                  <FormControlLabel value="all" control={<Radio />} label="All" />
                  <FormControlLabel value="enabled" control={<Radio />} label="Only enabled" />
                </Stack>
              </RadioGroup>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Run in parallel?</Typography>
              <RadioGroup
                value={runManyDialog.runInParallel}
                onChange={(event) =>
                  setRunManyDialog((current) => ({
                    ...current,
                    runInParallel: event.target.value as 'yes' | 'no',
                  }))
                }
              >
                <Stack direction="row" spacing={8}>
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </Stack>
              </RadioGroup>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRunManyDialog((current) => ({ ...current, open: false }))}
            disabled={isRunManySubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleRunMany()}
            disabled={isRunManySubmitting}
          >
            Run Many
          </Button>
        </DialogActions>
      </Dialog>

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
