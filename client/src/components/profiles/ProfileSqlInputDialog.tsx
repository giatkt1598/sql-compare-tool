import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

type ProfileSqlInputDialogProps = {
  open: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onChange: (value: string) => void;
};

function ProfileSqlInputDialog({
  open,
  title,
  value,
  onClose,
  onChange,
}: ProfileSqlInputDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Paste SQL content directly. If SQL content is provided, the server will use it instead
            of reading from the file path.
          </Typography>
          <TextField
            multiline
            minRows={16}
            fullWidth
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste SQL here..."
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProfileSqlInputDialog;
