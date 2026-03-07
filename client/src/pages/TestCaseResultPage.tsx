import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sqlApi } from '../apis/sqlApi';

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

interface CombinedRow {
  index: number;
  diffType: 'added' | 'removed' | 'modified' | 'same';
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

function buildCombinedRows(oldRows: QueryRow[], newRows: QueryRow[]): CombinedRow[] {
  const maxLength = Math.max(oldRows.length, newRows.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const oldRecord = oldRows[index] ?? null;
    const newRecord = newRows[index] ?? null;

    if (oldRecord && !newRecord) {
      return { index, diffType: 'removed', oldRecord, newRecord };
    }

    if (!oldRecord && newRecord) {
      return { index, diffType: 'added', oldRecord, newRecord };
    }

    if (oldRecord && newRecord && JSON.stringify(oldRecord) !== JSON.stringify(newRecord)) {
      return { index, diffType: 'modified', oldRecord, newRecord };
    }

    return { index, diffType: 'same', oldRecord, newRecord };
  });
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

  if (!profileId || !testCaseId) {
    return <Alert severity="error">profileId and testCaseId are required</Alert>;
  }

  const combinedRows = data
    ? buildCombinedRows(data.oldRows, data.newRows).filter((row) => row.diffType !== 'same')
    : [];
  const schema = data
    ? Array.from(
        new Set([...data.oldRows, ...data.newRows].flatMap((row) => Object.keys(row ?? {})))
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <Chip
                label={`Status: ${data.status ?? '-'}`}
                color={
                  data.status === 'success'
                    ? 'success'
                    : data.status === 'error'
                      ? 'error'
                      : data.status === 'failed'
                        ? 'warning'
                        : 'default'
                }
              />
              <Typography variant="body2" color="text.secondary">
                Execution count: {data.executionCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execution duration:{' '}
                {typeof data.executionDuration === 'number'
                  ? `${data.executionDuration.toLocaleString()} ms`
                  : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Execution time:{' '}
                {data.executionTime ? new Date(data.executionTime).toLocaleString() : '-'}
              </Typography>

              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                startIcon={<PlayArrowOutlinedIcon />}
                onClick={() => void handleRunTestCase()}
                disabled={isRunning}
                sx={{ minWidth: 200 }}
              >
                {isRunning ? 'Test case is running...' : 'Run Test Case'}
              </Button>
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
