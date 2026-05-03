// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createAppDatabase } from '../../db/db-client'
import { ensureBuiltinAssetsSeeded } from '../assets/bootstrap-assets'
import { createStatsRepository } from './stats-repository'

describe('createStatsRepository', () => {
  it('writes session, attempt, and interaction records into the database', async () => {
    const db = await createAppDatabase()
    await ensureBuiltinAssetsSeeded({ db })
    const statsRepository = createStatsRepository({
      database: db,
      saveSnapshot: vi.fn().mockResolvedValue(undefined),
    })

    const session = await statsRepository.startSession({
      mode: 'guided',
    })

    await statsRepository.recordInteractionEvent({
      assetId: 'animal-cat-01',
      eventType: 'play',
      sessionId: session.id,
    })
    await statsRepository.recordAttempt({
      candidateAssetIds: ['animal-cat-01', 'nature-rain-01'],
      isCorrect: true,
      selectedAssetId: 'animal-cat-01',
      sessionId: session.id,
      targetAssetId: 'animal-cat-01',
    })
    await statsRepository.completeSession(session)

    expect(db.exec('select count(*) from sessions')[0]?.values[0]?.[0]).toBe(1)
    expect(db.exec('select count(*) from attempts')[0]?.values[0]?.[0]).toBe(1)
    expect(
      db.exec('select count(*) from interaction_events')[0]?.values[0]?.[0],
    ).toBe(1)
    expect(
      db.exec('select is_correct from attempts')[0]?.values[0]?.[0],
    ).toBe(1)
    expect(
      db.exec('select duration_ms from sessions')[0]?.values[0]?.[0],
    ).toBeTypeOf('number')
  })
})
