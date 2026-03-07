import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Box, Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import type { TestCaseFormInput } from '../../models/testCase';

interface TestCaseFormOptionsProps {
  value: TestCaseFormInput;
  onChange: (value: TestCaseFormInput) => void;
}

function TestCaseFormOptions({ value, onChange }: TestCaseFormOptionsProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={value.compareInOrder}
              onChange={(event) =>
                onChange({
                  ...value,
                  compareInOrder: event.target.checked,
                })
              }
            />
          }
          label="Compare in order"
          sx={{ mr: 0.5 }}
        />
        <Tooltip title="When enabled, the result comparison keeps the original row order. When disabled, the tool compares records without caring about row order.">
          <HelpOutlineOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={value.parallelExecution}
              onChange={(event) =>
                onChange({
                  ...value,
                  parallelExecution: event.target.checked,
                })
              }
            />
          }
          label="Parallel execution"
          sx={{ mr: 0.5 }}
        />
        <Tooltip title="Run old SQL and new SQL at the same time to reduce total execution time. This is faster, but it increases database load because both queries run concurrently.">
          <HelpOutlineOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
        </Tooltip>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={value.enabled}
            onChange={(event) =>
              onChange({
                ...value,
                enabled: event.target.checked,
              })
            }
          />
        }
        label="Enabled"
      />
    </Box>
  );
}

export default TestCaseFormOptions;
