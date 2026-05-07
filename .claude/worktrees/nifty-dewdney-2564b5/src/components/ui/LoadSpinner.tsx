export function LoadSpinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid var(--border2)',
        borderTopColor: 'var(--lime)',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }}
    />
  )
}
