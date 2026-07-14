/** Accessible button — the only button in the app (Blueprint §8.4). */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', children, className = '', style, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn-${variant} ${className}`}
      style={{ padding: '10px 18px', fontSize: 14, fontWeight: 600, ...style }}
      {...rest}
    >
      {children}
    </button>
  )
})
