import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sqlApi } from '../apis/sqlApi';
import { testCaseApi } from '../apis/testCaseApi';
import dayjs from 'dayjs';

type QueryRow = Record<string, unknown>;

interface ResultDiffItem {
  index: number;
  type: 'changed' | 'onlyInOld' | 'onlyInNew';
  oldRecord: QueryRow | null;
  newRecord: QueryRow | null;
}

interface LatestTestCaseResult {
  testCaseId: string;
  profileId: string;
  name: string;
  enabled: boolean;
  compareInOrder: boolean;
  parallelExecution: boolean;
  autoRunWhenSqlChanges: boolean;
  executionCount: number;
  executionTime: string | null;
  executionDuration: number | null;
  status: 'success' | 'failed' | 'running' | 'error' | null;
  error: string | null;
  oldRows: QueryRow[];
  newRows: QueryRow[];
  diffPayload: {
    summary: {
      executionTime: string;
      parallelExecution?: boolean;
      oldSqlDuration?: number | null;
      newSqlDuration?: number | null;
      compareDuration?: number | null;
      error?: string;
      oldCount?: number;
      newCount?: number;
      differenceCount?: number;
      onlyInOldCount?: number;
      onlyInNewCount?: number;
      changedCount?: number;
      matched?: boolean;
    };
    differences: ResultDiffItem[];
  };
}

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

interface TestCaseStreamEvent {
  type: 'connected' | 'running' | 'completed' | 'error';
  testCaseId: string;
  status?: 'success' | 'failed' | 'running' | 'error' | null;
  executionCount?: number;
  executionTime?: string | null;
  message?: string;
  source?: 'manual' | 'auto';
}

