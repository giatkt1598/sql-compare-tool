import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import SqlCodeEditor from '../common/SqlCodeEditor';

export interface SqlQueryPreviewDialogValue {
  sqlProvider: string;
  oldSql: string;
  newSql: string;
  oldSqlFilePath: string;
  newSqlFilePath: string;
  oldSqlSourceLabel: string;
  newSqlSourceLabel: string;
}

interface SqlQueryPreviewDialogProps {
  open: boolean;
  value: SqlQueryPreviewDialogValue | null;
  activeTab: 'old' | 'new';
  onClose: () => void;
  onTabChange: (value: 'old' | 'new') => void;
  onValueChange: (value: SqlQueryPreviewDialogValue | null) => void;
}

function SqlQueryPreviewDialog({
  open,
  value,
  activeTab,
  onClose,
  onTabChange,
  onValueChange,
}: SqlQueryPreviewDialogProps) {
  const editorValue = activeTab === 'old' ? (value?.oldSql ?? '') : (value?.newSql ?? '');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            height: '80vh',
          },
        },
      }}
    >
      <DialogTitle>
        Preview SQL Query{value ? ` (${value.sqlProvider})` : ''}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Tabs value={activeTab} onChange={(_event, nextValue: 'old' | 'new') => onTabChange(nextValue)}>
          <Tab label="Old SQL" value="old" />
          <Tab label="New SQL" value="new" />
        </Tabs>

        <Box
          sx={{
            mt: 2,
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            gap: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {activeTab === 'old'
              ? (value?.oldSqlSourceLabel ?? value?.oldSqlFilePath ?? '')
              : (value?.newSqlSourceLabel ?? value?.newSqlFilePath ?? '')}
          </Typography>

          <SqlCodeEditor
            value={editorValue}
            minHeight="100%"
            onChange={(nextValue) =>
              onValueChange(
                value
                  ? activeTab === 'old'
                    ? { ...value, oldSql: nextValue }
                    : { ...value, newSql: nextValue }
                  : value
              )
            }
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default SqlQueryPreviewDialog;
