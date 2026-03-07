import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sqlApi } from '../apis/sqlApi';
import { sqlParameterApi } from '../apis/sqlParameterApi';
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

function TestCaseUpsertPage() {
  const navigate = useNavigate();
  const { profileId, testCaseId } = useParams<{ profileId: string; testCaseId?: string }>();
  const isEditMode = useMemo(() => Boolean(testCaseId), [testCaseId]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [formValue, setFormValue] = useState<TestCaseFormInput>(defaultTestCaseFormInput);
  const [existingTestCase, setExistingTestCase] = useState<TestCase | null>(null);
  const [error, setError] = useState<string | null>(null);
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
            autoRunWhenSqlChanges: testCase.autoRunWhenSqlChanges,
          });
        } else {
          setExistingTestCase({
            id: '',
            profileId,
            orderIndex: cases.length,
            name: '',
            parameter: '',
            compareInOrder: false,
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
        const updatePayload = {
          profileId: existingTestCase.profileId,
          orderIndex: existingTestCase.orderIndex,
          name: formValue.name,
          parameter: formValue.parameter,
          compareInOrder: formValue.compareInOrder,
          autoRunWhenSqlChanges: existingTestCase.autoRunWhenSqlChanges,
          executionCount: existingTestCase.executionCount,
          status: existingTestCase.status,
          error: existingTestCase.error,
          executionDuration: existingTestCase.executionDuration,
          executionTime: existingTestCase.executionTime,
          enabled: formValue.enabled,
        };
        await testCaseApi.update(testCaseId, {
          ...updatePayload,
        });
      } else {
        await testCaseApi.create({
          profileId,
          orderIndex: existingTestCase.orderIndex,
          name: formValue.name,
          parameter: formValue.parameter,
          compareInOrder: formValue.compareInOrder,
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
      navigate(`/profiles/${profileId}/test-cases`);
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
            bgcolor: 'grey.50',
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValue.compareInOrder}
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        compareInOrder: event.target.checked,
                      }))
                    }
                  />
                }
                label="Compare in order"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formValue.enabled}
                    onChange={(event) =>
                      setFormValue((current) => ({
                        ...current,
                        enabled: event.target.checked,
                      }))
                    }
                  />
                }
                label="Enabled"
              />
            </Box>

            <Stack direction="row" spacing={1.5} justifyContent="space-between">
              <Stack direction="row" spacing={1.5}>
                {isEditMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowOutlinedIcon />}
                    onClick={() => void handleRun()}
                    disabled={isSaving || isRunning}
                    sx={{ minWidth: 160 }}
                  >
                    {isRunning ? 'Running...' : 'Run Test Case'}
                  </Button>
                ) : null}
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button
                  onClick={() => navigate(`/profiles/${profileId}/test-cases`)}
                  disabled={isSaving || isRunning}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving || isRunning}
                >
                  {isEditMode ? 'Save changes' : 'Create test case'}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Paper>

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
