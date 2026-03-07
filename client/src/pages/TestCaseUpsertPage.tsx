import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sqlApi } from '../apis/sqlApi';
import { sqlParameterApi } from '../apis/sqlParameterApi';
import SqlQueryPreviewDialog, {
  type SqlQueryPreviewDialogValue,
} from '../components/test-cases/SqlQueryPreviewDialog';
import TestCaseFormOptions from '../components/test-cases/TestCaseFormOptions';
import { testCaseApi } from '../apis/testCaseApi';
import type { SqlParameter } from '../models/sqlParameter';
import {
  defaultTestCaseFormInput,
  type TestCase,
  type TestCaseFormInput,
} from '../models/testCase';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

function buildSampleJson(parameters: SqlParameter[]): string {
  const sample = parameters
    .sort((a, b) => a.index - b.index)
    .reduce<Record<string, unknown>>((acc, parameter) => {
      if (parameter.dataType === 'number') {
        acc[parameter.name] = 0;
      } else if (parameter.dataType === 'boolean') {
        acc[parameter.name] = false;
      } else if (parameter.dataType === 'json') {
        acc[parameter.name] = {};
      } else {
        acc[parameter.name] = '';
      }
      return acc;
    }, {});

  return JSON.stringify(sample, null, 2);
}

function getNextDefaultTestCaseName(cases: TestCase[]): string {
  const maxNumber = cases.reduce((currentMax, testCase) => {
    const matched = /^TC-(\d+)$/i.exec(testCase.name.trim());
    if (!matched) {
      return currentMax;
    }

    const parsed = Number.parseInt(matched[1], 10);
    if (Number.isNaN(parsed)) {
      return currentMax;
    }

    return Math.max(currentMax, parsed);
  }, 0);

  return `TC-${String(maxNumber + 1).padStart(3, '0')}`;
}

