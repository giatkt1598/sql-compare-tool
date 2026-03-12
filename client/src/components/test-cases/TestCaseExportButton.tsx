import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Button, IconButton } from '@mui/material';
import { useState } from 'react';
import { testCaseApi } from '../../apis/testCaseApi';

interface TestCaseExportButtonProps {
  profileId: string;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  iconOnly?: boolean;
}

const fallbackFileName = (profileId: string) =>
  `test-cases-report-${profileId}-${new Date().toISOString()}.zip`;

function getFileNameFromHeaders(headers: Record<string, string | string[] | undefined>) {
  const headerValue = headers['x-report-file-name'];
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue;
  }

  const contentDisposition = headers['content-disposition'];
  if (typeof contentDisposition === 'string') {
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function TestCaseExportButton({
  profileId,
  onError,
  onSuccess,
  iconOnly = false,
}: TestCaseExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!profileId) {
      onError?.('profileId is required');
      return;
    }

    setIsExporting(true);
    try {
      const response = await testCaseApi.exportReport(profileId);
      const fileName =
        getFileNameFromHeaders((response.headers ?? {}) as Record<string, string | undefined>) ??
        fallbackFileName(profileId);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onSuccess?.('Report downloaded');
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Export report failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (iconOnly) {
    return (
      <IconButton color="primary" onClick={() => void handleExport()} disabled={isExporting}>
        <FileDownloadOutlinedIcon />
      </IconButton>
    );
  }

  return (
    <Button
      variant="outlined"
      startIcon={<FileDownloadOutlinedIcon />}
      onClick={() => void handleExport()}
      disabled={isExporting}
    >
      Export
    </Button>
  );
}

export default TestCaseExportButton;
