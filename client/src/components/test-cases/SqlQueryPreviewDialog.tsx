import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

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
        }}
      >
        <Tabs value={activeTab} onChange={(_event, nextValue: 'old' | 'new') => onTabChange(nextValue)}>
          <Tab label="Old SQL" value="old" />
          <Tab label="New SQL" value="new" />
        </Tabs>

        <Stack spacing={1.5} sx={{ mt: 2, flex: 1, minHeight: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 'old'
              ? (value?.oldSqlSourceLabel ?? value?.oldSqlFilePath ?? '')
              : (value?.newSqlSourceLabel ?? value?.newSqlFilePath ?? '')}
          </Typography>

          <TextField
            value={activeTab === 'old' ? (value?.oldSql ?? '') : (value?.newSql ?? '')}
            onChange={(event) =>
              onValueChange(
                value
                  ? activeTab === 'old'
                    ? { ...value, oldSql: event.target.value }
                    : { ...value, newSql: event.target.value }
                  : value
              )
            }
            multiline
            fullWidth
            sx={{
              flex: 1,
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'stretch',
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 13,
              },
            }}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default SqlQueryPreviewDialog;
