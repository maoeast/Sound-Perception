import { useEffect, useState } from 'react'
import type { Database } from 'sql.js'
import AppRouter from './app/router'
import { createAppDatabase, exportDatabaseBinary } from './db/db-client'
import { DbProvider } from './db/db-context'
import { loadDatabaseBinary, saveDatabaseBinary } from './db/db-storage'
import { ensureBuiltinAssetsSeeded } from './modules/assets/bootstrap-assets'

async function loadRuntimeDatabase() {
  const snapshot = await loadDatabaseBinary().catch(() => null)

  const db = await createAppDatabase(snapshot ?? undefined)
  const { seededCount } = await ensureBuiltinAssetsSeeded({ db })

  if (!snapshot || seededCount > 0) {
    try {
      await saveDatabaseBinary(exportDatabaseBinary(db))
    } catch {
      // Preview mode can continue with an in-memory database when Tauri FS is unavailable.
    }
  }

  return db
}

export default function App() {
  const [db, setDb] = useState<Database | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      const runtimeDb = await loadRuntimeDatabase()

      if (!active) {
        return
      }

      setDb(runtimeDb)
    })()

    return () => {
      active = false
    }
  }, [])

  return (
    <DbProvider value={db}>
      {db ? (
        <AppRouter database={db} />
      ) : (
        <main className="app-shell">
          <section className="screen-panel screen-panel--detail">
            <p className="section-eyebrow">系统初始化</p>
            <h1>正在准备训练环境</h1>
            <p className="section-body">
              首次启动会检查本地数据库和默认素材，完成后就能直接开始训练。
            </p>
          </section>
        </main>
      )}
    </DbProvider>
  )
}
