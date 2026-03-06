import type { SqlConnection } from '../../../models/profile';

export interface ConnectionFieldsProps {
  connection: SqlConnection;
  onChange: (next: Partial<SqlConnection>) => void;
}
