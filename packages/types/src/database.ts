export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface Migration {
  id: number;
  name: string;
  executed_at?: Date;
}