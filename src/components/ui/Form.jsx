/**
 * Form primitives: label + control + inline error in one consistent layout.
 * `id` is required so labels are programmatically associated (a11y).
 */

export function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field${error ? " field-invalid" : ""}`}>
      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ id, label, error, hint, type = "text", ...props }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        type={type}
        aria-invalid={!!error || undefined}
        {...props}
      />
    </Field>
  );
}

export function TextArea({ id, label, error, hint, rows = 4, ...props }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={!!error || undefined}
        {...props}
      />
    </Field>
  );
}

export function Select({ id, label, error, hint, options = [], placeholder, ...props }) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select id={id} aria-invalid={!!error || undefined} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    </Field>
  );
}
