import Papa from 'papaparse'
import type { CsvPartRow, LegoPart } from './types'

const CSV_FIELDS = [
  'TeilID',
  'Farbe',
  'Menge im A',
  'Menge in B',
  'nutzbar',
  'Restmangel',
  'kurzer Teilname',
] as const

const toNumber = (value: unknown) => {
  const normalized = String(value ?? '').replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const clean = (value: unknown) => String(value ?? '').trim()

export function mapCsvRow(row: Partial<CsvPartRow>, index: number): LegoPart | null {
  const partId = clean(row.TeilID)
  const colorId = clean(row.Farbe)

  if (!partId && !colorId) {
    return null
  }

  return {
    id: `${partId}-${colorId}-${index}`,
    partId,
    colorId,
    quantityRequired: toNumber(row['Menge im A']),
    quantityOwned: toNumber(row['Menge in B']),
    usable: toNumber(row.nutzbar),
    missing: toNumber(row.Restmangel),
    shortName: clean(row['kurzer Teilname']),
    externalUrl: partId ? `https://rebrickable.com/parts/${encodeURIComponent(partId)}/` : undefined,
  }
}

export function parsePartsCsv(file: File): Promise<LegoPart[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Partial<CsvPartRow>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0].message))
          return
        }

        resolve(
          result.data
            .map((row, index) => mapCsvRow(row, index))
            .filter((part): part is LegoPart => part !== null),
        )
      },
      error: (error) => reject(error),
    })
  })
}

export function parsePartsCsvText(csvText: string): LegoPart[] {
  const result = Papa.parse<Partial<CsvPartRow>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message)
  }

  return result.data
    .map((row, index) => mapCsvRow(row, index))
    .filter((part): part is LegoPart => part !== null)
}

export function exportPartsCsv(parts: LegoPart[]) {
  return Papa.unparse({
    fields: [...CSV_FIELDS],
    data: parts.map((part) => ({
      TeilID: part.partId,
      Farbe: part.colorId,
      'Menge im A': part.quantityRequired,
      'Menge in B': part.quantityOwned,
      nutzbar: part.usable,
      Restmangel: part.missing,
      'kurzer Teilname': part.shortName,
    })),
  })
}
