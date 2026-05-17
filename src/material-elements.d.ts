import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type MaterialElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  disabled?: boolean
  href?: string
  target?: string
  value?: string
  selected?: boolean
  active?: boolean
  indeterminate?: boolean
  label?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-assist-chip': MaterialElementProps
      'md-elevated-card': MaterialElementProps
      'md-filled-button': MaterialElementProps
      'md-filled-tonal-button': MaterialElementProps
      'md-filter-chip': MaterialElementProps
      'md-icon': MaterialElementProps
      'md-icon-button': MaterialElementProps
      'md-linear-progress': MaterialElementProps
      'md-outlined-button': MaterialElementProps
      'md-outlined-text-field': MaterialElementProps
      'md-ripple': MaterialElementProps
    }
  }
}
