import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { Box, useTheme } from '@mui/material';

type SqlCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number | string;
};

function SqlCodeEditor({ value, onChange, minHeight = 360 }: SqlCodeEditorProps) {
  const theme = useTheme();

  return (
    <Box
      onWheelCapture={(event) => {
        event.stopPropagation();
      }}
      sx={{
        minHeight,
        height: '100%',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        '& .cm-editor': {
          height: '100%',
          maxHeight: '100%',
          fontSize: 13,
          overflow: 'hidden',
        },
        '& .cm-focused': {
          outline: 'none',
        },
        '& .cm-gutters': {
          minHeight: '100%',
        },
        '& .cm-scroller': {
          fontFamily: 'Consolas, Monaco, monospace',
          height: '100% !important',
          maxHeight: '100%',
          overflow: 'auto !important',
        },
        '& .cm-content': {
          minHeight: '100%',
        },
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        style={{ height: '100%' }}
        extensions={[sql()]}
        theme={theme.palette.mode === 'dark' ? vscodeDark : vscodeLight}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          bracketMatching: true,
          foldGutter: true,
          autocompletion: false,
        }}
        onChange={onChange}
      />
    </Box>
  );
}

export default SqlCodeEditor;
