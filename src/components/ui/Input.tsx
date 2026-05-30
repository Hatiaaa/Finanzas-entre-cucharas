import { forwardRef } from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full bg-[#0E1420] text-white px-4 py-2.5 rounded-xl
          border ${error ? 'border-negative' : 'border-[#2A2F42]'}
          focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30
          placeholder:text-[#4b5563] transition-colors
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-negative text-xs px-1">{error}</p>}
      {!error && hint && <p className="text-[#4b5563] text-xs px-1">{hint}</p>}
    </div>
  )
)

Input.displayName = 'Input'
