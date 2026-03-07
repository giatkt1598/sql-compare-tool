import type { SvgIconProps } from '@mui/material';
import type { ComponentType } from 'react';
import type { SqlConnection, SqlProvider } from '../../../models/profile';

export interface ConnectionFieldsProps {
  connection: SqlConnection;
  onChange: (next: Partial<SqlConnection>) => void;
}

export interface ConnectionFieldConfig {
  provider: SqlProvider;
  label: string;
  icon: ComponentType<SvgIconProps>;
  defaultConnection: SqlConnection;
  component: ComponentType<ConnectionFieldsProps>;
}
