import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PinDialog from './pin-dialog'

describe('PinDialog', () => {
  it('renders four-digit pin prompt', () => {
    render(<PinDialog open />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('教师口令')).toBeInTheDocument()
  })

  it('submits a four-digit pin value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<PinDialog onSubmit={onSubmit} open />)

    await user.type(screen.getByLabelText('教师口令'), '1234')
    await user.click(screen.getByRole('button', { name: '进入教师台' }))

    expect(onSubmit).toHaveBeenCalledWith('1234')
  })
})
