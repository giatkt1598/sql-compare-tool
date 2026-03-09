import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import TuneIcon from '@mui/icons-material/Tune';

export interface MultiSelectFilterItem {
  value: string;
  label: string;
  count: number;
}

interface MultiSelectFilterProps {
  items: MultiSelectFilterItem[];
  selectedValues: string[];
  onApply: (selectedValues: string[]) => void;
  tooltipLabel?: string;
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((item) => right.includes(item));
}

export default function MultiSelectFilter({
  items,
  selectedValues,
  onApply,
  tooltipLabel = 'Column Settings',
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchText, setSearchText] = useState('');
  const [draftSelectedValues, setDraftSelectedValues] = useState<string[]>(selectedValues);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase();
    if (!normalizedSearchText) {
      return items;
    }

    return items.filter((item) => item.label.toLowerCase().includes(normalizedSearchText));
  }, [items, searchText]);

  const allSelected = items.length > 0 && draftSelectedValues.length === items.length;
  const partiallySelected = draftSelectedValues.length > 0 && !allSelected;

  const toggleValue = (value: string) => {
    setDraftSelectedValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleToggleAll = () => {
    setDraftSelectedValues((current) =>
      current.length === items.length ? [] : items.map((item) => item.value)
    );
  };

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setDraftSelectedValues(selectedValues);
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
    setSearchText('');
    if (!arraysEqual(draftSelectedValues, selectedValues)) {
      onApply(draftSelectedValues);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <>
      <Tooltip title={tooltipLabel}>
        <IconButton color="default" onClick={handleOpen} aria-label={tooltipLabel}>
          <TuneIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        disableAutoFocusItem
        MenuListProps={{
          dense: true,
          sx: {
            pt: 0,
          },
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 420,
          },
        }}
      >
        <ListSubheader sx={{ bgcolor: 'background.paper' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search columns"
            value={searchText}
            inputRef={searchInputRef}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ py: 1 }}
          />
        </ListSubheader>

        <MenuItem
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleToggleAll();
          }}
        >
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={partiallySelected}
            icon={
              partiallySelected ? <IndeterminateCheckBoxOutlinedIcon fontSize="small" /> : undefined
            }
            checkedIcon={<CheckBoxOutlinedIcon fontSize="small" />}
          />
          <ListItemText primary="All" />
        </MenuItem>

        {filteredItems.map((item) => (
          <MenuItem
            key={item.value}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleValue(item.value);
            }}
          >
            <Checkbox
              size="small"
              checked={draftSelectedValues.includes(item.value)}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleValue(item.value);
              }}
            />
            <ListItemText primary={item.label} />
            {!!item.count && (
              <Box sx={{ ml: 1 }}>
                <Chip size="small" color="error" label={item.count} />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
