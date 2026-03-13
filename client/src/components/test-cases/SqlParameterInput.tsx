import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import type { SqlParameter } from '../../models/sqlParameter';
import SqlParameterHelpDialog from './SqlParameterHelpDialog';

interface SqlParameterInputProps {
  value: string;
  sqlParameters: SqlParameter[];
  onChange: (nextValue: string) => void;
  defaultValue?: string;
}

function parseArrayInput(value: string): unknown[] | null {
  if (!value.trim().startsWith('[')) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    try {
      const parsed = new Function(`return (${value})`)() as unknown;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function parseCsvInput(value: string): unknown[] | null {
  if (!value.includes(',')) {
    return null;
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if ((char === '"' || char === "'") && (!inQuotes || char === quoteChar)) {
      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else {
        current += char;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim() !== '') {
    result.push(current.trim());
  }

  return result.length > 0 ? result : null;
}

function coerceParameterValue(value: unknown, dataType: SqlParameter['dataType']) {
  if (dataType === 'number') {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return { ok: true, value };
    }
    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? { ok: true, value: parsed } : { ok: false, value: null };
  }

  if (dataType === 'boolean') {
    if (typeof value === 'boolean') {
      return { ok: true, value };
    }
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true') {
      return { ok: true, value: true };
    }
    if (normalized === 'false') {
      return { ok: true, value: false };
    }
    return { ok: false, value: null };
  }

  if (dataType === 'json') {
    if (value && typeof value === 'object') {
      return { ok: true, value };
    }
    if (typeof value === 'string') {
      try {
        return { ok: true, value: JSON.parse(value) };
      } catch {
        return { ok: false, value: null };
      }
    }
    return { ok: false, value: null };
  }

  return { ok: true, value: String(value) };
}

function SqlParameterInput({
  value,
  sqlParameters,
  onChange,
  defaultValue,
}: SqlParameterInputProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const conversion = (() => {
    const raw = value.trim();
    if (!raw) {
      return { showButton: false, message: null as string | null, json: '' };
    }

    if (raw.startsWith('{')) {
      return { showButton: false, message: null as string | null, json: '' };
    }

    const parameters = [...sqlParameters].sort((a, b) => a.index - b.index);
    if (parameters.length === 0) {
      return { showButton: false, message: 'No SQL parameters configured', json: '' };
    }

    const looksLikeArray = raw.startsWith('[');
    const looksLikeCsv = raw.includes(',');
    const parsedArray = parseArrayInput(raw);
    const parsedCsv = parsedArray ? null : parseCsvInput(raw);
    const values = parsedArray ?? parsedCsv;

    if (!values) {
      if (!looksLikeArray && !looksLikeCsv) {
        return { showButton: false, message: null as string | null, json: '' };
      }
      return { showButton: false, message: 'Input does not match SQL parameters', json: '' };
    }

    if (values.length !== parameters.length) {
      return { showButton: false, message: 'Input does not match SQL parameters', json: '' };
    }

    const result: Record<string, unknown> = {};
    for (let index = 0; index < parameters.length; index += 1) {
      const parameter = parameters[index];
      const converted = coerceParameterValue(values[index], parameter.dataType);
      if (!converted.ok) {
        return { showButton: false, message: 'Input does not match SQL parameters', json: '' };
      }
      result[parameter.name] = converted.value;
    }

    return { showButton: true, message: null, json: JSON.stringify(result, null, 2) };
  })();

  return (
    <Stack spacing={1}>
      <TextField
        size="small"
        label="SQL Parameters"
        multiline
        minRows={10}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{
          formHelperText: {
            sx: { ml: 0 },
          },
        }}
        helperText={
          conversion.message ? (
            <Typography variant="caption" color="error">
              {conversion.message}
            </Typography>
          ) : (
            <span />
          )
        }
      />
      <Stack direction="row" spacing={0.5} alignItems="center" style={{ marginTop: 0 }}>
        <Typography variant="caption">JSON string for sql parameters</Typography>
        <Tooltip title="Show Help" placement="bottom">
          <IconButton
            size="small"
            aria-label="SQL parameters help"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Box flex={1} />
        <Button
          variant="text"
          sx={{ pr: 0, py: 0 }}
          onClick={() => {
            if (defaultValue !== undefined) {
              onChange(defaultValue);
            }
          }}
          disabled={defaultValue === undefined}
        >
          Reset to default
        </Button>
      </Stack>
      {conversion.showButton && (
        <Button variant="outlined" onClick={() => onChange(conversion.json)}>
          Convert to JSON
        </Button>
      )}
      <SqlParameterHelpDialog open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </Stack>
  );
}

export default SqlParameterInput;
