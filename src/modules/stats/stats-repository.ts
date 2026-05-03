import type { Database, QueryValue } from 'sql.js'
import {
  createAppDatabase,
  exportDatabaseBinary,
} from '../../db/db-client'
import { ensureBuiltinAssetsSeeded } from '../assets/bootstrap-assets'
import type { AssetCategory } from '../assets/asset-repository'

export type TrainingMode = 'explore' | 'guided'

export type InteractionEventType =
  | 'play'
  | 'replay'
  | 'skip'
  | 'complete'
  | 'early_exit'

export type StartedTrainingSession = {
  category: AssetCategory | null
  id: string
  mode: TrainingMode
  startedAt: string
}

export type RecordAttemptInput = {
  candidateAssetIds: string[]
  isCorrect: boolean
  selectedAssetId: string | null
  sessionId: string
  targetAssetId: string
}

export type RecordInteractionEventInput = {
  assetId?: string | null
  eventType: InteractionEventType
  sessionId: string
}

export type StartSessionInput = {
  category?: AssetCategory | null
  mode: TrainingMode
}

export type StatsRepository = {
  completeSession(session: StartedTrainingSession): Promise<void>
  recordAttempt(input: RecordAttemptInput): Promise<void>
  recordInteractionEvent(input: RecordInteractionEventInput): Promise<void>
  startSession(input: StartSessionInput): Promise<StartedTrainingSession>
}

export type CategoryAccuracySummary = {
  accuracy: number
  category: AssetCategory
}

export type TrainingSummary = {
  categoryAccuracy: CategoryAccuracySummary[]
  explorePlayCount: number
  guidedAccuracy: number
  totalDurationMs: number
  totalSessions: number
}

type CreateStatsRepositoryOptions = {
  database?: Database
  saveSnapshot?: (binary: Uint8Array) => Promise<void>
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
}

function readNumericValue(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  return Number(value ?? 0)
}

function getDurationMs(startedAt: string) {
  const durationMs = Date.now() - new Date(startedAt).getTime()

  return Number.isFinite(durationMs) ? Math.max(durationMs, 0) : 0
}

async function safelyLoadSnapshot() {
  try {
    const { loadDatabaseBinary } = await import('../../db/db-storage')
    return await loadDatabaseBinary()
  } catch {
    return null
  }
}

async function safelySaveSnapshot(binary: Uint8Array) {
  try {
    const { saveDatabaseBinary } = await import('../../db/db-storage')
    await saveDatabaseBinary(binary)
  } catch {
    // Browser-only preview and tests can run without the Tauri filesystem bridge.
  }
}

async function createRuntimeDatabase() {
  const binary = await safelyLoadSnapshot()
  const db = await createAppDatabase(binary ?? undefined)

  await ensureBuiltinAssetsSeeded({ db })

  return db
}

export async function loadTrainingSummary(): Promise<TrainingSummary> {
  const db = await createRuntimeDatabase()
  const totalSessions = readNumericValue(
    db.exec('select count(*) from sessions')[0]?.values[0]?.[0],
  )
  const totalDurationMs = readNumericValue(
    db.exec('select coalesce(sum(duration_ms), 0) from sessions')[0]?.values[0]?.[0],
  )
  const explorePlayCount = readNumericValue(
    db.exec(
      `
        select count(*)
        from interaction_events
        inner join sessions on sessions.id = interaction_events.session_id
        where sessions.mode = 'explore'
          and interaction_events.event_type = 'play'
      `,
    )[0]?.values[0]?.[0],
  )
  const attemptsRow = db.exec(
    `
      select
        coalesce(sum(is_correct), 0),
        count(*)
      from attempts
    `,
  )[0]?.values[0]
  const correctCount = readNumericValue(attemptsRow?.[0])
  const attemptCount = readNumericValue(attemptsRow?.[1])
  const categoryAccuracyRows =
    db.exec(
      `
        select
          assets.category,
          coalesce(sum(attempts.is_correct), 0),
          count(*)
        from attempts
        inner join assets on assets.id = attempts.target_asset_id
        group by assets.category
        order by assets.category asc
      `,
    )[0]?.values ?? []

  return {
    categoryAccuracy: categoryAccuracyRows.map((row) => {
      const total = readNumericValue(row[2])

      return {
        accuracy: total === 0 ? 0 : (readNumericValue(row[1]) / total) * 100,
        category: String(row[0]) as AssetCategory,
      }
    }),
    explorePlayCount,
    guidedAccuracy: attemptCount === 0 ? 0 : (correctCount / attemptCount) * 100,
    totalDurationMs,
    totalSessions,
  }
}

export function createStatsRepository(
  options: CreateStatsRepositoryOptions = {},
): StatsRepository {
  const { database, saveSnapshot } = options
  let databasePromise: Promise<Database> | null = database
    ? Promise.resolve(database)
    : null

  async function getDatabase() {
    if (!databasePromise) {
      databasePromise = createRuntimeDatabase()
    }

    return databasePromise
  }

  async function persistDatabase() {
    const db = await getDatabase()
    const binary = exportDatabaseBinary(db)

    if (saveSnapshot) {
      await saveSnapshot(binary)
      return
    }

    await safelySaveSnapshot(binary)
  }

  return {
    async startSession({
      category = null,
      mode,
    }: StartSessionInput): Promise<StartedTrainingSession> {
      const db = await getDatabase()
      const session: StartedTrainingSession = {
        category,
        id: createId('session'),
        mode,
        startedAt: nowIso(),
      }

      db.run(
        `
          insert into sessions (
            id,
            mode,
            category,
            started_at,
            ended_at,
            duration_ms
          )
          values (?, ?, ?, ?, null, 0)
        `,
        [
          session.id,
          session.mode,
          session.category,
          session.startedAt,
        ] satisfies QueryValue[],
      )

      await persistDatabase()

      return session
    },

    async recordAttempt({
      candidateAssetIds,
      isCorrect,
      selectedAssetId,
      sessionId,
      targetAssetId,
    }: RecordAttemptInput) {
      const db = await getDatabase()

      db.run(
        `
          insert into attempts (
            id,
            session_id,
            target_asset_id,
            candidate_asset_ids_json,
            selected_asset_id,
            is_correct,
            answered_at
          )
          values (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          createId('attempt'),
          sessionId,
          targetAssetId,
          JSON.stringify(candidateAssetIds),
          selectedAssetId,
          isCorrect ? 1 : 0,
          nowIso(),
        ] satisfies QueryValue[],
      )

      await persistDatabase()
    },

    async recordInteractionEvent({
      assetId = null,
      eventType,
      sessionId,
    }: RecordInteractionEventInput) {
      const db = await getDatabase()

      db.run(
        `
          insert into interaction_events (
            id,
            session_id,
            asset_id,
            event_type,
            event_at
          )
          values (?, ?, ?, ?, ?)
        `,
        [
          createId('event'),
          sessionId,
          assetId,
          eventType,
          nowIso(),
        ] satisfies QueryValue[],
      )

      await persistDatabase()
    },

    async completeSession(session: StartedTrainingSession) {
      const db = await getDatabase()
      const endedAt = nowIso()

      db.run(
        `
          update sessions
          set ended_at = ?, duration_ms = ?
          where id = ?
        `,
        [endedAt, getDurationMs(session.startedAt), session.id] satisfies QueryValue[],
      )

      await persistDatabase()
    },
  }
}

const sharedStatsRepository = createStatsRepository()

export function getStatsRepository() {
  return sharedStatsRepository
}
