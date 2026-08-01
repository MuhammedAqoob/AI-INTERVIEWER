'use client';

import React from 'react';

// ==========================================
// Spinner Component
// ==========================================
export function Spinner({ className = 'w-5 h-5 text-brand-600 dark:text-brand-400' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ==========================================
// Button Primitive
// ==========================================
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white dark:bg-brand-600 dark:hover:bg-brand-500 dark:active:bg-brand-700 shadow-brand-500/20',
    secondary:
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 dark:text-slate-100',
    outline:
      'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-none',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white dark:bg-rose-600 dark:hover:bg-rose-500 dark:active:bg-rose-700 shadow-rose-500/20',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner className={`w-4 h-4 ${variant === 'primary' || variant === 'danger' ? 'text-white' : ''}`} />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

// ==========================================
// Input Primitive
// ==========================================
export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  required = false,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
          error
            ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
            : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

// ==========================================
// Textarea Primitive
// ==========================================
export function Textarea({
  label,
  error,
  helperText,
  id,
  rows = 4,
  className = '',
  required = false,
  ...props
}) {
  const areaId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={areaId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${areaId}-error` : helperText ? `${areaId}-helper` : undefined}
        className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
          error
            ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
            : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${areaId}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${areaId}-helper`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

// ==========================================
// Card Primitives
// ==========================================
export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`p-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between ${className}`}>{children}</div>;
}

// ==========================================
// Badge Primitives
// ==========================================
export function Badge({ children, variant = 'default', className = '' }) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-50 text-brand-700 border border-brand-200/60 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/60',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
    info: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

const DIFFICULTY_VARIANTS = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

export function DifficultyBadge({ difficulty = 'EASY' }) {
  const upper = (difficulty || 'EASY').toUpperCase();
  return (
    <Badge variant={DIFFICULTY_VARIANTS[upper] || 'default'}>
      {upper}
    </Badge>
  );
}

const TYPE_VARIANTS = {
  TECHNICAL: 'brand',
  HR: 'info',
  APTITUDE: 'warning',
  RESUME: 'success',
};

export function TypeBadge({ type }) {
  const upper = (type || 'TECHNICAL').toUpperCase();
  return (
    <Badge variant={TYPE_VARIANTS[upper] || 'default'}>
      {upper}
    </Badge>
  );
}

// ==========================================
// Modal & Delete Dialog
// ==========================================
export function Modal({ open, onClose, title, description, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative transition-transform animate-in zoom-in-95 duration-200"
      >
        {title && (
          <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

export function DeleteDialog({ open, onCancel, onConfirm, loading, title = 'Delete session?' }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description="This action is permanent and cannot be undone."
    >
      <div className="flex gap-3 justify-end mt-6">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

// ==========================================
// StatCard
// ==========================================
export function StatCard({ label, value, sub, color = 'text-brand-600 dark:text-brand-400', icon = null }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <p className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ==========================================
// Skeleton Loaders
// ==========================================
export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 w-2/3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
