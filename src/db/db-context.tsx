/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, type ReactNode } from 'react'
import type { Database } from 'sql.js'

export const DbContext = createContext<Database | null>(null)

type DbProviderProps = {
  children: ReactNode
  value: Database | null
}

export function DbProvider({ children, value }: DbProviderProps) {
  return <DbContext.Provider value={value}>{children}</DbContext.Provider>
}

export function useDb() {
  const db = useContext(DbContext)

  if (!db) {
    throw new Error('DbContext is not ready')
  }

  return db
}
