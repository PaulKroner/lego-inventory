export type CsvPartRow = {
  TeilID: string
  Farbe: string
  'Menge im A': string
  'Menge in B': string
  nutzbar: string
  Restmangel: string
  'kurzer Teilname': string
}

export type LegoPart = {
  id: string
  partId: string
  colorId: string
  quantityRequired: number
  quantityOwned: number
  usable: number
  missing: number
  shortName: string
  colorName?: string
  imageUrl?: string
  externalUrl?: string
}

export type SortKey =
  | 'partId'
  | 'colorId'
  | 'quantityRequired'
  | 'quantityOwned'
  | 'usable'
  | 'missing'
  | 'shortName'

export type SortDirection = 'asc' | 'desc'

export type ActiveFilter = 'usable' | 'missing' | 'owned' | 'required'
