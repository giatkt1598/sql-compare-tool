import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

interface SqlParameterHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

function SqlParameterHelpDialog({ open, onClose }: SqlParameterHelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        SQL Parameters Help
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2">
            SQL Parameters is a JSON object used to provide input values for your SQL query
            placeholders. The keys should match the parameter names configured for the profile.
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">JSON Example</Typography>
            <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 12 }}>
              {`{
  "id": 1,
  "email": "john.doe@mail.com",
  "enabled": true
}`}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Array to JSON</Typography>
            <Typography variant="body2">
              If you paste a JavaScript array, the system will map values in order of the configured
              SQL parameters.
            </Typography>
            <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 12 }}>
              {`[1, "john.doe@mail.com", true]`}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">CSV to JSON</Typography>
            <Typography variant="body2">
              You can also paste a CSV row. Values will be mapped in the same order.
            </Typography>
            <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 12 }}>
              {`1, john.doe@mail.com, true`}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default SqlParameterHelpDialog;
