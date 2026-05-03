export const DEFAULT_APP_TITLE = '特殊儿童声音感知训练'

export function normalizeAppTitle(value: unknown) {
  const title = String(value ?? '').trim()

  return title.length > 0 ? title : DEFAULT_APP_TITLE
}
