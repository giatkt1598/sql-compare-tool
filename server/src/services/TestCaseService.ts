import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import AdmZip from 'adm-zip';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import TestCaseAutoRunService from './TestCaseAutoRunService';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '../types/testCase';
import type TestCase from '../models/TestCase';

interface LatestResultSummary {
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
}

class TestCaseService {
  getAll() {
    return TestCaseRepository.getAll().map((testCase) =>
      this.enrichWithLatestResultSummary(testCase)
    );
  }

  getById(id: string) {
    const testCase = TestCaseRepository.getById(id);
    if (!testCase) {
      throw new Error(`TestCase with ID ${id} not found`);
    }
    return this.enrichWithLatestResultSummary(testCase);
  }

  getByProfileId(profileId: string) {
    return TestCaseRepository.getByProfileId(profileId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((testCase) => this.enrichWithLatestResultSummary(testCase));
  }

  create(data: CreateTestCaseInput) {
    const profile = ProfileRepository.getById(data.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${data.profileId} not found`);
    }

    const duplicated = TestCaseRepository.getByProfileIdAndOrderIndex(
      data.profileId,
      data.orderIndex
    );
    if (duplicated) {
      throw new Error(
        `TestCase orderIndex ${data.orderIndex} already exists for profile ${data.profileId}`
      );
    }

    const created = TestCaseRepository.add(data);
    TestCaseAutoRunService.syncTestCase(created.id);
    return this.enrichWithLatestResultSummary(created);
  }

  update(id: string, data: UpdateTestCaseInput) {
    const existing = TestCaseRepository.getById(id);
    if (!existing) {
      throw new Error(`TestCase with ID ${id} not found`);
    }

    const nextProfileId = data.profileId ?? existing.profileId;
    const nextOrderIndex = data.orderIndex ?? existing.orderIndex;

    const profile = ProfileRepository.getById(nextProfileId);
    if (!profile) {
      throw new Error(`Profile with ID ${nextProfileId} not found`);
    }

    const duplicated = TestCaseRepository.getByProfileIdAndOrderIndex(
      nextProfileId,
      nextOrderIndex
    );
    if (duplicated && duplicated.id !== id) {
      throw new Error(
        `TestCase orderIndex ${nextOrderIndex} already exists for profile ${nextProfileId}`
      );
    }

    const updated = TestCaseRepository.update(id, data);
    TestCaseAutoRunService.syncTestCase(updated.id);
    if (existing.profileId !== updated.profileId) {
      TestCaseAutoRunService.syncByProfileId(existing.profileId);
    }
    return this.enrichWithLatestResultSummary(updated);
  }

  delete(id: string) {
    const existing = TestCaseRepository.getById(id);
    if (!existing) {
      throw new Error(`TestCase with ID ${id} not found`);
    }

    const profile = ProfileRepository.getById(existing.profileId);
    if (profile) {
      const testCaseResultsDir = path.join(FILE_PATHS.RESULTS, profile.id, existing.id);
      if (fs.existsSync(testCaseResultsDir)) {
        fs.rmSync(testCaseResultsDir, { recursive: true, force: true });
      }
    }

    TestCaseAutoRunService.removeTestCase(id);
    TestCaseRepository.delete(id);
    return { message: 'TestCase deleted successfully', id };
  }

  deleteMany(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
    if (uniqueIds.length === 0) {
      throw new Error('ids is required');
    }

    const deletedIds: string[] = [];
    const errors: Array<{ id: string; message: string }> = [];

    for (const id of uniqueIds) {
      try {
        this.delete(id);
        deletedIds.push(id);
      } catch (error) {
        errors.push({
          id,
          message: error instanceof Error ? error.message : 'Unexpected error',
        });
      }
    }

    return {
      message: 'Delete many completed',
      deletedIds,
      errors,
    };
  }

  previewImport(profileId: string, names: string[]) {
    const profile = ProfileRepository.getById(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    const existing = TestCaseRepository.getByProfileId(profileId);
    const normalizedNames = names
      .map((name) => String(name ?? '').trim())
      .filter((name) => name.length > 0);
    const existingNames = normalizedNames.filter((name) =>
      existing.some((testCase) => testCase.name === name)
    );

    return { existingNames };
  }

  importFromExcel(
    profileId: string,
    rows: Array<{
      name?: string;
      compareInOrder?: boolean;
      parallelExecution?: boolean;
      enabled?: boolean;
      expectedExecutionDuration?: number | null;
      parameter?: Record<string, unknown>;
    }>
  ) {
    const profile = ProfileRepository.getById(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    const existing = TestCaseRepository.getByProfileId(profileId);
    const existingByName = new Map(existing.map((item) => [item.name, item]));
    let nextOrderIndex = 0;
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const name = String(row.name ?? '').trim();
      if (!name) {
        continue;
      }

      const parameterJson = JSON.stringify(row.parameter ?? {}, null, 2);
      const basePayload = {
        profileId,
        orderIndex: nextOrderIndex,
        name,
        parameter: parameterJson,
        compareInOrder: row.compareInOrder ?? false,
        parallelExecution: row.parallelExecution ?? true,
        expectedExecutionDuration:
          row.expectedExecutionDuration === undefined ? null : row.expectedExecutionDuration,
        enabled: row.enabled ?? true,
        executionCount: 0,
        status: null,
        error: null,
        executionDuration: null,
        executionTime: null,
      };

      const existingTestCase = existingByName.get(name);
      if (existingTestCase) {
        TestCaseRepository.update(existingTestCase.id, {
          ...basePayload,
          autoRunWhenSqlChanges: existingTestCase.autoRunWhenSqlChanges,
        });
        updated += 1;

        const testCaseResultsDir = path.join(FILE_PATHS.RESULTS, profileId, existingTestCase.id);
        if (fs.existsSync(testCaseResultsDir)) {
          fs.rmSync(testCaseResultsDir, { recursive: true, force: true });
        }
      } else {
        TestCaseRepository.add({
          ...basePayload,
          autoRunWhenSqlChanges: false,
        });
        created += 1;
      }

      nextOrderIndex += 1;
    }

    TestCaseAutoRunService.syncByProfileId(profileId);
    return { created, updated };
  }

  async exportReport(profileId: string): Promise<{ fileName: string; buffer: Buffer }> {
    const profile = ProfileRepository.getById(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    const testCases = this.getByProfileId(profileId);
    const stats = this.buildSummaryStats(testCases);
    const oldSqlContent = this.resolveSqlContent(profile.oldSqlContent, profile.oldSqlFilePath);
    const newSqlContent = this.resolveSqlContent(profile.newSqlContent, profile.newSqlFilePath);

    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { key: 'field', width: 32 },
      { key: 'value', width: 120 },
    ];

    summarySheet.addRow(['Test Case Summary Report']);
    summarySheet.mergeCells('A1:B1');
    const summaryTitleCell = summarySheet.getCell('A1');
    summaryTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    summaryTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D3748' },
    };
    summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 24;

    summarySheet.addRows([
      { field: 'Profile Name', value: profile.name },
      { field: 'Profile ID', value: profile.id },
      { field: 'SQL Provider', value: profile.sqlProvider },
      { field: 'Old SQL File Path', value: profile.oldSqlFilePath || 'Inline SQL' },
      { field: 'New SQL File Path', value: profile.newSqlFilePath || 'Inline SQL' },
      { field: 'Old SQL Content', value: oldSqlContent || '' },
      { field: 'New SQL Content', value: newSqlContent || '' },
      { field: 'Total Test Cases', value: stats.total },
      { field: 'Total Success', value: stats.totalSuccess },
      { field: 'Total Failed', value: stats.totalFailed },
      { field: 'Total Error', value: stats.totalError },
      { field: 'Total Running', value: stats.totalRunning },
      {
        field: 'Average Execution Duration (ms)',
        value: stats.avgDuration !== null ? stats.avgDuration : '',
      },
      { field: 'Exported At', value: new Date().toISOString() },
    ]);

    summarySheet.getColumn('value').alignment = { wrapText: true, vertical: 'top' };

    for (let rowIndex = 1; rowIndex <= summarySheet.rowCount; rowIndex += 1) {
      const row = summarySheet.getRow(rowIndex);
      const label = String(row.getCell(1).value ?? '');
      if (label.startsWith('Total ') || label === 'Average Execution Duration (ms)') {
        for (let cellIndex = 1; cellIndex <= row.cellCount; cellIndex += 1) {
          row.getCell(cellIndex).alignment = {
            ...row.getCell(cellIndex).alignment,
            horizontal: 'left',
          };
        }
      }
    }

    this.applyTableBorders(summarySheet, 2, summarySheet.rowCount, 1, 2);

    const testCaseSheet = workbook.addWorksheet('Test Cases');
    testCaseSheet.addRow(['Test Case Details']);
    const testCaseTitleCell = testCaseSheet.getCell('A1');
    testCaseTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    testCaseTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2D3748' },
    };
    testCaseTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    testCaseSheet.getRow(1).height = 24;

    const parameterKeys = this.collectParameterKeys(testCases);
    const columns = [
      { header: 'Name', key: 'name', width: 36 },
      { header: 'Execution Duration (ms)', key: 'duration', width: 24 },
      { header: 'Row Count (Old)', key: 'oldCount', width: 18 },
      { header: 'Row Count (New)', key: 'newCount', width: 18 },
      ...parameterKeys.map((key) => ({ header: key, key, width: 20 })),
      { header: 'Status', key: 'status', width: 16 },
    ];
    const headerRowIndex = testCaseSheet.rowCount + 1;
    testCaseSheet.addRow(columns.map((col) => col.header));
    testCaseSheet.columns = columns.map(({ header: _header, ...rest }) => rest);
    testCaseSheet.mergeCells(1, 1, 1, columns.length);

    const headerRow = testCaseSheet.getRow(headerRowIndex);
    headerRow.font = { bold: true, color: { argb: 'FF1F2937' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    headerRow.height = 20;

    headerRow.eachCell((cell, colNumber) => {
      const isFixedColumn = colNumber <= 4 || colNumber === columns.length;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isFixedColumn ? 'FFE5E7EB' : 'FFD1FAE5' },
      };
    });

    for (const testCase of testCases) {
      const parameterValues = this.parseParameterValues(testCase.parameter ?? '');
      const rowValues: Record<string, unknown> = {
        name: testCase.name,
        duration: testCase.executionDuration ?? '',
        oldCount: testCase.latestResultSummary?.oldCount ?? '',
        newCount: testCase.latestResultSummary?.newCount ?? '',
        status: testCase.status ?? '',
      };

      for (const key of parameterKeys) {
        rowValues[key] = parameterValues[key] ?? '';
      }

      const addedRow = testCaseSheet.addRow(rowValues);
      const statusCell = addedRow.getCell(columns.length);
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.getStatusFillColor(testCase.status) },
      };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    this.applyTableBorders(
      testCaseSheet,
      headerRowIndex,
      testCaseSheet.rowCount,
      1,
      columns.length
    );

    const reportBaseName = this.buildReportBaseName(profile.name);
    const excelFileName = `${reportBaseName}.xlsx`;
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const zip = new AdmZip();
    zip.addFile(
      excelFileName,
      Buffer.isBuffer(excelBuffer) ? excelBuffer : Buffer.from(excelBuffer)
    );

    const resultsDir = path.join(FILE_PATHS.RESULTS, profile.id);
    if (fs.existsSync(resultsDir)) {
      this.addArtifactsToZip(zip, resultsDir);
    }

    return {
      fileName: `${reportBaseName}.zip`,
      buffer: zip.toBuffer(),
    };
  }

  private enrichWithLatestResultSummary(testCase: TestCase) {
    const latestResultSummary = this.getLatestResultSummary(
      testCase.profileId,
      testCase.id,
      testCase.executionCount
    );

    return {
      ...testCase.toJSON(),
      latestResultSummary,
    };
  }

  private resolveSqlContent(inlineContent?: string, filePath?: string): string {
    if (inlineContent && inlineContent.trim()) {
      return inlineContent;
    }

    if (!filePath) {
      return '';
    }

    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
    } catch {
      return '';
    }

    return '';
  }

  private collectParameterKeys(testCases: Array<{ parameter?: string | null }>): string[] {
    const keys = new Set<string>();
    for (const testCase of testCases) {
      const values = this.parseParameterValues(testCase.parameter ?? '');
      Object.keys(values).forEach((key) => keys.add(key));
    }
    return Array.from(keys);
  }

  private parseParameterValues(parameter: string): Record<string, unknown> {
    if (!parameter || !parameter.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(parameter) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
    } catch {
      return {};
    }
  }

  private getStatusFillColor(status?: string | null): string {
    if (status === 'success') {
      return 'FFC6F6D5';
    }
    if (status === 'failed' || status === 'error') {
      return 'FFFEE2E2';
    }
    if (status === 'running') {
      return 'FFDBEAFE';
    }
    return 'FFE5E7EB';
  }

  private applyTableBorders(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ) {
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      const row = sheet.getRow(rowIndex);
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber < startCol || colNumber > endCol) {
          return;
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
        if (!cell.alignment) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    }
  }

  private addArtifactsToZip(zip: AdmZip, profileResultsDir: string) {
    const testCaseDirs = fs
      .readdirSync(profileResultsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const testCaseId of testCaseDirs) {
      const testCaseDir = path.join(profileResultsDir, testCaseId);
      const testCaseName = this.getTestCaseFolderName(testCaseId, testCaseDir);
      const runDirs = fs
        .readdirSync(testCaseDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

      if (runDirs.length === 0) {
        continue;
      }

      const latestRunDir = path.join(testCaseDir, runDirs[runDirs.length - 1]);
      const artifacts: Array<{ name: string; sourcePath: string }> = [];

      const parameterPath = path.join(latestRunDir, 'data', 'parameter.json');
      if (fs.existsSync(parameterPath)) {
        artifacts.push({ name: 'parameter.json', sourcePath: parameterPath });
      }

      const testCasePath = path.join(latestRunDir, 'data', 'test-case.json');
      if (fs.existsSync(testCasePath)) {
        artifacts.push({ name: 'test-case.json', sourcePath: testCasePath });
      }

      const summaryPath = path.join(latestRunDir, 'summary-result.json');
      if (fs.existsSync(summaryPath)) {
        artifacts.push({ name: 'summary-result.json', sourcePath: summaryPath });
      }

      if (artifacts.length === 0) {
        continue;
      }

      const artifactFolder = path.posix.join('artifacts', testCaseName);

      for (const artifact of artifacts) {
        zip.addFile(
          path.posix.join(artifactFolder, artifact.name),
          fs.readFileSync(artifact.sourcePath)
        );
      }
    }
  }

  private getTestCaseFolderName(testCaseId: string, testCaseDir: string): string {
    const testCase = TestCaseRepository.getById(testCaseId);
    if (!testCase) {
      const fromArtifact = this.readTestCaseNameFromArtifacts(testCaseDir);
      return fromArtifact ? this.sanitizeFolderName(fromArtifact) : testCaseId;
    }
    return this.sanitizeFolderName(testCase.name || testCaseId);
  }

  private sanitizeFolderName(value: string): string {
    const sanitized = value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
    return sanitized || 'test-case';
  }

  private readTestCaseNameFromArtifacts(testCaseDir: string): string | null {
    try {
      const runDir = fs
        .readdirSync(testCaseDir, { withFileTypes: true })
        .find((entry) => entry.isDirectory());
      if (!runDir) {
        return null;
      }

      const testCasePath = path.join(testCaseDir, runDir.name, 'data', 'test-case.json');
      if (!fs.existsSync(testCasePath)) {
        return null;
      }

      const raw = fs.readFileSync(testCasePath, 'utf8');
      const parsed = JSON.parse(raw) as { name?: string };
      if (typeof parsed.name === 'string' && parsed.name.trim()) {
        return parsed.name.trim();
      }
    } catch {
      return null;
    }

    return null;
  }

  private buildSummaryStats(
    testCases: Array<{
      status?: string | null;
      executionDuration?: number | null;
    }>
  ) {
    const total = testCases.length;
    const totalSuccess = testCases.filter((item) => item.status === 'success').length;
    const totalFailed = testCases.filter((item) => item.status === 'failed').length;
    const totalError = testCases.filter((item) => item.status === 'error').length;
    const totalRunning = testCases.filter((item) => item.status === 'running').length;
    const durations = testCases
      .map((item) => item.executionDuration)
      .filter((value): value is number => typeof value === 'number' && value >= 0);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : null;

    return {
      total,
      totalSuccess,
      totalFailed,
      totalError,
      totalRunning,
      avgDuration,
    };
  }

  private buildReportBaseName(profileName: string): string {
    const slug = profileName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const timestamp = this.formatTimestamp(new Date());
    return `test-cases-report-${slug || 'profile'}-${timestamp}`;
  }

  private formatTimestamp(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}${pad(
      value.getHours()
    )}${pad(value.getMinutes())}${pad(value.getSeconds())}`;
  }

  private getLatestResultSummary(
    profileId: string,
    testCaseId: string,
    executionCount: number
  ): LatestResultSummary | null {
    if (executionCount <= 0) {
      return null;
    }

    const formattedExecutionCount = String(executionCount).padStart(4, '0');
    const summaryResultPath = path.join(
      FILE_PATHS.RESULTS,
      profileId,
      testCaseId,
      `${testCaseId}-${formattedExecutionCount}`,
      'summary-result.json'
    );

    if (!fs.existsSync(summaryResultPath)) {
      return null;
    }

    try {
      const rawContent = fs.readFileSync(summaryResultPath, 'utf8');
      if (!rawContent.trim()) {
        return null;
      }

      return JSON.parse(rawContent) as LatestResultSummary;
    } catch {
      return null;
    }
  }
}

export default new TestCaseService();
