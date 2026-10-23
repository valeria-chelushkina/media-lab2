export function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function baseName(filePath?: string): string {
  if (!filePath) return 'sonification'
  const name = filePath.split(/[\\/]/).pop() ?? 'sonification'
  return name.replace(/\.[^.]+$/, '') || 'sonification'
}

export function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
