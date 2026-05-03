declare module 'sql.js' {
  export type QueryValue = number | string | Uint8Array | null

  export interface QueryExecResult {
    columns: string[]
    values: QueryValue[][]
  }

  export interface Database {
    exec(sql: string): QueryExecResult[]
    run(sql: string, params?: QueryValue[]): void
    export(): Uint8Array
  }

  export interface DatabaseConstructor {
    new (data?: Uint8Array): Database
  }

  export interface InitSqlJsConfig {
    locateFile?: (file: string) => string
  }

  export interface SqlJsStatic {
    Database: DatabaseConstructor
  }

  export default function initSqlJs(
    config?: InitSqlJsConfig,
  ): Promise<SqlJsStatic>
}
