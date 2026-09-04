import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export interface FieldProps {
  id: string;
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ id, label, error, hint, children }: FieldProps): JSX.Element {
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

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  type?: string;
}

export function TextField({ id, label, error, hint, type = "text", ...props }: TextFieldProps): JSX.Element {
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

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  rows?: number;
}

export function TextArea({ id, label, error, hint, rows = 4, ...props }: TextAreaProps): JSX.Element {
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

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  options?: (string | SelectOption)[];
  placeholder?: string;
}

export function Select({ id, label, error, hint, options = [], placeholder, ...props }: SelectProps): JSX.Element {
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
