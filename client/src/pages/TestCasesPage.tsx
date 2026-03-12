import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PlaylistPlayOutlinedIcon from '@mui/icons-material/PlaylistPlayOutlined';
import SelectAllOutlinedIcon from '@mui/icons-material/SelectAllOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  FormControlLabel,
  Tooltip,
  TextField,
  Typography,
} from '@mui/material';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { profileApi } from '../apis/profileApi';
import { sqlApi } from '../apis/sqlApi';
import { sqlParameterApi } from '../apis/sqlParameterApi';
import { testCaseApi } from '../apis/testCaseApi';
import DbBreadcrumbSubtitle from '../components/common/DbBreadcrumbSubtitle';
import TestCaseExportButton from '../components/test-cases/TestCaseExportButton';
import TestCaseImportDialog from '../components/test-cases/TestCaseImportDialog';
import type { Profile } from '../models/profile';
import type { SqlParameter } from '../models/sqlParameter';
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
  maxConcurrency: string;
}

interface TestCaseStreamEvent {
  type: 'connected' | 'running' | 'completed' | 'error';
  testCaseId: string;
  status?: 'success' | 'failed' | 'running' | 'error' | null;
  executionCount?: number;
  executionTime?: string | null;
  message?: string;
}

type SortField =
  | 'name'
  | 'executionDuration'
  | 'executionTime'
  | 'parallelExecution'
  | 'status'
  | 'enabled';

type SortDirection = 'asc' | 'desc';

