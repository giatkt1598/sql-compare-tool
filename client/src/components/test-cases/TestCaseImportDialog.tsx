import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExcelJS from 'exceljs';
import { useMemo, useState, type ChangeEvent } from 'react';
import { testCaseApi } from '../../apis/testCaseApi';
import type { SqlParameter } from '../../models/sqlParameter';

const FIXED_COLUMNS = [
  'Name',
  'Compare In Order',
  'Parallel Execution',
  'Enabled',
  'Expected Execution Duration',
];

const FIXED_COLUMN_SET = new Set(FIXED_COLUMNS.map((item) => item.toLowerCase()));

interface ParsedRow {
  name: string;
  compareInOrder: boolean;
  parallelExecution: boolean;
  enabled: boolean;
  expectedExecutionDuration: number | null;
  parameter: Record<string, unknown>;
}

interface TestCaseImportDialogProps {
  open: boolean;
  profileId: string;
  sqlParameters: SqlParameter[];
  onClose: () => void;
  onImported: () => void;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').trim();
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', 'n', '0'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function TestCaseImportDialog({
  open,
  profileId,
  sqlParameters,
  onClose,
  onImported,
}: TestCaseImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [newNames, setNewNames] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parameterNames = useMemo(() => sqlParameters.map((item) => item.name), [sqlParameters]);

  const resetState = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setExistingNames([]);
    setNewNames([]);
    setError(null);
  };

  const handleClose = () => {
    if (!isParsing && !isImporting) {
      resetState();
      onClose();
    }
  };

  const buildTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TestCases');
    const headers = [...FIXED_COLUMNS, ...parameterNames];
    worksheet.addRow(headers);

    const headerRow = worksheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell, colNumber) => {
      const headerLabel = headers[colNumber - 1] ?? '';
      const isFixed = FIXED_COLUMN_SET.has(headerLabel.toLowerCase());
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isFixed ? 'FFEDEDED' : 'FFDFF6DD' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
      worksheet.getColumn(colNumber).width = Math.max(18, headerLabel.length + 4);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `test-cases-template.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const parseWorkbook = async (file: File) => {
    setIsParsing(true);
    setError(null);
    setExistingNames([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Worksheet not found in Excel file');
      }

      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values as Array<string | undefined>;
      const headerMap = new Map<string, number>();
      headers.forEach((header, index) => {
        if (index === 0) {
          return;
        }
        const label = normalizeHeader(header);
        if (!label) {
          return;
        }
        headerMap.set(label.toLowerCase(), index);
      });

      if (!headerMap.has('name')) {
        throw new Error('Missing "Name" column');
      }

      const rows: ParsedRow[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }
        const nameCellIndex = headerMap.get('name') as number;
        const rawName = normalizeHeader(row.getCell(nameCellIndex).value);
        if (!rawName) {
          return;
        }

        const compareInOrder = parseBoolean(
          row.getCell(headerMap.get('compare in order') ?? 0).value,
          false
        );
        const parallelExecution = parseBoolean(
          row.getCell(headerMap.get('parallel execution') ?? 0).value,
          true
        );
        const enabled = parseBoolean(row.getCell(headerMap.get('enabled') ?? 0).value, true);
        const expectedExecutionDuration = parseNumber(
          row.getCell(headerMap.get('expected execution duration') ?? 0).value
        );

        const parameter: Record<string, unknown> = {};
        parameterNames.forEach((paramName) => {
          const index = headerMap.get(paramName.toLowerCase());
          if (!index) {
            parameter[paramName] = null;
            return;
          }
          const cellValue = row.getCell(index).value;
          parameter[paramName] = cellValue === undefined ? null : cellValue;
        });

        rows.push({
          name: rawName,
          compareInOrder,
          parallelExecution,
          enabled,
          expectedExecutionDuration,
          parameter,
        });
      });

      setParsedRows(rows);
      const names = rows.map((item) => item.name);
      if (names.length > 0) {
        const preview = await testCaseApi.previewImport(profileId, names);
        setExistingNames(preview.existingNames);
        setNewNames(names.filter((name) => !preview.existingNames.includes(name)));
      }
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Failed to read Excel file');
      setParsedRows([]);
      setExistingNames([]);
      setNewNames([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      void parseWorkbook(file);
    } else {
      setParsedRows([]);
      setExistingNames([]);
    }
  };

  const handleImport = async () => {
    if (!parsedRows.length) {
      setError('No rows found to import');
      return;
    }

    setIsImporting(true);
    setError(null);
    try {
      await testCaseApi.importFromExcel(profileId, parsedRows);
      onImported();
      resetState();
      onClose();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Test Cases from Excel</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Import will upsert test cases. Existing test cases with the same name will be
            overwritten and their execution history will be reset.
          </Typography>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            onClick={() => void buildTemplate()}
          >
            Download Template
          </Button>

          <Stack spacing={1}>
            <Button variant="contained" component="label" startIcon={<UploadFileOutlinedIcon />}>
              Choose Excel File
              <input type="file" hidden accept=".xlsx" onChange={handleFileChange} />
            </Button>
            {selectedFile ? (
              <Typography variant="caption" color="text.secondary">
                Selected: {selectedFile.name}
              </Typography>
            ) : null}
          </Stack>

          {isParsing ? <Alert severity="info">Parsing file...</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {existingNames.length > 0 ? (
            <Alert severity="warning">
              The following test cases will be overwritten: {existingNames.join(', ')}
            </Alert>
          ) : null}
          {newNames.length > 0 ? (
            <Alert severity="success">New test cases to add: {newNames.join(', ')}</Alert>
          ) : null}

          <Divider />
          <Box>
            <Typography variant="subtitle2">Rows to import</Typography>
            <Typography variant="body2" color="text.secondary">
              {parsedRows.length}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isParsing || isImporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleImport()}
          disabled={isParsing || isImporting || parsedRows.length === 0}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
