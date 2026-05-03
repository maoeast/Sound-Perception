import { useEffect, useState } from 'react'
import {
  loadTrainingSummary,
  type TrainingSummary,
} from '../stats/stats-repository'
import type { AssetCategory } from '../assets/asset-repository'

type DashboardScreenProps = {
  summaryLoader?: () => Promise<TrainingSummary>
}

const EMPTY_SUMMARY: TrainingSummary = {
  categoryAccuracy: [],
  explorePlayCount: 0,
  guidedAccuracy: 0,
  totalDurationMs: 0,
  totalSessions: 0,
}

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  animals: '动物',
  daily_life: '日常生活',
  instruments: '乐器',
  nature: '自然',
  transport: '交通',
}

function formatDuration(totalDurationMs: number) {
  const roundedMinutes = Math.max(0, Math.round(totalDurationMs / 60000))
  const hours = Math.floor(roundedMinutes / 60)
  const minutes = roundedMinutes % 60

  if (hours === 0) {
    return `${roundedMinutes} 分钟`
  }

  if (minutes === 0) {
    return `${hours} 小时`
  }

  return `${hours} 小时 ${minutes} 分钟`
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export default function DashboardScreen({
  summaryLoader = loadTrainingSummary,
}: DashboardScreenProps) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY)

  useEffect(() => {
    let active = true

    void (async () => {
      const nextSummary = await summaryLoader()

      if (!active) {
        return
      }

      setSummary(nextSummary)
    })()

    return () => {
      active = false
    }
  }, [summaryLoader])

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <h2>统计看板</h2>
        <p>当前先展示整体训练数据，帮助教师快速判断训练强度与答题趋势。</p>
      </div>

      <div className="dashboard-grid">
        <article className="summary-card">
          <p className="summary-card__label">总训练次数</p>
          <strong className="summary-card__value">{summary.totalSessions}</strong>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">总训练时长</p>
          <strong className="summary-card__value">
            {formatDuration(summary.totalDurationMs)}
          </strong>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">自由探索播放次数</p>
          <strong className="summary-card__value">{summary.explorePlayCount}</strong>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">引导训练正确率</p>
          <strong className="summary-card__value">
            {formatPercent(summary.guidedAccuracy)}
          </strong>
        </article>
      </div>

      <div className="category-summary">
        <h3>各类别正确率</h3>
        {summary.categoryAccuracy.length > 0 ? (
          <div className="category-summary__grid">
            {summary.categoryAccuracy.map((item) => (
              <article className="category-pill" key={item.category}>
                <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
                <strong>{formatPercent(item.accuracy)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="category-summary__empty">
            暂时还没有足够的引导训练数据。
          </p>
        )}
      </div>
    </section>
  )
}
