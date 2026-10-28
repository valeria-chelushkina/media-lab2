import type { SonificationConfig } from '@core/config'
import type { ReactNode } from 'react'

export interface MappingEditorProps {
  columns: string[]
  config: SonificationConfig
  onChange: (config: SonificationConfig) => void
}

export type MappingSectionProps = MappingEditorProps

export interface GlobalSectionProps {
  config: SonificationConfig
  onChange: (config: SonificationConfig) => void
}

export interface MappingSectionWrapperProps {
  title: string
  children: ReactNode
}

export interface FieldProps {
  label: string
  children: ReactNode
  wide?: boolean
}

export interface ColumnSelectProps {
  value: string
  columns: string[]
  onChange: (value: string) => void
}

export interface NumberInputProps {
  value: number
  min: number
  max: number
  step?: number
  integer?: boolean
  onChange: (value: number) => void
}

export interface RangeInputProps {
  minValue: number
  maxValue: number
  min: number
  max: number
  step?: number
  onChange: (min: number, max: number) => void
}
