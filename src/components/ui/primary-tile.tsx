import { useId } from 'react'

type PrimaryTileTone = 'blue' | 'orange'
type PrimaryTileIcon = 'explore' | 'guided'

type PrimaryTileProps = {
  description: string
  icon: PrimaryTileIcon
  onClick?: () => void
  title: string
  tone: PrimaryTileTone
}

function renderPrimaryTileIcon(icon: PrimaryTileIcon) {
  if (icon === 'guided') {
    return (
      <svg
        aria-hidden="true"
        className="primary-tile__icon-svg"
        data-testid="primary-tile-icon-guided"
        viewBox="0 0 96 96"
      >
        <circle
          cx="48"
          cy="48"
          fill="none"
          opacity="0.28"
          r="30"
          stroke="currentColor"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          fill="none"
          r="18"
          stroke="currentColor"
          strokeWidth="8"
        />
        <circle cx="48" cy="48" fill="currentColor" r="7" />
        <path
          d="M66 26c6 3 10 9 12 15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="6"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="primary-tile__icon-svg"
      data-testid="primary-tile-icon-explore"
      viewBox="0 0 96 96"
    >
      <path
        d="M26 58V38c0-3 2-5 5-5h12l15-12a3 3 0 0 1 5 2v50a3 3 0 0 1-5 2L43 63H31c-3 0-5-2-5-5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <path
        d="M70 37c4 3 7 7 8 11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <path
        d="M72 26c8 5 13 13 15 22"
        fill="none"
        opacity="0.55"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <path
        d="M70 59c4-2 7-6 8-10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  )
}

export default function PrimaryTile({
  description,
  icon,
  onClick,
  title,
  tone,
}: PrimaryTileProps) {
  const descriptionId = useId()

  return (
    <button
      aria-describedby={descriptionId}
      aria-label={title}
      className={`primary-tile primary-tile--${tone}`}
      onClick={onClick}
      type="button"
    >
      <span className="primary-tile__icon">{renderPrimaryTileIcon(icon)}</span>
      <span className="primary-tile__title">{title}</span>
      <span className="primary-tile__description" id={descriptionId}>
        {description}
      </span>
    </button>
  )
}
