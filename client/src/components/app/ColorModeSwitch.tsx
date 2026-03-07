import { styled, Switch, Tooltip } from '@mui/material';
import type { PaletteMode, SwitchProps } from '@mui/material';

const StyledColorModeSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(() => ({
  width: 82,
  height: 38,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '260ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transform: 'translateX(0)',
    '&.Mui-checked': {
      transform: 'translateX(46px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#ff5a0a',
        borderColor: 'rgba(255, 132, 73, 0.55)',
        opacity: 1,
        '&::before': {
          opacity: 1,
          transform: 'translateY(-50%) scale(1)',
        },
        '&::after': {
          opacity: 0,
          transform: 'translateY(-50%) scale(0.75)',
        },
      },
    },
    '&:not(.Mui-checked) + .MuiSwitch-track': {
      '&::before': {
        opacity: 0,
        transform: 'translateY(-50%) scale(0.75)',
      },
      '&::after': {
        opacity: 1,
        transform: 'translateY(-50%) scale(1)',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 34,
    height: 34,
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 18px rgba(8, 11, 17, 0.24)',
    transition: 'background-color 260ms ease, box-shadow 260ms ease, transform 260ms ease',
  },
  '& .MuiSwitch-track': {
    borderRadius: 999,
    opacity: 1,
    backgroundColor: '#141522',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxSizing: 'border-box',
    position: 'relative',
    transition: 'background-color 260ms ease, border-color 260ms ease',
    '&::before, &::after': {
      position: 'absolute',
      top: '50%',
      width: 18,
      height: 18,
      content: '""',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '18px 18px',
      transition: 'opacity 220ms ease, transform 220ms ease',
    },
    '&::before': {
      left: 12,
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M4.93 4.93l2.12 2.12"/><path d="M16.95 16.95l2.12 2.12"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="M4.93 19.07l2.12-2.12"/><path d="M16.95 7.05l2.12-2.12"/></svg>'
      )}")`,
    },
    '&::after': {
      right: 12,
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7.5 7.5 0 0 0 9.8 9.8Z"/></svg>'
      )}")`,
    },
  },
}));

type ColorModeSwitchProps = {
  colorMode: PaletteMode;
  onToggle: () => void;
};

function ColorModeSwitch({ colorMode, onToggle }: ColorModeSwitchProps) {
  return (
    <Tooltip title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <StyledColorModeSwitch
        checked={colorMode === 'light'}
        onChange={onToggle}
        inputProps={{ 'aria-label': 'toggle color mode' }}
      />
    </Tooltip>
  );
}

export default ColorModeSwitch;
