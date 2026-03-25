import './Input.css'

export default function Select({
  label,
  error,
  hint,
  id,
  required,
  className = '',
  children,
  ...props
}) {
  const selectId = id || `select-${Math.random().toString(36).slice(2)}`
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
          {required && <span className="input-required"> *</span>}
        </label>
      )}
      <select id={selectId} className="input-field" required={required} {...props}>
        {children}
      </select>
      {hint && !error && <span className="input-hint">{hint}</span>}
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}
