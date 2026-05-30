import { forwardRef } from 'react'

interface Option { value: string; label: string }

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-[#0E1420] text-white px-4 py-2.5 rounded-xl
          border ${error ? 'border-negative' : 'border-[#2A2F42]'}
          focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30
          transition-colors appearance-none cursor-pointer
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-negative text-xs px-1">{error}</p>}
    </div>
  )
)

Select.displayName = 'Select'