function TestCasesPage() {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const [items, setItems] = useState<TestCase[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sqlParameters, setSqlParameters] = useState<SqlParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [runningTestCaseId, setRunningTestCaseId] = useState<string | null>(null);
  const [isRunManySubmitting, setIsRunManySubmitting] = useState(false);
  const [updatingTestCaseIds, setUpdatingTestCaseIds] = useState<string[]>([]);
  const [runManyDialog, setRunManyDialog] = useState<RunManyDialogState>({
    open: false,
    scope: 'enabled',
    runInParallel: 'no',
    maxConcurrency: '8',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSortFieldParam = searchParams.get('sortField') ?? 'name';
  const initialSortDirectionParam = searchParams.get('sortDirection') ?? 'asc';
  const initialSortField: SortField = [
    'name',
    'executionDuration',
    'executionTime',
    'parallelExecution',
    'status',
    'enabled',
  ].includes(initialSortFieldParam)
    ? (initialSortFieldParam as SortField)
    : 'name';
  const initialSortDirection: SortDirection = initialSortDirectionParam === 'desc' ? 'desc' : 'asc';
  const [sortField, setSortField] = useState<SortField>(initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const initialPageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const initialRowsParam = Number.parseInt(searchParams.get('pageSize') ?? '10', 10);
  const [page, setPage] = useState(
    Number.isFinite(initialPageParam) && initialPageParam > 0 ? initialPageParam - 1 : 0
  );
  const [rowsPerPage, setRowsPerPage] = useState(
    Number.isFinite(initialRowsParam) && initialRowsParam > 0 ? initialRowsParam : 10
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  useEffect(() => {
    if (!profileId) {
      setError('profileId is required');
      setIsLoading(false);
      return;
    }

    void Promise.all([
      fetchItems(profileId),
      profileApi.getById(profileId),
      sqlParameterApi.getByProfileId(profileId),
    ])
      .then(([, nextProfile, nextSqlParameters]) => {
        setProfile(nextProfile);
        setSqlParameters(nextSqlParameters);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Load test cases failed');
      });
  }, [profileId]);

  useEffect(() => {
    if (!profileId) {
      return undefined;
    }

    const eventSource = new EventSource(sqlApi.getProfileTestCaseEventsUrl(profileId));
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

    return () => {
      eventSource.removeEventListener('running', handleStreamEvent);
      eventSource.removeEventListener('completed', handleStreamEvent);
      eventSource.removeEventListener('error', handleStreamEvent);
      eventSource.close();
    };
  }, [profileId]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const pageValue = String(page + 1);
    const rowsValue = String(rowsPerPage);
    const sortFieldValue = sortField;
    const sortDirectionValue = sortDirection;
    let didChange = false;

    if (nextParams.get('page') !== pageValue) {
      nextParams.set('page', pageValue);
      didChange = true;
    }

    if (nextParams.get('pageSize') !== rowsValue) {
      nextParams.set('pageSize', rowsValue);
      didChange = true;
    }

    if (nextParams.get('sortField') !== sortFieldValue) {
      nextParams.set('sortField', sortFieldValue);
      didChange = true;
    }

    if (nextParams.get('sortDirection') !== sortDirectionValue) {
      nextParams.set('sortDirection', sortDirectionValue);
      didChange = true;
    }

    if (didChange) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [page, rowsPerPage, sortField, sortDirection, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isAllSelected) {
      return;
    }

    setSelectedIds(items.map((item) => item.id));
  }, [isAllSelected, items]);

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
      setItems((current) => {
        const nextItems = current.filter((testCase) => testCase.id !== item.id);
        const nextPageCount = Math.max(1, Math.ceil(nextItems.length / rowsPerPage));
        const nextPageIndex = Math.min(page, nextPageCount - 1);
        if (nextPageIndex !== page) {
          setPage(nextPageIndex);
        }
        return nextItems;
      });
      showToast('Test case deleted successfully', 'success');
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : 'Delete test case failed',
        'error'
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} selected test case(s)?`)) {
      return;
    }

    try {
      const result = await testCaseApi.deleteMany(selectedIds);
      setItems((current) => {
        const deletedSet = new Set(result.deletedIds ?? selectedIds);
        const nextItems = current.filter((testCase) => !deletedSet.has(testCase.id));
        const nextPageCount = Math.max(1, Math.ceil(nextItems.length / rowsPerPage));
        const nextPageIndex = Math.min(page, nextPageCount - 1);
        if (nextPageIndex !== page) {
          setPage(nextPageIndex);
        }
        return nextItems;
      });
      setSelectedIds([]);
      setIsAllSelected(false);
      if (result.errors && result.errors.length > 0) {
        showToast(
          `Deleted ${result.deletedIds.length} test case(s), ${result.errors.length} failed`,
          'error'
        );
      } else {
        showToast('Selected test cases deleted', 'success');
      }
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : 'Delete selected test cases failed',
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
                latestResultSummary: result.diffSummary,
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
        maxConcurrency: Math.max(1, Number.parseInt(runManyDialog.maxConcurrency || '8', 10) || 8),
      });
      setRunManyDialog((current) => ({ ...current, open: false }));
      showToast('Run many started', 'success');
    } catch (runManyError) {
      showToast(runManyError instanceof Error ? runManyError.message : 'Run many failed', 'error');
    } finally {
      setIsRunManySubmitting(false);
    }
  };

  const setRowUpdating = (testCaseId: string, updating: boolean) => {
    setUpdatingTestCaseIds((current) => {
      if (updating) {
        return current.includes(testCaseId) ? current : [...current, testCaseId];
      }

      return current.filter((id) => id !== testCaseId);
    });
  };

  const handleToggleEnabled = async (item: TestCase, checked: boolean) => {
    setRowUpdating(item.id, true);
    try {
      const updated = await testCaseApi.update(item.id, {
        enabled: checked,
      });
      setItems((current) =>
        current.map((testCase) => (testCase.id === updated.id ? updated : testCase))
      );
    } catch (updateError) {
      showToast(
        updateError instanceof Error ? updateError.message : 'Update enabled failed',
        'error'
      );
    } finally {
      setRowUpdating(item.id, false);
    }
  };

  const handleToggleParallelExecution = async (item: TestCase, checked: boolean) => {
    setRowUpdating(item.id, true);
    try {
      const updated = await testCaseApi.update(item.id, {
        parallelExecution: checked,
      });
      setItems((current) =>
        current.map((testCase) => (testCase.id === updated.id ? updated : testCase))
      );
    } catch (updateError) {
      showToast(
        updateError instanceof Error ? updateError.message : 'Update parallel execution failed',
        'error'
      );
    } finally {
      setRowUpdating(item.id, false);
    }
  };

  const renderStatusChip = (status: TestCase['status']) => {
    if (status === 'success') {
      return <Chip label="Success" color="success" size="small" />;
    }

    if (status === 'failed') {
      return <Chip label="Failed" color="error" size="small" />;
    }

    if (status === 'error') {
      return <Chip label="Error" color="error" size="small" />;
    }

    if (status === 'running') {
      return <Chip label="Running" color="info" size="small" />;
    }

    return '-';
  };

  const renderStatusCell = (item: TestCase) => {
    const chip = renderStatusChip(item.status);

    if (item.status === 'error' && item.error) {
      return (
        <Tooltip title={item.error} arrow placement="top">
          <span>{chip}</span>
        </Tooltip>
      );
    }

    return chip;
  };

  const renderExecutionDurationCell = (item: TestCase) => {
    if (typeof item.executionDuration !== 'number') {
      return '-';
    }

    const label = `${item.executionDuration.toLocaleString()} ms`;
    const expected = item.expectedExecutionDuration;

    if (typeof expected !== 'number' || expected <= 0) {
      return label;
    }

    let color: 'success' | 'warning' | 'error' = 'success';
    if (item.executionDuration > expected) {
      color = 'error';
    } else if (item.executionDuration >= expected * 0.8) {
      color = 'warning';
    }

    return (
      <Tooltip title={`Expected: ${expected.toLocaleString()} ms`} arrow>
        <Typography variant="subtitle2" color={color} fontWeight={600}>
          {label}
        </Typography>
      </Tooltip>
    );
  };

  const renderRowsCountCell = (item: TestCase) => {
    const summary = item.latestResultSummary;
    const oldRowsLabel =
      typeof summary?.oldCount === 'number' ? summary.oldCount.toLocaleString() : '-';
    const newRowsLabel =
      typeof summary?.newCount === 'number' ? summary.newCount.toLocaleString() : '-';

    return (
      <Stack spacing={0.25}>
        <Typography variant="body2">Old Rows: {oldRowsLabel}</Typography>
        <Typography variant="body2">New Rows: {newRowsLabel}</Typography>
      </Stack>
    );
  };

  const handleSort = (field: SortField) => {
    setSortDirection((currentDirection) =>
      sortField === field ? (currentDirection === 'asc' ? 'desc' : 'asc') : 'asc'
    );
    setSortField(field);
    setPage(0);
  };

  const summary = useMemo(() => {
    const total = items.length;
    const totalSuccess = items.filter((item) => item.status === 'success').length;
    const totalFailed = items.filter((item) => item.status === 'failed').length;
    const totalError = items.filter((item) => item.status === 'error').length;
    const totalRunning = items.filter((item) => item.status === 'running').length;
    const durationValues = items
      .map((item) => item.executionDuration)
      .filter((value): value is number => typeof value === 'number' && value >= 0);
    const avgDuration =
      durationValues.length > 0
        ? Math.round(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
        : null;

    return {
      total,
      totalSuccess,
      totalFailed,
      totalError,
      totalRunning,
      avgDuration,
    };
  }, [items]);

  const sortedItems = useMemo(() => {
    const valueRank = (value: TestCase['status']) => {
      if (value === 'success') {
        return 4;
      }
      if (value === 'failed') {
        return 3;
      }
      if (value === 'error') {
        return 2;
      }
      if (value === 'running') {
        return 1;
      }
      return 0;
    };

    const sorted = [...items].sort((left, right) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = left.name.localeCompare(right.name);
      } else if (sortField === 'executionDuration') {
        comparison = (left.executionDuration ?? -1) - (right.executionDuration ?? -1);
      } else if (sortField === 'executionTime') {
        comparison =
          new Date(left.executionTime ?? 0).getTime() -
          new Date(right.executionTime ?? 0).getTime();
      } else if (sortField === 'parallelExecution') {
        comparison = Number(left.parallelExecution) - Number(right.parallelExecution);
      } else if (sortField === 'enabled') {
        comparison = Number(left.enabled) - Number(right.enabled);
      } else if (sortField === 'status') {
        comparison = valueRank(left.status) - valueRank(right.status);
      }

      if (comparison === 0) {
        comparison = left.orderIndex - right.orderIndex;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, sortDirection, sortField]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, sortedItems]);

  const allSelectedAcrossPages = items.length > 0 && selectedIds.length === items.length;
  const someSelectedAcrossPages = selectedIds.length > 0 && !allSelectedAcrossPages;

  if (!profileId) {
    return <Alert severity="error">profileId is required</Alert>;
  }

  const CheckBoxAll = () => (
    <Checkbox
      checked={allSelectedAcrossPages}
      indeterminate={someSelectedAcrossPages}
      onChange={(event) => {
        if (event.target.checked) {
          setSelectedIds(items.map((item) => item.id));
          setIsAllSelected(true);
        } else {
          setSelectedIds([]);
          setIsAllSelected(false);
        }
      }}
      slotProps={{
        input: { 'aria-label': 'select all test cases' },
      }}
    />
  );

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
          <DbBreadcrumbSubtitle
            provider={profile?.sqlProvider}
            profileName={profile?.name}
            tailLabel="Test Cases"
          />
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            variant="outlined"
            onClick={() => navigate('/profiles')}
          >
            Back to Profiles
          </Button>
          <Tooltip title="Edit SQL Parameters" placement="top">
            <IconButton
              color="primary"
              onClick={() => navigate(`/profiles/${profileId}/parameters`)}
            >
              <TuneOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export" placement="top">
            <span>
              <TestCaseExportButton
                profileId={profileId}
                onError={(message) => showToast(message, 'error')}
                onSuccess={(message) => showToast(message, 'success')}
                iconOnly
              />
            </span>
          </Tooltip>
          <Tooltip title="Import Excel" placement="top">
            <IconButton color="primary" onClick={() => setIsImportDialogOpen(true)}>
              <UploadFileOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="New Test Case" placement="top">
            <IconButton
              color="primary"
              onClick={() => navigate(`/profiles/${profileId}/test-cases/new`)}
            >
              <AddCircleOutlineOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Run Many Test Cases" placement="top">
            <IconButton
              color="primary"
              onClick={() => setRunManyDialog((current) => ({ ...current, open: true }))}
            >
              <PlaylistPlayOutlinedIcon />
            </IconButton>
          </Tooltip>
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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Total Test Cases
              </Typography>
              <Typography variant="h6">{summary.total}</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Avg Duration
              </Typography>
              <Typography variant="h6">
                {summary.avgDuration !== null ? `${summary.avgDuration.toLocaleString()} ms` : '-'}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Total Success
              </Typography>
              <Typography variant="h6" color="success.main">
                {summary.totalSuccess}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Total Failed
              </Typography>
              <Typography variant="h6" color="error.main">
                {summary.totalFailed}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Total Error
              </Typography>
              <Typography variant="h6" color="error.main">
                {summary.totalError}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Running
              </Typography>
              <Typography variant="h6" color="info.main">
                {summary.totalRunning}
              </Typography>
            </Paper>
          </Stack>

          <Paper sx={{ position: 'relative' }}>
            {selectedIds.length > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#C8FAD6',
                  color: '#00A76F',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  borderTopLeftRadius: 12,
                  paddingLeft: 0.5,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckBoxAll />
                  <Typography variant="subtitle2">{selectedIds.length} selected</Typography>
                </Stack>
                <Tooltip title="Delete" placement="top">
                  <IconButton color="primary" onClick={() => void handleDeleteSelected()}>
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
            <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <CheckBoxAll />
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'name'}
                        direction={sortField === 'name' ? sortDirection : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell width={140} padding="none">
                      <TableSortLabel
                        active={sortField === 'executionDuration'}
                        direction={sortField === 'executionDuration' ? sortDirection : 'asc'}
                        onClick={() => handleSort('executionDuration')}
                      >
                        Execute Duration
                      </TableSortLabel>
                    </TableCell>
                    <TableCell width={160}>
                      <TableSortLabel
                        active={sortField === 'executionTime'}
                        direction={sortField === 'executionTime' ? sortDirection : 'asc'}
                        onClick={() => handleSort('executionTime')}
                      >
                        Execute Time
                      </TableSortLabel>
                    </TableCell>
                    <TableCell width={160}>Rows Count</TableCell>
                    <TableCell width={130} padding="none" align="center">
                      <TableSortLabel
                        active={sortField === 'parallelExecution'}
                        direction={sortField === 'parallelExecution' ? sortDirection : 'asc'}
                        onClick={() => handleSort('parallelExecution')}
                      >
                        Execute Parallel
                      </TableSortLabel>
                    </TableCell>
                    <TableCell width={100}>
                      <TableSortLabel
                        active={sortField === 'status'}
                        direction={sortField === 'status' ? sortDirection : 'asc'}
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell width={50} padding={'none'}>
                      <TableSortLabel
                        active={sortField === 'enabled'}
                        direction={sortField === 'enabled' ? sortDirection : 'asc'}
                        onClick={() => handleSort('enabled')}
                      >
                        Enabled
                      </TableSortLabel>
                    </TableCell>
                    <TableCell width={160} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item) => (
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
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(item)}
                      >
                        <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setSelectedIds((current) =>
                                  current.includes(item.id) ? current : [...current, item.id]
                                );
                                setIsAllSelected(false);
                              } else {
                                setSelectedIds((current) => current.filter((id) => id !== item.id));
                                setIsAllSelected(false);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{renderExecutionDurationCell(item)}</TableCell>
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
                        <TableCell>{renderRowsCountCell(item)}</TableCell>

                        <TableCell>
                          <Checkbox
                            checked={item.parallelExecution}
                            disabled={updatingTestCaseIds.includes(item.id)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              void handleToggleParallelExecution(item, event.target.checked)
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{renderStatusCell(item)}</TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Switch
                            checked={item.enabled}
                            disabled={updatingTestCaseIds.includes(item.id)}
                            onChange={(event) =>
                              void handleToggleEnabled(item, event.target.checked)
                            }
                            size="small"
                          />
                        </TableCell>
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
            <TablePagination
              component="div"
              count={sortedItems.length}
              page={page}
              onPageChange={(_event, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Paper>
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

            <TextField
              size="small"
              label="Max concurrency"
              type="number"
              value={runManyDialog.maxConcurrency}
              onChange={(event) =>
                setRunManyDialog((current) => ({
                  ...current,
                  maxConcurrency: event.target.value,
                }))
              }
              inputProps={{ min: 1, step: 1 }}
              disabled={runManyDialog.runInParallel !== 'yes'}
              helperText="Maximum number of test cases to run at the same time"
            />
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

      <TestCaseImportDialog
        open={isImportDialogOpen}
        profileId={profileId}
        sqlParameters={sqlParameters}
        onClose={() => setIsImportDialogOpen(false)}
        onImported={() => {
          if (profileId) {
            void fetchItems(profileId);
          }
          showToast('Import completed', 'success');
        }}
      />

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