interface CombinedRow {
  index: number;
  diffType: 'added' | 'removed' | 'modified';
  oldRecord: QueryRow | null;
  newRecord: QueryRow | null;
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function isSameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildCombinedRows(differences: ResultDiffItem[]): CombinedRow[] {
  return differences.map((difference) => ({
    index: difference.index,
    diffType:
      difference.type === 'onlyInOld'
        ? 'removed'
        : difference.type === 'onlyInNew'
          ? 'added'
          : 'modified',
    oldRecord: difference.oldRecord,
    newRecord: difference.newRecord,
  }));
}

function getRowBackground(diffType: CombinedRow['diffType']): string | undefined {
  if (diffType === 'removed') {
    return 'rgba(244, 67, 54, 0.08)';
  }

  if (diffType === 'added') {
    return 'rgba(76, 175, 80, 0.12)';
  }

  return undefined;
}

function getDiffLabel(diffType: CombinedRow['diffType']) {
  if (diffType === 'removed') {
    return (
      <Typography color="error" fontWeight={700} fontSize={12}>
        Removed
      </Typography>
    );
  }

  if (diffType === 'added') {
    return (
      <Typography color="success" fontWeight={700} fontSize={12}>
        Added
      </Typography>
    );
  }

  if (diffType === 'modified') {
    return (
      <Typography color="#f5d742" fontWeight={700} fontSize={12}>
        Modified
      </Typography>
    );
  }

  return <Typography>-</Typography>;
}

function TestCaseResultPage() {
  const navigate = useNavigate();
  const { profileId, testCaseId } = useParams<{ profileId: string; testCaseId: string }>();

  const [data, setData] = useState<LatestTestCaseResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoRunSaving, setIsAutoRunSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchResult = async (nextTestCaseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await sqlApi.getLatestTestCaseResult(nextTestCaseId);
      setData(result);
      setIsRunning(result.status === 'running');
      setPage(0);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Load latest result failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!testCaseId) {
      setError('testCaseId is required');
      setIsLoading(false);
      return;
    }

    void fetchResult(testCaseId);
  }, [testCaseId]);

  useEffect(() => {
    if (!testCaseId) {
      return;
    }

    const eventSource = new EventSource(sqlApi.getTestCaseEventsUrl(testCaseId));
    const handleStreamEvent = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as TestCaseStreamEvent;

        if (payload.type === 'running') {
          setRunError(null);
          setIsRunning(true);
          setToast({
            open: true,
            message: payload.message ?? 'The latest SQL execution is running.',
            severity: 'success',
          });
          setData((current) =>
            current
              ? {
                  ...current,
                  status: 'running',
                  error: null,
                  executionCount: payload.executionCount ?? current.executionCount,
                  executionTime: payload.executionTime ?? current.executionTime,
                }
              : current
          );
          return;
        }

        if (payload.type === 'completed' || payload.type === 'error') {
          setIsRunning(false);
          if (payload.type === 'completed') {
            setRunError(null);
          } else if (payload.message) {
            setRunError(payload.message);
          }

          void fetchResult(testCaseId);
        }
      } catch {
        // Ignore malformed event payloads.
      }
    };

    eventSource.addEventListener('running', handleStreamEvent);
    eventSource.addEventListener('completed', handleStreamEvent);
    eventSource.addEventListener('error', handleStreamEvent);

    return () => {
      eventSource.removeEventListener('running', handleStreamEvent);
      eventSource.removeEventListener('completed', handleStreamEvent);
      eventSource.removeEventListener('error', handleStreamEvent);
      eventSource.close();
    };
  }, [testCaseId]);

  if (!profileId || !testCaseId) {
    return <Alert severity="error">profileId and testCaseId are required</Alert>;
  }

  const combinedRows = data ? buildCombinedRows(data.diffPayload.differences) : [];
  const schema = data
    ? Array.from(
        new Set(
          [
            ...data.oldRows,
            ...data.newRows,
            ...data.diffPayload.differences.flatMap((item) => [
              item.oldRecord ?? {},
              item.newRecord ?? {},
            ]),
          ].flatMap((row) => Object.keys(row ?? {}))
        )
      )
    : [];
  const pagedRows = combinedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const latestRunError = runError ?? data?.error ?? data?.diffPayload.summary.error ?? null;

  const handleRunTestCase = async () => {
    if (!testCaseId) {
      return;
    }

    setIsRunning(true);
    setRunError(null);
    try {
      const result = await sqlApi.runTestCase(testCaseId);
      await fetchResult(testCaseId);
      if (result.success) {
        setToast({
          open: true,
          message: 'Test case run completed',
          severity: 'success',
        });
      } else {
        setRunError(result.error ?? result.message);
      }
    } catch (runTestCaseError) {
      setRunError(
        runTestCaseError instanceof Error ? runTestCaseError.message : 'Run test case failed'
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoRunChange = async (checked: boolean) => {
    if (!testCaseId) {
      return;
    }

    setIsAutoRunSaving(true);
    setRunError(null);
    try {
      const updated = await testCaseApi.update(testCaseId, {
        autoRunWhenSqlChanges: checked,
      });
      setData((current) =>
        current
          ? {
              ...current,
              autoRunWhenSqlChanges: updated.autoRunWhenSqlChanges,
            }
          : current
      );
      setToast({
        open: true,
        message: checked ? 'Auto run enabled' : 'Auto run disabled',
        severity: 'success',
      });
    } catch (updateError) {
      setRunError(
        updateError instanceof Error ? updateError.message : 'Update auto run setting failed'
      );
    } finally {
      setIsAutoRunSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">Latest Test Case Result</Typography>
          <Typography color="text.secondary">Test Case ID: {testCaseId}</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            variant="outlined"
            onClick={() => navigate(`/profiles/${profileId}/test-cases`)}
          >
            Back to Test Cases
          </Button>
          <Button
            startIcon={<EditOutlinedIcon />}
            variant="contained"
            onClick={() => navigate(`/profiles/${profileId}/test-cases/${testCaseId}/edit`)}
          >
            Edit Test Case
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading ? (
        <Stack alignItems="center" py={10}>
          <CircularProgress />
        </Stack>
      ) : !data ? (
        <Paper sx={{ p: 3 }}>
          <Typography>No result found.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent={'space-between'}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                    lg: 'repeat(8, minmax(0, 1fr))',
                  },
                  gap: 1.25,
                  alignItems: 'stretch',
                }}
              >
                <Box
                  sx={{
                    p: 1.25,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.75 }}>
                    <Chip
                      label={data.status ?? '-'}
                      color={
                        data.status === 'success'
                          ? 'success'
                          : data.status === 'error'
                            ? 'error'
                            : data.status === 'failed'
                              ? 'error'
                              : 'default'
                      }
                    />
                  </Box>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Execution Count
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {data.executionCount}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Parallel Execution
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {(data.diffPayload.summary.parallelExecution ?? data.parallelExecution)
                      ? 'On'
                      : 'Off'}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Execution Time
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {data.executionTime ? (
                      <Tooltip title={new Date(data.executionTime).toLocaleString()}>
                        <span>{dayjs(data.executionTime).fromNow()}</span>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Execution Duration
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {typeof data.executionDuration === 'number'
                      ? `${data.executionDuration.toLocaleString()} ms`
                      : '-'}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Old SQL Duration
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {typeof data.diffPayload.summary.oldSqlDuration === 'number'
                      ? `${data.diffPayload.summary.oldSqlDuration.toLocaleString()} ms`
                      : '-'}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    New SQL Duration
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {typeof data.diffPayload.summary.newSqlDuration === 'number'
                      ? `${data.diffPayload.summary.newSqlDuration.toLocaleString()} ms`
                      : '-'}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Compare Duration
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {typeof data.diffPayload.summary.compareDuration === 'number'
                      ? `${data.diffPayload.summary.compareDuration.toLocaleString()} ms`
                      : '-'}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="column" gap={0} sx={{}}>
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowOutlinedIcon />}
                    onClick={() => void handleRunTestCase()}
                    disabled={isRunning || isAutoRunSaving}
                    sx={{ minWidth: { xs: 200, xl: 160 } }}
                  >
                    {isRunning ? 'Test case is running...' : 'Run Test Case'}
                  </Button>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={data.autoRunWhenSqlChanges}
                      onChange={(event) => void handleAutoRunChange(event.target.checked)}
                      disabled={isAutoRunSaving}
                      size="small"
                    />
                  }
                  label="Auto run"
                  sx={{ mr: 0 }}
                />
              </Stack>
            </Stack>
            {latestRunError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {latestRunError}
              </Alert>
            ) : null}
          </Paper>

          <TableContainer component={Paper}>
            {combinedRows.length === 0 ? (
              <Stack alignItems="center" justifyContent="center" py={8}>
                <Typography color="text.secondary">No diff rows to display.</Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={120}>Diff</TableCell>
                    {schema.map((key) => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow
                      key={row.index}
                      sx={{ backgroundColor: getRowBackground(row.diffType) }}
                    >
                      <TableCell sx={{ fontWeight: 700 }}>{getDiffLabel(row.diffType)}</TableCell>
                      {schema.map((key) => {
                        const oldValue = row.oldRecord?.[key];
                        const newValue = row.newRecord?.[key];
                        const same = isSameValue(oldValue, newValue);
                        const showOldValue = row.oldRecord !== null;
                        const showNewValue = row.newRecord !== null;
                        const highlightChangedPair = showOldValue && showNewValue && !same;

                        if (same) {
                          return (
                            <TableCell key={key}>{stringifyValue(newValue ?? oldValue)}</TableCell>
                          );
                        }

                        return (
                          <TableCell key={key}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <div>
                                {row.oldRecord ? (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      display: 'inline-block',
                                      ...(highlightChangedPair
                                        ? {
                                            px: 0.5,
                                            py: 0.25,
                                            bgcolor: 'rgba(244, 67, 54, 0.14)',
                                            textDecoration: 'line-through',
                                            borderRadius: 0.75,
                                            mr: 0.75,
                                          }
                                        : {
                                            textDecoration: 'none',
                                          }),
                                    }}
                                  >
                                    {stringifyValue(oldValue)}
                                  </Typography>
                                ) : null}
                              </div>
                              <div>
                                {row.newRecord ? (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      display: 'inline-block',
                                      ...(highlightChangedPair
                                        ? {
                                            px: 0.5,
                                            py: 0.25,
                                            bgcolor: 'rgba(76, 175, 80, 0.18)',
                                            borderRadius: 0.75,
                                          }
                                        : null),
                                    }}
                                  >
                                    {stringifyValue(newValue)}
                                  </Typography>
                                ) : null}
                              </div>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {combinedRows.length > 0 ? (
              <TablePagination
                component="div"
                count={combinedRows.length}
                page={page}
                onPageChange={(_event, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            ) : null}
          </TableContainer>
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

export default TestCaseResultPage;
