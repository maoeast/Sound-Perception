import { useRef, useState } from 'react'
import PinDialog from './pin-dialog'
import {
  getSettingsStore,
  type AdminSettingsStore,
} from './settings-store'

type AdminEntryProps = {
  onUnlocked?: () => void
  settingsStore?: AdminSettingsStore
}

const noop = () => {}

export default function AdminEntry({
  onUnlocked = noop,
  settingsStore = getSettingsStore(),
}: AdminEntryProps) {
  const tapCountRef = useRef(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogEpoch, setDialogEpoch] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  function handleHotspotClick() {
    tapCountRef.current += 1

    if (tapCountRef.current < 5) {
      return
    }

    tapCountRef.current = 0
    setDialogEpoch((currentEpoch) => currentEpoch + 1)
    setDialogOpen(true)
    setErrorMessage(undefined)
  }

  function handleClose() {
    setDialogOpen(false)
    tapCountRef.current = 0
    setErrorMessage(undefined)
  }

  async function handleSubmit(pin: string) {
    const isValid = await settingsStore.verifyTeacherPin(pin)

    if (!isValid) {
      setErrorMessage('教师口令不正确，请重试。')
      return
    }

    handleClose()
    onUnlocked()
  }

  return (
    <>
      <button
        aria-label="教师入口"
        className="teacher-entry-hotspot"
        onClick={handleHotspotClick}
        type="button"
      />

      <PinDialog
        errorMessage={errorMessage}
        key={dialogEpoch}
        onClose={handleClose}
        onSubmit={handleSubmit}
        open={dialogOpen}
      />
    </>
  )
}
