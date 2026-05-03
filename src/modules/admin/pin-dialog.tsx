import { useState, type FormEvent } from 'react'

type PinDialogProps = {
  errorMessage?: string
  onClose?: () => void
  onSubmit?: (pin: string) => Promise<void> | void
  open?: boolean
}

const noop = () => {}

export default function PinDialog({
  errorMessage,
  onClose = noop,
  onSubmit = noop,
  open = false,
}: PinDialogProps) {
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pin.length !== 4) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(pin)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pin-dialog-backdrop">
      <div
        aria-labelledby="teacher-pin-title"
        aria-modal="true"
        className="pin-dialog"
        role="dialog"
      >
        <p className="section-eyebrow">教师入口</p>
        <h2 id="teacher-pin-title">请输入 4 位教师口令</h2>

        <form className="pin-form" onSubmit={handleSubmit}>
          <label className="pin-form__label" htmlFor="teacher-pin-input">
            教师口令
          </label>
          <input
            aria-label="教师口令"
            autoComplete="one-time-code"
            className="pin-form__input"
            id="teacher-pin-input"
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, '').slice(0, 4)
              setPin(nextValue)
            }}
            pattern="[0-9]{4}"
            value={pin}
          />

          <p className="pin-form__hint" role="status">
            {errorMessage ?? '连续点击隐藏热区 5 次后可进入教师管理台。'}
          </p>

          <div className="pin-form__actions">
            <button
              className="secondary-action"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="primary-action"
              disabled={pin.length !== 4 || isSubmitting}
              type="submit"
            >
              进入教师台
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
