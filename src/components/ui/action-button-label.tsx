type ActionButtonIcon = 'back-home' | 'exit-app' | 'teacher-entry'

type ActionButtonLabelProps = {
  icon: ActionButtonIcon
  text: string
}

function renderActionButtonIcon(icon: ActionButtonIcon) {
  if (icon === 'back-home') {
    return (
      <svg
        aria-hidden="true"
        className="secondary-action__icon-svg"
        data-testid="action-icon-back-home"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" fill="currentColor" opacity="0.12" r="9.5" />
        <path
          d="M10 7.5 5.2 12l4.8 4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.6"
        />
        <path
          d="M6 12h7.8c2.8 0 5.2 1.8 6 4.6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
      </svg>
    )
  }

  if (icon === 'teacher-entry') {
    return (
      <svg
        aria-hidden="true"
        className="secondary-action__icon-svg"
        data-testid="action-icon-teacher-entry"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" fill="currentColor" opacity="0.12" r="9.5" />
        <path
          d="M12 6 6 8.8 12 12l6-3.2L12 6Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path
          d="M8 11.3V14c0 1.5 1.9 2.9 4 2.9s4-1.4 4-2.9v-2.7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <path
          d="M18.6 9.1v4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="secondary-action__icon-svg"
      data-testid="action-icon-exit-app"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" fill="currentColor" opacity="0.12" r="9.5" />
      <path
        d="M14.5 7.2h2.8v9.6h-2.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M10.2 8.6 6.7 12l3.5 3.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M7.4 12h8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  )
}

export default function ActionButtonLabel({
  icon,
  text,
}: ActionButtonLabelProps) {
  return (
    <span className="secondary-action__content">
      <span className="secondary-action__icon secondary-action__icon--playful">
        {renderActionButtonIcon(icon)}
      </span>
      <span>{text}</span>
    </span>
  )
}