function TestCaseUpsertPage() {
  const navigate = useNavigate();
  const { profileId, testCaseId } = useParams<{ profileId: string; testCaseId?: string }>();
  const isEditMode = useMemo(() => Boolean(testCaseId), [testCaseId]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isBuildingQuery, setIsBuildingQuery] = useState(false);
  const [formValue, setFormValue] = useState<TestCaseFormInput>(defaultTestCaseFormInput);
  const [existingTestCase, setExistingTestCase] = useState<TestCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [queryTab, setQueryTab] = useState<'old' | 'new'>('old');
  const [queryPreview, setQueryPreview] = useState<SqlQueryPreviewDialogValue | null>(null);
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

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [parameters, cases] = await Promise.all([
          sqlParameterApi.getByProfileId(profileId),
          testCaseApi.getByProfileId(profileId),
        ]);

        if (isEditMode && testCaseId) {
          const testCase = await testCaseApi.getById(testCaseId);
          setExistingTestCase(testCase);
          setFormValue({
            name: testCase.name,
            parameter: testCase.parameter || buildSampleJson(parameters),
            enabled: testCase.enabled,
            compareInOrder: testCase.compareInOrder,
            parallelExecution: testCase.parallelExecution,
            autoRunWhenSqlChanges: testCase.autoRunWhenSqlChanges,
          });
        } else {
          const nextDefaultName = getNextDefaultTestCaseName(cases);
          setExistingTestCase({
            id: '',
            profileId,
            orderIndex: cases.length,
            name: '',
            parameter: '',
            compareInOrder: false,
            parallelExecution: true,
            autoRunWhenSqlChanges: false,
            executionCount: 0,
            status: null,
            error: null,
            executionDuration: null,
            executionTime: null,
            enabled: true,
            createdAt: '',
            updatedAt: '',
          });
          setFormValue({
            ...defaultTestCaseFormInput,
            name: nextDefaultName,
            parameter: buildSampleJson(parameters),
          });
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Load test case data failed');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [profileId, isEditMode, testCaseId]);

  const handleSubmit = async () => {
    if (!profileId || !existingTestCase) {
      setError('Invalid state to save test case');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (isEditMode && testCaseId) {
        await testCaseApi.update(testCaseId, {
          name: formValue.name,
          parameter: formValue.parameter,
          compareInOrder: formValue.compareInOrder,
          parallelExecution: formValue.parallelExecution,
          enabled: formValue.enabled,
        });
      } else {
        await testCaseApi.create({
          profileId,
          orderIndex: existingTestCase.orderIndex,
          name: formValue.name,
          parameter: formValue.parameter,
          compareInOrder: formValue.compareInOrder,
          parallelExecution: formValue.parallelExecution,
          autoRunWhenSqlChanges: false,
          executionCount: 0,
          enabled: formValue.enabled,
          status: null,
          error: null,
          executionDuration: null,
          executionTime: null,
        });
      }

      setToast({
        open: true,
        message: isEditMode ? 'Test case updated successfully' : 'Test case created successfully',
        severity: 'success',
      });
      navigate(-1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Save test case failed');
      setToast({
        open: true,
        message: submitError instanceof Error ? submitError.message : 'Save test case failed',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!profileId || !testCaseId || !existingTestCase) {
      setError('Only saved test cases can be run');
      return;
    }

    setIsRunning(true);
    setError(null);
    try {
      const result = await sqlApi.runTestCase(testCaseId, {
        name: formValue.name,
        parameter: formValue.parameter,
        enabled: formValue.enabled,
        compareInOrder: formValue.compareInOrder,
        parallelExecution: formValue.parallelExecution,
      });

      setExistingTestCase((current) =>
        current
          ? {
              ...current,
              executionCount: result.executionCount,
              status: result.status,
              error: result.error,
              executionDuration: result.executionDuration,
              executionTime: result.executionTime,
            }
          : current
      );

      setToast({
        open: true,
        message: 'Test case run completed',
        severity: 'success',
      });
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Run test case failed';
      setError(message);
      setToast({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleBuildSqlQuery = async () => {
    if (!testCaseId) {
      setError('Only saved test cases can build SQL preview');
      return;
    }

    setIsBuildingQuery(true);
    setError(null);
    try {
      const result = await sqlApi.buildTestCaseQuery(testCaseId, {
        name: formValue.name,
        parameter: formValue.parameter,
        enabled: formValue.enabled,
        compareInOrder: formValue.compareInOrder,
        parallelExecution: formValue.parallelExecution,
      });

      setQueryPreview({
        sqlProvider: result.sqlProvider,
        oldSql: result.oldSql,
        newSql: result.newSql,
        oldSqlFilePath: result.oldSqlFilePath,
        newSqlFilePath: result.newSqlFilePath,
      });
      setQueryTab('old');
      setIsQueryDialogOpen(true);
    } catch (buildError) {
      const message = buildError instanceof Error ? buildError.message : 'Build SQL query failed';
      setError(message);
      setToast({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setIsBuildingQuery(false);
    }
  };

  if (!profileId) {
    return <Alert severity="error">profileId is required</Alert>;
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ minHeight: 'calc(100vh - 160px)', justifyContent: 'center' }}>
      <Stack direction="row">
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Stack>

      <Paper
        sx={{
          width: { xs: '100%', md: 960 },
          maxWidth: '100%',
          mx: 'auto',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
            transition: 'background-color 220ms ease, border-color 220ms ease',
          }}
        >
          <Typography variant="h6">{isEditMode ? 'Edit Test Case' : 'New Test Case'}</Typography>
          <Typography variant="body2" color="text.secondary">
            Profile: {profileId}
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <TextField
              size="small"
              label="Name"
              value={formValue.name}
              onChange={(event) =>
                setFormValue((current) => ({ ...current, name: event.target.value }))
              }
            />

            <TextField
              size="small"
              label="SQL Parameters"
              multiline
              minRows={10}
              value={formValue.parameter}
              onChange={(event) =>
                setFormValue((current) => ({
                  ...current,
                  parameter: event.target.value,
                }))
              }
              helperText="JSON string for sql parameters"
            />
            <TestCaseFormOptions value={formValue} onChange={setFormValue} />

            <Stack direction="row" spacing={1.5} justifyContent="space-between">
              <Stack direction="row" spacing={1.5}>
                {isEditMode ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<PlayArrowOutlinedIcon />}
                      onClick={() => void handleRun()}
                      disabled={isSaving || isRunning || isBuildingQuery}
                      sx={{ minWidth: 160 }}
                    >
                      {isRunning ? 'Running...' : 'Run Test Case'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => void handleBuildSqlQuery()}
                      disabled={isSaving || isRunning || isBuildingQuery}
                      sx={{ minWidth: 180 }}
                    >
                      {isBuildingQuery ? 'Building...' : 'Preview SQL Query'}
                    </Button>
                  </>
                ) : null}
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button onClick={() => navigate(-1)} disabled={isSaving || isRunning}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving || isRunning || isBuildingQuery}
                >
                  {isEditMode ? 'Save changes' : 'Create test case'}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <SqlQueryPreviewDialog
        open={isQueryDialogOpen}
        value={queryPreview}
        activeTab={queryTab}
        onClose={() => setIsQueryDialogOpen(false)}
        onTabChange={setQueryTab}
        onValueChange={setQueryPreview}
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

export default TestCaseUpsertPage;
