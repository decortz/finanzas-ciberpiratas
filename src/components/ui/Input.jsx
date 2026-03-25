import './Input.css'

export default function Input({
  label,
  error,
  hint,
  type = 'text',
  id,
  required,
  className = '',
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className="input-field"
        required={required}
        {...props}
      />
      {hint && !error && <span className="input-hint">{hint}</span>}
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}
