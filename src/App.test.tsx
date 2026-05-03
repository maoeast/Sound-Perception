import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => false,
}))

import App from './App'

describe('App', () => {
  it('renders the home screen in browser preview mode without Tauri fs access', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '自由探索' })).toBeInTheDocument()
    })
  })
})
